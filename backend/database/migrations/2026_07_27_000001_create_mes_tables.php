<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('marketing')->after('password');
        });

        Schema::create('quotations', function (Blueprint $table) {
            $table->id();
            $table->string('quotation_number')->unique();
            $table->string('client');
            $table->string('pic')->nullable();
            $table->string('machine')->nullable();
            $table->decimal('amount', 15, 2)->default(0);
            $table->string('status')->default('draft');
            $table->text('description')->nullable();
            $table->date('deadline')->nullable();
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->string('file_mime')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });

        Schema::create('sales_orders', function (Blueprint $table) {
            $table->id();
            $table->string('so_number')->unique();
            $table->foreignId('quotation_id')->constrained('quotations')->cascadeOnDelete();
            $table->string('spk_global')->unique();
            $table->string('client');
            $table->string('pic')->nullable();
            $table->string('machine')->nullable();
            $table->string('status')->default('waiting_ppic');
            $table->string('production_stage')->nullable();
            $table->unsignedTinyInteger('progress')->default(0);
            $table->date('start_date')->nullable();
            $table->date('deadline')->nullable();
            $table->text('description')->nullable();
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->string('file_mime')->nullable();
            $table->string('delivery_order')->nullable();
            $table->string('packing_list')->nullable();
            $table->string('invoice')->nullable();
            $table->string('delivery_number')->nullable();
            $table->string('vehicle_courier')->nullable();
            $table->date('delivery_date')->nullable();
            $table->string('delivery_file_path')->nullable();
            $table->timestamp('production_started_at')->nullable();
            $table->timestamp('qc_passed_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('materials', function (Blueprint $table) {
            $table->id();
            $table->string('material_code')->unique();
            $table->string('material_name');
            $table->decimal('stock_available', 12, 2)->default(0);
            $table->string('unit')->default('pcs');
            $table->timestamps();
        });

        Schema::create('bom_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_order_id')->constrained('sales_orders')->cascadeOnDelete();
            $table->string('material_code');
            $table->string('material_name');
            $table->decimal('qty', 12, 2);
            $table->string('unit')->default('pcs');
            $table->text('bom_description')->nullable();
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->timestamps();
        });

        Schema::create('work_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_order_id')->constrained('sales_orders')->cascadeOnDelete();
            $table->string('wo_number')->unique();
            $table->string('status')->default('draft');
            $table->date('schedule_date')->nullable();
            $table->timestamp('released_at')->nullable();
            $table->text('bom_description')->nullable();
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->timestamps();
        });

        Schema::create('production_stage_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_order_id')->constrained('sales_orders')->cascadeOnDelete();
            $table->string('stage');
            $table->string('status')->default('pending');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->foreignId('operator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('duration_minutes')->nullable();
            $table->text('reject_notes')->nullable();
            $table->timestamps();

            $table->unique(['sales_order_id', 'stage']);
        });

        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->text('message');
            $table->string('type')->default('system');
            $table->nullableMorphs('related');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('type');
            $table->string('title');
            $table->text('message');
            $table->boolean('read')->default(false);
            $table->nullableMorphs('notifiable');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('activities');
        Schema::dropIfExists('production_stage_logs');
        Schema::dropIfExists('work_orders');
        Schema::dropIfExists('bom_items');
        Schema::dropIfExists('materials');
        Schema::dropIfExists('sales_orders');
        Schema::dropIfExists('quotations');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};
