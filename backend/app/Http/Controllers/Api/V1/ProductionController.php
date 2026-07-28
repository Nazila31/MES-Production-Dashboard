<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ProductionStage;
use App\Enums\SalesOrderStatus;
use App\Enums\StageLogStatus;
use App\Http\Controllers\Controller;
use App\Models\QcRejectLog;
use App\Models\SalesOrder;
use App\Support\MesFileRules;
use App\Services\ActivityLogService;
use App\Services\MesNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductionController extends Controller
{
    public function __construct(
        private MesNotificationService $notifications,
        private ActivityLogService $activities,
    ) {}

    public function current(): JsonResponse
    {
        $data = SalesOrder::query()
            ->where('status', SalesOrderStatus::InProduction)
            ->whereNotNull('production_stage')
            ->latest()
            ->get()
            ->map(fn (SalesOrder $so) => $this->transform($so));

        return response()->json(['data' => $data]);
    }

    public function dashboard(): JsonResponse
    {
        $orders = SalesOrder::query()
            ->with(['bomItems', 'workOrder', 'stageLogs'])
            ->where('status', SalesOrderStatus::InProduction)
            ->latest()
            ->get()
            ->map(fn (SalesOrder $so) => $this->transform($so, true));

        return response()->json([
            'data' => [
                'current_project' => $orders->first(),
                'queue' => $orders,
            ],
        ]);
    }

    public function deliveryQueue(): JsonResponse
    {
        $data = SalesOrder::query()
            ->where('status', SalesOrderStatus::ReadyForDelivery)
            ->latest('delivery_note_created_at')
            ->get()
            ->map(fn (SalesOrder $so) => [
                'id' => $so->id,
                'so_number' => $so->so_number,
                'client' => $so->client,
                'delivery_number' => $so->delivery_number,
                'delivery_recipient' => $so->delivery_recipient,
                'delivery_date' => optional($so->delivery_date)?->format('Y-m-d'),
                'delivery_note_notes' => $so->delivery_note_notes,
                'delivery_file_url' => $so->delivery_file_path ? Storage::disk('public')->url($so->delivery_file_path) : null,
            ]);

        return response()->json(['data' => $data]);
    }

    public function completeShipment(Request $request, SalesOrder $salesOrder): JsonResponse
    {
        if ($salesOrder->status !== SalesOrderStatus::ReadyForDelivery) {
            return response()->json(['message' => 'Only projects ready for delivery can be shipped.'], 422);
        }

        $data = $request->validate([
            'tracking_number' => ['required', 'string', 'max:100'],
            'shipment_date' => ['required', 'date'],
            'vehicle_courier' => ['nullable', 'string', 'max:255'],
            'shipment_notes' => ['nullable', 'string', 'max:2000'],
            'file' => MesFileRules::document(),
        ]);

        $proofPath = $salesOrder->shipment_proof_file_path;
        if ($request->hasFile('file')) {
            if ($proofPath) {
                Storage::disk('public')->delete($proofPath);
            }
            $proofPath = $request->file('file')->store('shipment-proofs', 'public');
        }

        $salesOrder->update([
            'tracking_number' => $data['tracking_number'],
            'shipment_date' => $data['shipment_date'],
            'vehicle_courier' => $data['vehicle_courier'] ?? null,
            'shipment_notes' => $data['shipment_notes'] ?? null,
            'shipment_proof_file_path' => $proofPath,
            'status' => SalesOrderStatus::Completed,
            'progress' => 100,
            'completed_at' => now(),
        ]);

        $this->notifications->notifyAdmins(
            'project_completed',
            'Project Delivered',
            "SO {$salesOrder->so_number} has been delivered with tracking {$data['tracking_number']}.",
            $salesOrder,
        );

        $this->activities->log(
            "Shipment completed for {$salesOrder->so_number} with resi {$data['tracking_number']}.",
            'production',
            $request->user(),
            $salesOrder,
        );

        return response()->json([
            'data' => $this->transform($salesOrder->fresh(), true),
            'message' => 'Delivery completed. Project marked as delivered.',
        ]);
    }

    public function startStage(Request $request, SalesOrder $salesOrder, string $stage): JsonResponse
    {
        $stageEnum = ProductionStage::from($stage);

        if ($salesOrder->status !== SalesOrderStatus::InProduction) {
            return response()->json(['message' => 'Sales order is not in production.'], 422);
        }

        if ($salesOrder->production_stage !== $stageEnum) {
            return response()->json(['message' => "Cannot start {$stage}. Current stage is {$salesOrder->production_stage?->value}."], 422);
        }

        $log = $salesOrder->stageLogs()->where('stage', $stageEnum)->firstOrFail();

        if ($log->status === StageLogStatus::InProgress) {
            return response()->json(['message' => 'Stage already in progress.'], 422);
        }

        $log->update([
            'status' => StageLogStatus::InProgress,
            'started_at' => now(),
            'operator_id' => $request->user()->id,
        ]);

        $this->activities->log(
            ucfirst($stage)." started for {$salesOrder->so_number}.",
            'production',
            $request->user(),
            $salesOrder,
        );

        return response()->json([
            'data' => $this->transform($salesOrder->fresh(['stageLogs', 'bomItems', 'workOrder']), true),
            'message' => ucfirst($stage).' started.',
        ]);
    }

    public function finishStage(Request $request, SalesOrder $salesOrder, string $stage): JsonResponse
    {
        $stageEnum = ProductionStage::from($stage);

        if ($salesOrder->production_stage !== $stageEnum) {
            return response()->json(['message' => "Cannot finish {$stage}. Current stage is {$salesOrder->production_stage?->value}."], 422);
        }

        $log = $salesOrder->stageLogs()->where('stage', $stageEnum)->firstOrFail();

        if ($log->status !== StageLogStatus::InProgress) {
            return response()->json(['message' => 'Stage must be started before finishing.'], 422);
        }

        $duration = $log->started_at ? $log->started_at->diffInMinutes(now()) : null;

        $log->update([
            'status' => StageLogStatus::Completed,
            'finished_at' => now(),
            'duration_minutes' => $duration,
            'operator_id' => $request->user()->id,
        ]);

        $next = $stageEnum->next();

        if ($next) {
            $salesOrder->update([
                'production_stage' => $next,
                'progress' => $stageEnum->progress(),
            ]);
        } else {
            $salesOrder->update([
                'status' => SalesOrderStatus::QcPassed,
                'production_stage' => null,
                'progress' => 100,
                'qc_passed_at' => now(),
            ]);

            $this->notifications->notifyAdmins(
                'qc_passed',
                'QC Passed',
                "QC passed for {$salesOrder->so_number}. Ready for delivery finalization.",
                $salesOrder,
            );
        }

        $this->notifications->notifyAdmins(
            'stage_completed',
            ucfirst($stage).' Completed',
            ucfirst($stage)." stage completed for {$salesOrder->so_number}.",
            $salesOrder,
        );

        $this->activities->log(
            ucfirst($stage)." completed for {$salesOrder->so_number}.",
            'production',
            $request->user(),
            $salesOrder,
        );

        return response()->json([
            'data' => $this->transform($salesOrder->fresh(['stageLogs', 'bomItems', 'workOrder']), true),
            'message' => ucfirst($stage).' completed.',
        ]);
    }

    public function passQc(Request $request, SalesOrder $salesOrder): JsonResponse
    {
        return $this->finishStage($request, $salesOrder, ProductionStage::Qc->value);
    }

    public function rejectQc(Request $request, SalesOrder $salesOrder): JsonResponse
    {
        $data = $request->validate([
            'notes' => ['required', 'string', 'max:1000'],
            'return_stage' => ['required', 'in:fabrication,machining,assembly'],
        ]);

        if ($salesOrder->production_stage !== ProductionStage::Qc) {
            return response()->json(['message' => 'QC rejection is only available during QC stage.'], 422);
        }

        $returnStage = ProductionStage::from($data['return_stage']);
        $log = $salesOrder->stageLogs()->where('stage', ProductionStage::Qc)->firstOrFail();

        $log->update([
            'status' => StageLogStatus::Rejected,
            'reject_notes' => $data['notes'],
            'return_to_stage' => $returnStage,
            'finished_at' => now(),
        ]);

        $reset = false;
        foreach (ProductionStage::cases() as $stage) {
            if ($stage === $returnStage) {
                $reset = true;
            }

            if ($reset) {
                $salesOrder->stageLogs()->where('stage', $stage)->update([
                    'status' => StageLogStatus::Pending,
                    'started_at' => null,
                    'finished_at' => null,
                    'duration_minutes' => null,
                    'operator_id' => null,
                    'reject_notes' => $stage === ProductionStage::Qc ? $data['notes'] : null,
                    'return_to_stage' => $stage === ProductionStage::Qc ? $returnStage->value : null,
                ]);
            }
        }

        $progress = match ($returnStage) {
            ProductionStage::Fabrication => 0,
            ProductionStage::Machining => 25,
            ProductionStage::Assembly => 50,
            ProductionStage::Qc => 75,
        };

        $salesOrder->update([
            'status' => SalesOrderStatus::InProduction,
            'production_stage' => $returnStage,
            'progress' => $progress,
            'qc_passed_at' => null,
        ]);

        QcRejectLog::create([
            'sales_order_id' => $salesOrder->id,
            'rejected_by' => $request->user()->id,
            'reject_reason' => $data['notes'],
            'return_to_stage' => $returnStage,
        ]);

        $this->activities->log(
            "QC rejected for {$salesOrder->so_number}. Returned to {$returnStage->value}. Reason: {$data['notes']}",
            'production',
            $request->user(),
            $salesOrder,
        );

        return response()->json([
            'data' => $this->transform($salesOrder->fresh(['stageLogs', 'bomItems', 'workOrder']), true),
            'message' => 'QC rejected. Project returned to '.$returnStage->value.'.',
        ]);
    }

    private function transform(SalesOrder $salesOrder, bool $detailed = false): array
    {
        $data = [
            'id' => $salesOrder->id,
            'so_number' => $salesOrder->so_number,
            'client' => $salesOrder->client,
            'machine' => $salesOrder->machine,
            'status' => $salesOrder->status->value,
            'production_stage' => $salesOrder->production_stage?->value,
            'progress' => $salesOrder->progress,
            'deadline' => optional($salesOrder->deadline)?->format('Y-m-d'),
        ];

        if ($detailed) {
            $data['bom_items'] = $salesOrder->bomItems;
            $data['work_order'] = $salesOrder->workOrder;
            $data['stage_logs'] = $salesOrder->stageLogs->map(fn ($log) => [
                'stage' => $log->stage->value,
                'status' => $log->status->value,
                'started_at' => $log->started_at?->toIso8601String(),
                'finished_at' => $log->finished_at?->toIso8601String(),
                'operator' => $log->operator?->name,
                'duration_minutes' => $log->duration_minutes,
                'reject_notes' => $log->reject_notes,
            ]);
        }

        return $data;
    }
}
