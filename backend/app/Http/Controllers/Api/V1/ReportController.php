<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ProductionStage;
use App\Enums\SalesOrderStatus;
use App\Http\Controllers\Controller;
use App\Models\SalesOrder;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SalesOrder::query()->with(['quotation', 'workOrder', 'bomItems', 'stageLogs']);

        if ($from = $request->date('date_from')) {
            $query->whereDate('created_at', '>=', $from);
        }

        if ($to = $request->date('date_to')) {
            $query->whereDate('created_at', '<=', $to);
        }

        if ($client = $request->string('client')->toString()) {
            $query->where('client', 'like', "%{$client}%");
        }

        if ($so = $request->string('so_number')->toString()) {
            $query->where('so_number', 'like', "%{$so}%");
        }

        if ($quotation = $request->string('quotation_number')->toString()) {
            $query->whereHas('quotation', fn ($q) => $q->where('quotation_number', 'like', "%{$quotation}%"));
        }

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        $orders = $query->latest()->get();

        $summary = $orders->groupBy(fn ($so) => $so->created_at?->format('F Y') ?? 'Unknown')
            ->map(function ($group, $month) {
                return [
                    'month' => $month,
                    'sales_order' => $group->count(),
                    'completed' => $group->where('status', SalesOrderStatus::Completed)->count(),
                    'delayed' => $group->filter->isDelayed()->count(),
                    'efficiency' => $group->count()
                        ? round(($group->where('status', SalesOrderStatus::Completed)->count() / $group->count()) * 100).'%'
                        : '0%',
                ];
            })->values();

        $rows = $orders->map(fn (SalesOrder $so) => $this->reportRow($so));

        return response()->json([
            'data' => [
                'total_orders' => $orders->count(),
                'completed' => $orders->where('status', SalesOrderStatus::Completed)->count(),
                'delayed' => $orders->filter->isDelayed()->count(),
                'efficiency' => $orders->count()
                    ? (int) round(($orders->where('status', SalesOrderStatus::Completed)->count() / $orders->count()) * 100)
                    : 0,
                'monthly_production' => $this->monthlyCounts($orders),
                'department_distribution' => [
                    $orders->where('production_stage', ProductionStage::Fabrication)->count(),
                    $orders->where('production_stage', ProductionStage::Machining)->count(),
                    $orders->where('production_stage', ProductionStage::Assembly)->count(),
                    $orders->where('production_stage', ProductionStage::Qc)->count(),
                ],
                'status_distribution' => [
                    $orders->where('status', SalesOrderStatus::Completed)->count(),
                    $orders->where('status', SalesOrderStatus::InProduction)->count(),
                    $orders->where('status', SalesOrderStatus::WaitingPpic)->count(),
                ],
                'summary' => $summary,
                'rows' => $rows,
            ],
        ]);
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $response = $this->index($request);
        $rows = $response->getData(true)['data']['rows'] ?? [];

        $headers = [
            'Quotation Date', 'Quotation Number', 'SO Date', 'SO Number', 'SPK Global', 'Client',
            'Deadline Date', 'Production Start', 'Completion Date', 'Total Hari', 'Status',
            'Documents',
        ];

        return response()->streamDownload(function () use ($headers, $rows) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $headers);

            foreach ($rows as $row) {
                $documentLinks = collect($row['documents'] ?? [])
                    ->map(fn ($doc) => ($doc['label'] ?? 'Document').': '.($doc['url'] ?? ''))
                    ->implode(' | ');

                fputcsv($handle, [
                    $row['quotation_date'],
                    $row['quotation_number'],
                    $row['so_date'],
                    $row['so_number'],
                    $row['spk_global'],
                    $row['client'],
                    $row['deadline_date'],
                    $row['production_start'],
                    $row['completion_date'],
                    $row['total_days'] ?? '-',
                    $row['status_label'],
                    $documentLinks ?: '-',
                ]);
            }

            fclose($handle);
        }, 'Production_Report.csv', ['Content-Type' => 'text/csv']);
    }

    public function exportPdf(Request $request)
    {
        $response = $this->index($request);
        $payload = $response->getData(true)['data'];

        $pdf = Pdf::loadView('reports.production', ['report' => $payload]);

        return $pdf->download('Production_Report.pdf');
    }

    private function reportRow(SalesOrder $so): array
    {
        $totalDays = null;
        if ($so->production_started_at && $so->completed_at) {
            $totalDays = max(1, (int) $so->production_started_at->startOfDay()->diffInDays($so->completed_at->startOfDay()) + 1);
        }

        return [
            'id' => $so->id,
            'quotation_date' => $so->quotation?->created_at?->format('Y-m-d') ?? '-',
            'quotation_number' => $so->quotation?->quotation_number ?? '-',
            'so_date' => $so->created_at?->format('Y-m-d') ?? '-',
            'so_number' => $so->so_number,
            'spk_global' => $so->spk_global,
            'client' => $so->client,
            'deadline_date' => $so->deadline?->format('Y-m-d') ?? '-',
            'production_start' => $so->production_started_at?->format('Y-m-d H:i') ?? '-',
            'completion_date' => $so->completed_at?->format('Y-m-d H:i') ?? '-',
            'total_days' => $totalDays,
            'status' => $so->status->value,
            'status_label' => $this->statusLabel($so->status),
            'documents' => $this->collectDocuments($so),
        ];
    }

    private function collectDocuments(SalesOrder $so): array
    {
        $documents = [];

        if ($quotation = $so->quotation) {
            $doc = $this->documentMeta(
                $quotation->file_path,
                $quotation->file_name,
                $quotation->file_mime,
                'quotation',
                'Quotation',
            );
            if ($doc) {
                $documents[] = $doc;
            }
        }

        $salesOrderDoc = $this->documentMeta(
            $so->file_path,
            $so->file_name,
            $so->file_mime,
            'sales_order',
            'Sales Order',
        );
        if ($salesOrderDoc) {
            $documents[] = $salesOrderDoc;
        }

        $bomItem = $so->bomItems->first(fn ($item) => ! empty($item->file_path));
        if ($bomItem) {
            $doc = $this->documentMeta(
                $bomItem->file_path,
                $bomItem->file_name,
                null,
                'production',
                'Dokumen Production (BOM)',
            );
            if ($doc) {
                $documents[] = $doc;
            }
        }

        if ($workOrder = $so->workOrder) {
            $doc = $this->documentMeta(
                $workOrder->file_path,
                $workOrder->file_name,
                null,
                'work_order',
                'Work Order',
            );
            if ($doc) {
                $documents[] = $doc;
            }
        }

        $deliveryDoc = $this->documentMeta(
            $so->delivery_file_path,
            $so->delivery_file_path ? basename($so->delivery_file_path) : null,
            null,
            'delivery_note',
            'Surat Jalan',
        );
        if ($deliveryDoc) {
            $documents[] = $deliveryDoc;
        }

        $shipmentDoc = $this->documentMeta(
            $so->shipment_proof_file_path,
            $so->shipment_proof_file_path ? basename($so->shipment_proof_file_path) : null,
            null,
            'delivery_proof',
            'Bukti Delivery / Resi',
        );
        if ($shipmentDoc) {
            $documents[] = $shipmentDoc;
        }

        return $documents;
    }

    private function documentMeta(
        ?string $path,
        ?string $name,
        ?string $mime,
        string $category,
        string $label,
    ): ?array {
        if (! $path) {
            return null;
        }

        $mime = $mime ?: $this->guessMime($path);
        $isImage = str_starts_with($mime, 'image/');

        return [
            'category' => $category,
            'label' => $label,
            'file_name' => $name ?: basename($path),
            'url' => Storage::disk('public')->url($path),
            'mime' => $mime,
            'is_image' => $isImage,
        ];
    }

    private function guessMime(string $path): string
    {
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        return match ($extension) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'pdf' => 'application/pdf',
            default => 'application/octet-stream',
        };
    }

    private function statusLabel(SalesOrderStatus $status): string
    {
        return match ($status) {
            SalesOrderStatus::WaitingPpic => 'Waiting PPIC',
            SalesOrderStatus::PpicProcessing => 'PPIC Processing',
            SalesOrderStatus::Released => 'Released',
            SalesOrderStatus::InProduction => 'In Production',
            SalesOrderStatus::QcPassed => 'QC Passed',
            SalesOrderStatus::ReadyForDelivery => 'Ready for Delivery',
            SalesOrderStatus::Completed => 'Completed',
        };
    }

    private function monthlyCounts($orders): array
    {
        $months = [];

        for ($i = 5; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $months[] = $orders->filter(fn ($so) => $so->created_at?->isSameMonth($month))->count();
        }

        return $months;
    }
}
