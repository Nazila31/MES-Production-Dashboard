<?php

namespace App\Models;

use App\Enums\ProductionStage;
use App\Enums\StageLogStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductionStageLog extends Model
{
    protected $fillable = [
        'sales_order_id',
        'stage',
        'status',
        'started_at',
        'finished_at',
        'operator_id',
        'duration_minutes',
        'reject_notes',
        'return_to_stage',
    ];

    protected function casts(): array
    {
        return [
            'stage' => ProductionStage::class,
            'status' => StageLogStatus::class,
            'return_to_stage' => ProductionStage::class,
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
        ];
    }

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class);
    }

    public function operator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'operator_id');
    }
}
