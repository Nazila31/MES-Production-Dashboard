<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ProductionStage;
use App\Enums\QuotationStatus;
use App\Enums\SalesOrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Quotation;
use App\Models\SalesOrder;
use App\Services\ActivityLogService;
use App\Services\MesNotificationService;
use App\Support\MesFileRules;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SalesOrderController extends Controller
{
    public function __construct(
        private MesNotificationService $notifications,
        private ActivityLogService $activities,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = SalesOrder::query()->with('quotation')->latest();

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($builder) use ($search) {
                $builder->where('so_number', 'like', "%{$search}%")
                    ->orWhere('client', 'like', "%{$search}%");
            });
        }

        $paginated = $query->paginate($request->integer('per_page', 15));

        return response()->json([
            'data' => $paginated->getCollection()->map(fn (SalesOrder $so) => $this->transform($so)),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    public function show(SalesOrder $salesOrder): JsonResponse
    {
        $salesOrder->load(['quotation', 'stageLogs.operator', 'workOrder', 'bomItems', 'qcRejectLogs.rejector']);

        return response()->json(['data' => $this->transform($salesOrder, true)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'quotation_id' => ['required', 'exists:quotations,id'],
            'so_number' => ['required', 'string', 'max:50', 'unique:sales_orders,so_number'],
            'spk_global' => ['required', 'string', 'max:50', 'unique:sales_orders,spk_global'],
            'file' => MesFileRules::document(),
        ]);

        $quotation = Quotation::query()->findOrFail($data['quotation_id']);

        if ($quotation->status !== QuotationStatus::Approved) {
            return response()->json(['message' => 'Only approved quotations can be converted to Sales Order.'], 422);
        }

        if ($quotation->salesOrder) {
            return response()->json(['message' => 'Sales Order already exists for this quotation.'], 422);
        }

        $soNumber = $data['so_number'];
        $fileMeta = $this->storeFile($request);

        $salesOrder = SalesOrder::create([
            'so_number' => $soNumber,
            'quotation_id' => $quotation->id,
            'spk_global' => $data['spk_global'],
            'client' => $quotation->client,
            'pic' => $quotation->pic,
            'machine' => $quotation->machine,
            'status' => SalesOrderStatus::WaitingPpic,
            'progress' => 0,
            'start_date' => now()->toDateString(),
            'deadline' => $quotation->deadline,
            'description' => $quotation->description,
            'created_by' => $request->user()->id,
            ...$fileMeta,
        ]);

        $this->notifications->notifyPpic(
            'so_created',
            'Sales Order Created',
            "SO {$salesOrder->so_number} for {$salesOrder->client} is ready for PPIC planning.",
            $salesOrder,
        );

        $this->activities->log(
            "Sales Order {$salesOrder->so_number} created from {$quotation->quotation_number}.",
            'admin',
            $request->user(),
            $salesOrder,
        );

        return response()->json([
            'data' => $this->transform($salesOrder),
            'message' => 'Sales Order created successfully.',
        ], 201);
    }

    public function createDeliveryNote(Request $request, SalesOrder $salesOrder): JsonResponse
    {
        if ($salesOrder->status !== SalesOrderStatus::QcPassed) {
            return response()->json(['message' => 'Only QC passed projects can create a delivery note.'], 422);
        }

        $data = $request->validate([
            'delivery_number' => ['required', 'string', 'max:100'],
            'delivery_date' => ['required', 'date'],
            'delivery_recipient' => ['required', 'string', 'max:255'],
            'delivery_note_notes' => ['nullable', 'string', 'max:2000'],
            'file' => MesFileRules::document(),
        ]);

        $filePath = $salesOrder->delivery_file_path;
        if ($request->hasFile('file')) {
            if ($filePath) {
                Storage::disk('public')->delete($filePath);
            }
            $filePath = $request->file('file')->store('delivery-notes', 'public');
        }

        $salesOrder->update([
            'delivery_number' => $data['delivery_number'],
            'delivery_date' => $data['delivery_date'],
            'delivery_recipient' => $data['delivery_recipient'],
            'delivery_note_notes' => $data['delivery_note_notes'] ?? null,
            'delivery_file_path' => $filePath,
            'delivery_note_created_at' => now(),
            'status' => SalesOrderStatus::ReadyForDelivery,
        ]);

        $this->notifications->notifyProduction(
            'ready_for_delivery',
            'Ready for Delivery',
            "SO {$salesOrder->so_number} is ready for shipment. Please complete delivery/resi input.",
            $salesOrder,
        );

        $this->activities->log(
            "Delivery note {$data['delivery_number']} created for {$salesOrder->so_number}.",
            'admin',
            $request->user(),
            $salesOrder,
        );

        return response()->json([
            'data' => $this->transform($salesOrder->fresh()),
            'message' => 'Delivery note created. Project is ready for delivery.',
        ]);
    }

    public function preview(SalesOrder $salesOrder): JsonResponse
    {
        if (! $salesOrder->file_path) {
            return response()->json(['message' => 'No document uploaded.'], 404);
        }

        return response()->json([
            'data' => [
                'url' => Storage::disk('public')->url($salesOrder->file_path),
                'file_name' => $salesOrder->file_name,
                'mime' => $salesOrder->file_mime,
            ],
        ]);
    }

    public function deliveryNotePreview(SalesOrder $salesOrder): JsonResponse
    {
        if (! $salesOrder->delivery_file_path) {
            return response()->json(['message' => 'No delivery note document uploaded.'], 404);
        }

        return response()->json([
            'data' => [
                'url' => Storage::disk('public')->url($salesOrder->delivery_file_path),
                'file_name' => basename($salesOrder->delivery_file_path),
            ],
        ]);
    }

    public function shipmentProofPreview(SalesOrder $salesOrder): JsonResponse
    {
        if (! $salesOrder->shipment_proof_file_path) {
            return response()->json(['message' => 'No shipment proof uploaded.'], 404);
        }

        return response()->json([
            'data' => [
                'url' => Storage::disk('public')->url($salesOrder->shipment_proof_file_path),
                'file_name' => basename($salesOrder->shipment_proof_file_path),
            ],
        ]);
    }

    private function storeFile(Request $request): array
    {
        if (! $request->hasFile('file')) {
            return [];
        }

        $file = $request->file('file');
        $path = $file->store('sales-orders', 'public');

        return [
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'file_mime' => $file->getClientMimeType(),
        ];
    }

    private function transform(SalesOrder $salesOrder, bool $detailed = false): array
    {
        $data = [
            'id' => $salesOrder->id,
            'so_number' => $salesOrder->so_number,
            'quotation_id' => $salesOrder->quotation_id,
            'quotation_number' => $salesOrder->quotation?->quotation_number,
            'spk_global' => $salesOrder->spk_global,
            'client' => $salesOrder->client,
            'machine' => $salesOrder->machine,
            'pic' => $salesOrder->pic,
            'status' => $salesOrder->status->value,
            'production_stage' => $salesOrder->production_stage?->value,
            'progress' => $salesOrder->progress,
            'start_date' => optional($salesOrder->start_date)?->format('Y-m-d'),
            'deadline' => optional($salesOrder->deadline)?->format('Y-m-d'),
            'description' => $salesOrder->description,
            'delivery_order' => $salesOrder->delivery_order,
            'packing_list' => $salesOrder->packing_list,
            'invoice' => $salesOrder->invoice,
            'delivery_number' => $salesOrder->delivery_number,
            'delivery_recipient' => $salesOrder->delivery_recipient,
            'delivery_note_notes' => $salesOrder->delivery_note_notes,
            'delivery_note_created_at' => $salesOrder->delivery_note_created_at?->toIso8601String(),
            'vehicle_courier' => $salesOrder->vehicle_courier,
            'delivery_date' => optional($salesOrder->delivery_date)?->format('Y-m-d'),
            'tracking_number' => $salesOrder->tracking_number,
            'shipment_date' => optional($salesOrder->shipment_date)?->format('Y-m-d'),
            'shipment_notes' => $salesOrder->shipment_notes,
            'file_url' => $salesOrder->file_path ? Storage::disk('public')->url($salesOrder->file_path) : null,
            'delivery_file_url' => $salesOrder->delivery_file_path ? Storage::disk('public')->url($salesOrder->delivery_file_path) : null,
            'shipment_proof_url' => $salesOrder->shipment_proof_file_path ? Storage::disk('public')->url($salesOrder->shipment_proof_file_path) : null,
            'is_delayed' => $salesOrder->isDelayed(),
        ];

        if ($detailed) {
            $data['stage_logs'] = $salesOrder->stageLogs->map(fn ($log) => [
                'stage' => $log->stage->value,
                'status' => $log->status->value,
                'started_at' => $log->started_at?->toIso8601String(),
                'finished_at' => $log->finished_at?->toIso8601String(),
                'operator' => $log->operator?->name,
                'duration_minutes' => $log->duration_minutes,
                'reject_notes' => $log->reject_notes,
                'return_to_stage' => $log->return_to_stage?->value,
            ]);
            $data['qc_reject_logs'] = $salesOrder->qcRejectLogs->map(fn ($log) => [
                'reject_reason' => $log->reject_reason,
                'return_to_stage' => $log->return_to_stage->value,
                'rejected_by' => $log->rejector?->name,
                'created_at' => $log->created_at?->toIso8601String(),
            ]);
            $data['bom_items'] = $salesOrder->bomItems;
            $data['work_order'] = $salesOrder->workOrder;
        }

        return $data;
    }
}
