<?php

namespace App\Services;

use App\Models\Quotation;
use Illuminate\Support\Facades\DB;

class NumberGeneratorService
{
    public function nextQuotationNumber(): string
    {
        $year = now()->format('y');
        $prefix = "QTN{$year}";

        $last = Quotation::query()
            ->where('quotation_number', 'like', "{$prefix}%")
            ->orderByDesc('quotation_number')
            ->value('quotation_number');

        $sequence = $last ? ((int) substr($last, strlen($prefix)) + 1) : 1;

        return $prefix.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }

    public function nextSalesOrderNumber(): string
    {
        $prefix = 'SO'.now()->format('ymd');
        $last = DB::table('sales_orders')
            ->where('so_number', 'like', "{$prefix}%")
            ->orderByDesc('so_number')
            ->value('so_number');

        $sequence = $last ? ((int) substr($last, strlen($prefix)) + 1) : 1;

        return $prefix.str_pad((string) $sequence, 3, '0', STR_PAD_LEFT);
    }

    public function spkFromSo(string $soNumber): string
    {
        return 'SPK'.substr($soNumber, 2);
    }

    public function workOrderFromSo(string $soNumber): string
    {
        return 'WO'.substr($soNumber, 2);
    }
}
