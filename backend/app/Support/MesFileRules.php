<?php

namespace App\Support;

class MesFileRules
{
    public static function document(): array
    {
        return ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'];
    }
}
