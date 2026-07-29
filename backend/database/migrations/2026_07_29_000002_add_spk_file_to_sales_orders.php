<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->string('spk_file_path')->nullable()->after('file_mime');
            $table->string('spk_file_name')->nullable()->after('spk_file_path');
            $table->string('spk_file_mime')->nullable()->after('spk_file_name');
        });
    }

    public function down(): void
    {
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->dropColumn(['spk_file_path', 'spk_file_name', 'spk_file_mime']);
        });
    }
};
