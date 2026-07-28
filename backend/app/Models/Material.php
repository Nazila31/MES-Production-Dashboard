<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Material extends Model
{
    protected $fillable = [
        'material_code',
        'material_name',
        'stock_available',
        'unit',
    ];

    protected function casts(): array
    {
        return [
            'stock_available' => 'decimal:2',
        ];
    }
}
