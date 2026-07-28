<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkOrder extends Model
{
    protected $fillable = [
        'sales_order_id',
        'wo_number',
        'status',
        'schedule_date',
        'released_at',
        'bom_description',
        'file_path',
        'file_name',
    ];

    protected function casts(): array
    {
        return [
            'schedule_date' => 'date',
            'released_at' => 'datetime',
        ];
    }

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class);
    }
}
