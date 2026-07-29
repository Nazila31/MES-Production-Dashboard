<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ProductionStage;
use App\Enums\SalesOrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Material;
use App\Models\SalesOrder;
use App\Models\WorkOrder;
use App\Services\ActivityLogService;
use App\Services\MesNotificationService;
use App\Support\MesFileRules;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PpicController extends Controller
{
    public function __construct(
        private MesNotificationService $notifications,
        private ActivityLogService $activities,
    ) {}

    public function releasedSo(): JsonResponse
    {
        $data = SalesOrder::query()
            ->whereIn('status', [
                SalesOrderStatus::WaitingPpic,
                SalesOrderStatus::PpicProcessing,
                SalesOrderStatus::Released,
            ])
            ->latest()
            ->get()
            ->map(fn (SalesOrder $so) => [
                'id' => $so->id,
                'so_number' => $so->so_number,
                'client' => $so->client,
                'machine' => $so->machine,
                'status' => $so->status->value,
                'material_deadline' => optional($so->material_deadline)?->format('Y-m-d'),
                'production_deadline' => optional($so->deadline)?->format('Y-m-d'),
                'deadline' => optional($so->deadline)?->format('Y-m-d'),
                'material_deadline_status' => $so->materialDeadlineStatus(),
                'production_deadline_status' => $so->productionDeadlineStatus(),
            ]);

        return response()->json(['data' => $data]);
    }

    public function getBom(SalesOrder $salesOrder): JsonResponse
    {
        return response()->json(['data' => $salesOrder->bomItems()->get()]);
    }

    public function saveBom(Request $request, SalesOrder $salesOrder): JsonResponse
    {
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.material_code' => ['required', 'string'],
            'items.*.material_name' => ['required', 'string'],
            'items.*.qty' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit' => ['nullable', 'string'],
            'bom_description' => ['nullable', 'string'],
            'file' => MesFileRules::document(),
        ]);

        $salesOrder->bomItems()->delete();

        $filePath = null;
        $fileName = null;
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filePath = $file->store('bom', 'public');
            $fileName = $file->getClientOriginalName();
        }

        foreach ($data['items'] as $item) {
            Material::query()->updateOrCreate(
                ['material_code' => $item['material_code']],
                [
                    'material_name' => $item['material_name'],
                    'unit' => $item['unit'] ?? 'pcs',
                ],
            );

            $salesOrder->bomItems()->create([
                'material_code' => $item['material_code'],
                'material_name' => $item['material_name'],
                'qty' => $item['qty'],
                'unit' => $item['unit'] ?? 'pcs',
                'bom_description' => $data['bom_description'] ?? null,
                'file_path' => $filePath,
                'file_name' => $fileName,
            ]);
        }

        $salesOrder->update(['status' => SalesOrderStatus::PpicProcessing]);

        $this->activities->log(
            "BOM saved for {$salesOrder->so_number}.",
            'ppic',
            $request->user(),
            $salesOrder,
        );

        return response()->json([
            'data' => $salesOrder->bomItems()->get(),
            'message' => 'BOM saved successfully.',
        ]);
    }

    public function warehouse(SalesOrder $salesOrder): JsonResponse
    {
        $items = $salesOrder->bomItems()->get()->map(function ($item) {
            $material = Material::query()->where('material_code', $item->material_code)->first();
            $available = $material?->stock_available ?? 0;

            return [
                ...$item->toArray(),
                'stock_available' => (float) $available,
                'sufficient' => $available >= $item->qty,
            ];
        });

        return response()->json(['data' => $items]);
    }

    public function createWorkOrder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'so_id' => ['required', 'exists:sales_orders,id'],
            'wo_number' => ['required', 'string', 'max:50', 'unique:work_orders,wo_number'],
            'bom_description' => ['nullable', 'string'],
            'file' => MesFileRules::document(),
        ]);

        $salesOrder = SalesOrder::query()->findOrFail($data['so_id']);

        if ($salesOrder->workOrder) {
            return response()->json(['message' => 'Work order already exists.'], 422);
        }

        $fileMeta = [];
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileMeta = [
                'file_path' => $file->store('work-orders', 'public'),
                'file_name' => $file->getClientOriginalName(),
            ];
        }

        $workOrder = WorkOrder::create([
            'sales_order_id' => $salesOrder->id,
            'wo_number' => $data['wo_number'],
            'status' => 'draft',
            'bom_description' => $data['bom_description'] ?? null,
            ...$fileMeta,
        ]);

        return response()->json([
            'data' => $workOrder,
            'message' => 'Work Order created.',
        ], 201);
    }

    public function getWorkOrder(SalesOrder $salesOrder): JsonResponse
    {
        return response()->json(['data' => $salesOrder->workOrder]);
    }

    public function releaseWorkOrder(Request $request, SalesOrder $salesOrder): JsonResponse
    {
        $workOrder = $salesOrder->workOrder;

        if (! $workOrder) {
            return response()->json(['message' => 'Work Order not found.'], 404);
        }

        if ($workOrder->status === 'released') {
            return response()->json(['message' => 'Work Order already released.'], 422);
        }

        $releaseDate = now()->toDateString();

        $workOrder->update([
            'status' => 'released',
            'schedule_date' => $releaseDate,
            'released_at' => now(),
        ]);

        $salesOrder->update([
            'status' => SalesOrderStatus::InProduction,
            'production_stage' => ProductionStage::Fabrication,
            'progress' => 0,
            'production_started_at' => now(),
        ]);

        foreach (ProductionStage::cases() as $stage) {
            $salesOrder->stageLogs()->firstOrCreate(
                ['stage' => $stage],
                ['status' => 'pending'],
            );
        }

        $this->notifications->notifyProduction(
            'work_order_released',
            'Work Order Released',
            "Work Order {$workOrder->wo_number} released for {$salesOrder->so_number}.",
            $workOrder,
        );

        $this->activities->log(
            "Work Order {$workOrder->wo_number} released to production.",
            'ppic',
            $request->user(),
            $workOrder,
        );

        return response()->json([
            'data' => $workOrder->fresh(),
            'message' => 'Work Order released to production.',
        ]);
    }

    public function schedule(): JsonResponse
    {
        $data = WorkOrder::query()
            ->with('salesOrder')
            ->where('status', 'released')
            ->latest('released_at')
            ->get()
            ->map(fn (WorkOrder $wo) => [
                'id' => $wo->id,
                'so_id' => $wo->sales_order_id,
                'so_number' => $wo->salesOrder?->so_number,
                'client' => $wo->salesOrder?->client,
                'wo_number' => $wo->wo_number,
                'schedule_date' => optional($wo->schedule_date)?->format('Y-m-d'),
                'release_date' => optional($wo->released_at)?->format('Y-m-d'),
                'status' => $wo->status,
                'released_at' => $wo->released_at?->toIso8601String(),
            ]);

        return response()->json(['data' => $data]);
    }
}
