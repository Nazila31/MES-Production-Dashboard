<?php

namespace App\Models;

use App\Enums\ProductionStage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QcRejectLog extends Model
{
    protected $fillable = [
        'sales_order_id',
        'rejected_by',
        'reject_reason',
        'return_to_stage',
    ];

    protected function casts(): array
    {
        return [
            'return_to_stage' => ProductionStage::class,
        ];
    }

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class);
    }

    public function rejector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }
}
