<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Marketing = 'marketing';
    case Ppic = 'ppic';
    case Production = 'production';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Administrator',
            self::Marketing => 'Marketing',
            self::Ppic => 'PPIC',
            self::Production => 'Production Operator',
        };
    }
}
