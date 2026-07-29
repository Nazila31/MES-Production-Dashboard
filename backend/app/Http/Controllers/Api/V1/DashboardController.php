<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ProductionStage;
use App\Enums\QuotationStatus;
use App\Enums\SalesOrderStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Quotation;
use App\Models\SalesOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return match ($request->user()->role) {
            UserRole::Admin => $this->adminDashboard(),
            UserRole::Marketing => $this->marketingDashboard(),
            UserRole::Ppic => $this->ppicDashboard(),
            UserRole::Production => $this->productionDashboard(),
        };
    }

    private function adminDashboard(): JsonResponse
    {
        $orders = SalesOrder::query()->get();
        $quotations = Quotation::query()->get();

        $stats = [
            'role' => 'admin',
            'total_quotations' => $quotations->count(),
            'approved_quotations' => $quotations->where('status', QuotationStatus::Approved)->count(),
            'total_sales_orders' => $orders->count(),
            'waiting_admin' => $quotations->where('status', QuotationStatus::Approved)->filter(fn ($q) => ! $q->salesOrder)->count(),
            'waiting_ppic' => $orders->where('status', SalesOrderStatus::WaitingPpic)->count(),
            'in_production' => $orders->where('status', SalesOrderStatus::InProduction)->count(),
            'ready_for_delivery' => $orders->where('status', SalesOrderStatus::ReadyForDelivery)->count(),
            'fabrication' => $orders->where('production_stage', ProductionStage::Fabrication)->count(),
            'machining' => $orders->where('production_stage', ProductionStage::Machining)->count(),
            'assembly' => $orders->where('production_stage', ProductionStage::Assembly)->count(),
            'qc' => $orders->where('production_stage', ProductionStage::Qc)->count(),
            'completed' => $orders->where('status', SalesOrderStatus::Completed)->count(),
            'delayed' => $orders->filter->isDelayed()->count(),
            'production_trend' => $this->productionTrend(),
            'chart_label' => 'Production Starts',
        ];

        return response()->json([
            'data' => [
                'stats' => $stats,
                'activities' => $this->recentActivities(),
                'deadlines' => $this->upcomingDeadlines(),
                'side_panel_title' => 'Deadline Reminder',
                'side_panel_subtitle' => 'Upcoming project deadlines',
            ],
        ]);
    }

    private function marketingDashboard(): JsonResponse
    {
        $quotations = Quotation::query()->latest()->get();

        $stats = [
            'role' => 'marketing',
            'total_quotations' => $quotations->count(),
            'draft' => $quotations->where('status', QuotationStatus::Draft)->count(),
            'sent' => $quotations->where('status', QuotationStatus::Sent)->count(),
            'approved' => $quotations->where('status', QuotationStatus::Approved)->count(),
            'rejected' => $quotations->where('status', QuotationStatus::Rejected)->count(),
            'pending_approval' => $quotations->whereIn('status', [QuotationStatus::Draft, QuotationStatus::Sent])->count(),
            'production_trend' => $this->quotationTrend(),
            'chart_label' => 'New Quotations',
        ];

        $recent = $quotations->take(8)->map(fn (Quotation $q) => [
            'quotation_number' => $q->quotation_number,
            'client' => $q->client,
            'status' => $q->status->value,
            'follow_up_count' => $q->followUps()->count(),
            'amount' => (float) $q->amount,
        ]);

        return response()->json([
            'data' => [
                'stats' => $stats,
                'recent_quotations' => $recent,
                'activities' => $this->recentActivities('marketing'),
                'deadlines' => $this->recentQuotationFollowUps(),
                'side_panel_title' => 'Recent Follow Ups',
                'side_panel_subtitle' => 'Latest client communication',
            ],
        ]);
    }

    private function ppicDashboard(): JsonResponse
    {
        $orders = SalesOrder::query()->latest()->get();

        $stats = [
            'role' => 'ppic',
            'waiting_ppic' => $orders->where('status', SalesOrderStatus::WaitingPpic)->count(),
            'ppic_processing' => $orders->where('status', SalesOrderStatus::PpicProcessing)->count(),
            'in_production' => $orders->where('status', SalesOrderStatus::InProduction)->count(),
            'ready_for_delivery' => $orders->where('status', SalesOrderStatus::ReadyForDelivery)->count(),
            'completed' => $orders->where('status', SalesOrderStatus::Completed)->count(),
            'production_trend' => $this->orderPlanningTrend(),
            'chart_label' => 'Planning Activity',
        ];

        $queue = $orders->whereIn('status', [
            SalesOrderStatus::WaitingPpic,
            SalesOrderStatus::PpicProcessing,
        ])->take(8)->map(fn (SalesOrder $so) => [
            'so_number' => $so->so_number,
            'client' => $so->client,
            'status' => $so->status->value,
            'material_deadline' => $so->material_deadline?->format('Y-m-d'),
            'production_deadline' => $so->deadline?->format('Y-m-d'),
            'material_deadline_status' => $so->materialDeadlineStatus(),
            'production_deadline_status' => $so->productionDeadlineStatus(),
        ]);

        return response()->json([
            'data' => [
                'stats' => $stats,
                'planning_queue' => $queue,
                'activities' => $this->recentActivities('ppic'),
                'deadlines' => $this->upcomingDeadlines(),
                'side_panel_title' => 'Planning Queue',
                'side_panel_subtitle' => 'Orders awaiting PPIC action',
            ],
        ]);
    }

    private function productionDashboard(): JsonResponse
    {
        $orders = SalesOrder::query()->latest()->get();

        $stats = [
            'role' => 'production',
            'in_production' => $orders->where('status', SalesOrderStatus::InProduction)->count(),
            'fabrication' => $orders->where('production_stage', ProductionStage::Fabrication)->count(),
            'machining' => $orders->where('production_stage', ProductionStage::Machining)->count(),
            'assembly' => $orders->where('production_stage', ProductionStage::Assembly)->count(),
            'qc' => $orders->where('production_stage', ProductionStage::Qc)->count(),
            'ready_for_delivery' => $orders->where('status', SalesOrderStatus::ReadyForDelivery)->count(),
            'completed' => $orders->where('status', SalesOrderStatus::Completed)->count(),
            'production_trend' => $this->productionTrend(),
            'chart_label' => 'Production Starts',
        ];

        $deliveryTasks = $orders->where('status', SalesOrderStatus::ReadyForDelivery)->take(8)->map(fn (SalesOrder $so) => [
            'id' => $so->id,
            'so_number' => $so->so_number,
            'client' => $so->client,
            'delivery_number' => $so->delivery_number,
            'delivery_recipient' => $so->delivery_recipient,
            'deadline' => $so->deadline?->format('Y-m-d'),
            'status' => $so->status->value,
        ]);

        return response()->json([
            'data' => [
                'stats' => $stats,
                'delivery_tasks' => $deliveryTasks,
                'activities' => $this->recentActivities('production'),
                'deadlines' => $this->deliveryDeadlines(),
                'side_panel_title' => 'Delivery Tasks',
                'side_panel_subtitle' => 'Orders ready for shipment',
            ],
        ]);
    }

    private function recentActivities(?string $type = null): array
    {
        $query = Activity::query()->latest()->limit(10);
        if ($type) {
            $query->where('type', $type);
        }

        return $query->get()->map(fn (Activity $a) => [
            'id' => $a->id,
            'message' => $a->message,
            'time' => $a->created_at?->toIso8601String(),
            'type' => $a->type,
        ])->all();
    }

    private function upcomingDeadlines(): array
    {
        return SalesOrder::query()
            ->where('status', '!=', SalesOrderStatus::Completed)
            ->whereNotNull('deadline')
            ->orderBy('deadline')
            ->limit(10)
            ->get()
            ->map(fn (SalesOrder $so) => [
                'so_number' => $so->so_number,
                'client' => $so->client,
                'material_deadline' => $so->material_deadline?->format('Y-m-d'),
                'production_deadline' => $so->deadline?->format('Y-m-d'),
                'material_deadline_status' => $so->materialDeadlineStatus(),
                'production_deadline_status' => $so->productionDeadlineStatus(),
                'status' => $so->production_stage?->value ?? $so->status->value,
            ])->all();
    }

    private function recentQuotationFollowUps(): array
    {
        return \App\Models\QuotationFollowUp::query()
            ->with('quotation')
            ->latest('follow_up_date')
            ->limit(10)
            ->get()
            ->map(fn ($followUp) => [
                'so_number' => $followUp->quotation?->quotation_number,
                'client' => $followUp->quotation?->client,
                'deadline' => $followUp->follow_up_date?->format('Y-m-d'),
                'status' => $followUp->status?->value ?? 'follow_up',
                'status_label' => $followUp->status?->label() ?? 'Follow Up',
            ])->all();
    }

    private function quotationDeadlines(): array
    {
        return Quotation::query()
            ->whereNotIn('status', [QuotationStatus::Approved, QuotationStatus::Rejected])
            ->whereNotNull('deadline')
            ->orderBy('deadline')
            ->limit(10)
            ->get()
            ->map(fn (Quotation $q) => [
                'so_number' => $q->quotation_number,
                'client' => $q->client,
                'deadline' => $q->deadline?->format('Y-m-d'),
                'status' => $q->status->value,
            ])->all();
    }

    private function deliveryDeadlines(): array
    {
        return SalesOrder::query()
            ->where('status', SalesOrderStatus::ReadyForDelivery)
            ->orderBy('deadline')
            ->limit(10)
            ->get()
            ->map(fn (SalesOrder $so) => [
                'so_number' => $so->so_number,
                'client' => $so->delivery_recipient ?: $so->client,
                'deadline' => $so->deadline?->format('Y-m-d'),
                'status' => $so->status->value,
            ])->all();
    }

    private function productionTrend(): array
    {
        $trend = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $trend[] = SalesOrder::query()
                ->whereDate('production_started_at', $date)
                ->count();
        }

        return $trend;
    }

    private function quotationTrend(): array
    {
        $trend = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $trend[] = Quotation::query()
                ->whereDate('created_at', $date)
                ->count();
        }

        return $trend;
    }

    private function orderPlanningTrend(): array
    {
        $trend = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $trend[] = SalesOrder::query()
                ->whereIn('status', [SalesOrderStatus::WaitingPpic, SalesOrderStatus::PpicProcessing])
                ->whereDate('updated_at', $date)
                ->count();
        }

        return $trend;
    }
}
