<?php

namespace App\Models;

use App\Enums\ProductionStage;
use App\Enums\SalesOrderStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class SalesOrder extends Model
{
    protected $fillable = [
        'so_number',
        'quotation_id',
        'spk_global',
        'client',
        'pic',
        'machine',
        'status',
        'production_stage',
        'progress',
        'start_date',
        'deadline',
        'description',
        'file_path',
        'file_name',
        'file_mime',
        'delivery_order',
        'packing_list',
        'invoice',
        'delivery_number',
        'delivery_recipient',
        'delivery_note_notes',
        'vehicle_courier',
        'delivery_date',
        'delivery_file_path',
        'delivery_note_created_at',
        'tracking_number',
        'shipment_date',
        'shipment_notes',
        'shipment_proof_file_path',
        'production_started_at',
        'qc_passed_at',
        'completed_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => SalesOrderStatus::class,
            'production_stage' => ProductionStage::class,
            'start_date' => 'date',
            'deadline' => 'date',
            'delivery_date' => 'date',
            'shipment_date' => 'date',
            'production_started_at' => 'datetime',
            'qc_passed_at' => 'datetime',
            'delivery_note_created_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function bomItems(): HasMany
    {
        return $this->hasMany(BomItem::class);
    }

    public function workOrder(): HasOne
    {
        return $this->hasOne(WorkOrder::class);
    }

    public function stageLogs(): HasMany
    {
        return $this->hasMany(ProductionStageLog::class);
    }

    public function qcRejectLogs(): HasMany
    {
        return $this->hasMany(QcRejectLog::class);
    }

    public function isDelayed(): bool
    {
        if (! $this->deadline || $this->status === SalesOrderStatus::Completed) {
            return false;
        }

        return now()->startOfDay()->gt($this->deadline);
    }
}
