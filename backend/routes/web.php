<?php

use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpFoundation\Response;

Route::get('/', function () {
    if (is_file(public_path('index.html'))) {
        return redirect('/index.html');
    }

    return response(
        'MPMS frontend belum di-sync. Jalankan: cd frontend && npm run build',
        Response::HTTP_SERVICE_UNAVAILABLE
    );
});

Route::get('/storage/{path}', function (string $path) {
    $path = str_replace(['..', '\\'], ['', '/'], $path);
    $fullPath = storage_path('app/public/'.$path);

    if (! is_file($fullPath)) {
        abort(Response::HTTP_NOT_FOUND);
    }

    $mime = mime_content_type($fullPath) ?: 'application/octet-stream';
    $filename = basename($fullPath);

    if (request()->boolean('download')) {
        return response()->download($fullPath, $filename, ['Content-Type' => $mime]);
    }

    return response()->file($fullPath, ['Content-Type' => $mime]);
})->where('path', '.*');
