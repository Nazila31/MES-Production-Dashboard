<?php

namespace App\Support;

class MesStorageUrl
{
    public static function url(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        $normalized = str_replace('\\', '/', ltrim($path, '/'));

        return '/storage/'.$normalized;
    }

    public static function downloadUrl(?string $path): ?string
    {
        $url = self::url($path);

        return $url ? $url.'?download=1' : null;
    }
}
