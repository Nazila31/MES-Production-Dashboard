<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\PpicController;
use App\Http\Controllers\Api\V1\ProductionController;
use App\Http\Controllers\Api\V1\QuotationController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\SalesOrderController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        Route::get('/dashboard', [DashboardController::class, 'index'])
            ->middleware('role:admin,marketing,ppic,production');

        Route::get('/quotations/approved-for-so', [QuotationController::class, 'approvedForSo'])
            ->middleware('role:admin');
        Route::middleware('role:admin,marketing')->group(function () {
            Route::get('/quotations/{quotation}/preview', [QuotationController::class, 'preview']);
            Route::apiResource('quotations', QuotationController::class);
            Route::post('/quotations/{quotation}/approve', [QuotationController::class, 'approve']);
            Route::post('/quotations/{quotation}/reject', [QuotationController::class, 'reject']);
        });

        Route::get('/sales-orders/{sales_order}/preview', [SalesOrderController::class, 'preview'])
            ->middleware('role:admin,ppic,production');
        Route::get('/sales-orders/{sales_order}/delivery-note-preview', [SalesOrderController::class, 'deliveryNotePreview'])
            ->middleware('role:admin,ppic,production');
        Route::get('/sales-orders/{sales_order}/shipment-proof-preview', [SalesOrderController::class, 'shipmentProofPreview'])
            ->middleware('role:admin,ppic,production');
        Route::post('/sales-orders/{sales_order}/delivery-note', [SalesOrderController::class, 'createDeliveryNote'])
            ->middleware('role:admin');
        Route::get('/sales-orders', [SalesOrderController::class, 'index'])->middleware('role:admin');
        Route::get('/sales-orders/{sales_order}', [SalesOrderController::class, 'show'])
            ->middleware('role:admin,ppic,production');
        Route::post('/sales-orders', [SalesOrderController::class, 'store'])->middleware('role:admin');

        Route::prefix('ppic')->middleware('role:ppic,admin')->group(function () {
            Route::get('/released-so', [PpicController::class, 'releasedSo']);
            Route::get('/bom/{sales_order}', [PpicController::class, 'getBom']);
            Route::post('/bom/{sales_order}', [PpicController::class, 'saveBom']);
            Route::get('/warehouse/{sales_order}', [PpicController::class, 'warehouse']);
            Route::post('/work-orders', [PpicController::class, 'createWorkOrder']);
            Route::get('/work-orders/{sales_order}', [PpicController::class, 'getWorkOrder']);
            Route::post('/work-orders/{sales_order}/release', [PpicController::class, 'releaseWorkOrder']);
            Route::get('/schedule', [PpicController::class, 'schedule']);
        });

        Route::prefix('production')->middleware('role:production,admin')->group(function () {
            Route::get('/current', [ProductionController::class, 'current']);
            Route::get('/dashboard', [ProductionController::class, 'dashboard']);
            Route::get('/delivery-queue', [ProductionController::class, 'deliveryQueue']);
            Route::post('/{sales_order}/shipment', [ProductionController::class, 'completeShipment']);
            Route::post('/{sales_order}/{stage}/start', [ProductionController::class, 'startStage']);
            Route::post('/{sales_order}/{stage}/finish', [ProductionController::class, 'finishStage']);
            Route::post('/{sales_order}/qc/pass', [ProductionController::class, 'passQc']);
            Route::post('/{sales_order}/qc/reject', [ProductionController::class, 'rejectQc']);
        });

        Route::prefix('reports')->middleware('role:admin')->group(function () {
            Route::get('/', [ReportController::class, 'index']);
            Route::get('/export/csv', [ReportController::class, 'exportCsv']);
            Route::get('/export/pdf', [ReportController::class, 'exportPdf']);
        });

        Route::prefix('notifications')->group(function () {
            Route::get('/', [NotificationController::class, 'index']);
            Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
            Route::post('/{notification}/read', [NotificationController::class, 'markRead']);
            Route::post('/read-all', [NotificationController::class, 'markAllRead']);
        });
    });
});
