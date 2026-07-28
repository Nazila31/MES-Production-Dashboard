<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\Activity;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class MesNotificationService
{
    public function notifyRole(UserRole $role, string $type, string $title, string $message, ?Model $notifiable = null): void
    {
        User::query()->where('role', $role)->each(function (User $user) use ($type, $title, $message, $notifiable) {
            $this->notifyUser($user, $type, $title, $message, $notifiable);
        });
    }

    public function notifyUser(User $user, string $type, string $title, string $message, ?Model $notifiable = null): Notification
    {
        return Notification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'read' => false,
            'notifiable_type' => $notifiable ? $notifiable->getMorphClass() : null,
            'notifiable_id' => $notifiable?->getKey(),
        ]);
    }

    public function notifyAdmins(string $type, string $title, string $message, ?Model $notifiable = null): void
    {
        $this->notifyRole(UserRole::Admin, $type, $title, $message, $notifiable);
    }

    public function notifyPpic(string $type, string $title, string $message, ?Model $notifiable = null): void
    {
        $this->notifyRole(UserRole::Ppic, $type, $title, $message, $notifiable);
    }

    public function notifyProduction(string $type, string $title, string $message, ?Model $notifiable = null): void
    {
        $this->notifyRole(UserRole::Production, $type, $title, $message, $notifiable);
    }

    public function notifyMarketing(string $type, string $title, string $message, ?Model $notifiable = null): void
    {
        $this->notifyRole(UserRole::Marketing, $type, $title, $message, $notifiable);
    }
}
