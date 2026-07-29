<?php

namespace App\Support;

use Illuminate\Support\Carbon;

class DeadlineIndicator
{
    public static function status(?Carbon $date, bool $completed = false): ?string
    {
        if (! $date || $completed) {
            return null;
        }

        $today = now()->startOfDay();
        $target = $date->copy()->startOfDay();

        if ($today->gt($target)) {
            return 'overdue';
        }

        if ($today->diffInDays($target) <= 7) {
            return 'approaching';
        }

        return 'safe';
    }
}
