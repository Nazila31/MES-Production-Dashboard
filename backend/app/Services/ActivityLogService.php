<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class ActivityLogService
{
    public function log(string $message, string $type = 'system', ?User $user = null, ?Model $related = null): Activity
    {
        return Activity::create([
            'message' => $message,
            'type' => $type,
            'user_id' => $user?->id,
            'related_type' => $related ? $related->getMorphClass() : null,
            'related_id' => $related?->getKey(),
        ]);
    }
}
