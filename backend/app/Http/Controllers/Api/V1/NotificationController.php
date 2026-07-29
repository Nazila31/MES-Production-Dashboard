<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Quotation;
use App\Models\SalesOrder;
use App\Models\WorkOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = Notification::query()
            ->with('notifiable')
            ->where(function ($query) use ($request) {
                $query->where('user_id', $request->user()->id)
                    ->orWhereNull('user_id');
            })
            ->latest()
            ->get()
            ->map(fn (Notification $n) => [
                'id' => $n->id,
                'type' => $n->type,
                'title' => $n->title,
                'message' => $n->message,
                'read' => $n->read,
                'href' => $this->notificationHref($n),
                'created_at' => $n->created_at?->toIso8601String(),
            ]);

        return response()->json(['data' => $notifications]);
    }

    public function markRead(Request $request, Notification $notification): JsonResponse
    {
        if ($notification->user_id && $notification->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $notification->update(['read' => true]);

        return response()->json(['message' => 'Notification marked as read.']);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        Notification::query()
            ->where('user_id', $request->user()->id)
            ->update(['read' => true]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $count = Notification::query()
            ->where('user_id', $request->user()->id)
            ->where('read', false)
            ->count();

        return response()->json(['data' => ['count' => $count]]);
    }

    private function notificationHref(Notification $notification): string
    {
        $notifiable = $notification->notifiable;

        if ($notifiable instanceof SalesOrder) {
            return match ($notification->type) {
                'so_created', 'qc_passed', 'ready_for_delivery' => 'pages/sales-orders/detail.html?id='.$notifiable->id,
                'stage_completed', 'work_order_released' => 'pages/production/index.html',
                'project_completed' => 'pages/reports/index.html',
                default => 'pages/sales-orders/detail.html?id='.$notifiable->id,
            };
        }

        if ($notifiable instanceof Quotation) {
            return 'pages/quotations/detail.html?id='.$notifiable->id;
        }

        if ($notifiable instanceof WorkOrder) {
            return 'pages/production/index.html';
        }

        return match ($notification->type) {
            'quotation_approved' => 'pages/quotations/index.html',
            'so_created' => 'pages/ppic/index.html',
            'work_order_released', 'stage_completed' => 'pages/production/index.html',
            'qc_passed', 'ready_for_delivery' => 'pages/sales-orders/index.html',
            'project_completed' => 'pages/reports/index.html',
            'deadline_reminder' => 'index.html',
            default => 'pages/notifications/index.html',
        };
    }
}
