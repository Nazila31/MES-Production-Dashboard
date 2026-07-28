<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['name' => 'Admin', 'email' => 'admin@mes.local', 'role' => UserRole::Admin],
            ['name' => 'Marketing', 'email' => 'marketing@mes.local', 'role' => UserRole::Marketing],
            ['name' => 'PPIC', 'email' => 'ppic@mes.local', 'role' => UserRole::Ppic],
            ['name' => 'Production', 'email' => 'production@mes.local', 'role' => UserRole::Production],
        ];

        foreach ($users as $user) {
            User::query()->updateOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    'password' => Hash::make('password'),
                    'role' => $user['role'],
                ],
            );
        }
    }
}
