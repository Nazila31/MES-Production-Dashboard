<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->string('delivery_recipient')->nullable()->after('delivery_number');
            $table->text('delivery_note_notes')->nullable()->after('delivery_recipient');
            $table->timestamp('delivery_note_created_at')->nullable()->after('delivery_file_path');
            $table->string('tracking_number')->nullable()->after('delivery_note_created_at');
            $table->date('shipment_date')->nullable()->after('tracking_number');
            $table->text('shipment_notes')->nullable()->after('shipment_date');
            $table->string('shipment_proof_file_path')->nullable()->after('shipment_notes');
        });

        Schema::table('production_stage_logs', function (Blueprint $table) {
            $table->string('return_to_stage')->nullable()->after('reject_notes');
        });

        Schema::create('qc_reject_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_order_id')->constrained('sales_orders')->cascadeOnDelete();
            $table->foreignId('rejected_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('reject_reason');
            $table->string('return_to_stage');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qc_reject_logs');

        Schema::table('production_stage_logs', function (Blueprint $table) {
            $table->dropColumn('return_to_stage');
        });

        Schema::table('sales_orders', function (Blueprint $table) {
            $table->dropColumn([
                'delivery_recipient',
                'delivery_note_notes',
                'delivery_note_created_at',
                'tracking_number',
                'shipment_date',
                'shipment_notes',
                'shipment_proof_file_path',
            ]);
        });
    }
};
