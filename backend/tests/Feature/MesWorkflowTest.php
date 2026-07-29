<?php

namespace Tests\Feature;

use App\Enums\QuotationStatus;
use App\Enums\SalesOrderStatus;
use App\Enums\UserRole;
use App\Models\Quotation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MesWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_full_mes_workflow(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin, 'email' => 'admin@test.com']);
        $marketing = User::factory()->create(['role' => UserRole::Marketing, 'email' => 'marketing@test.com']);
        $ppic = User::factory()->create(['role' => UserRole::Ppic, 'email' => 'ppic@test.com']);
        $production = User::factory()->create(['role' => UserRole::Production, 'email' => 'production@test.com']);

        Sanctum::actingAs($marketing);
        $createResponse = $this->postJson('/api/v1/quotations', [
            'quotation_number' => 'QTN260001',
            'client' => 'PT Test Client',
            'pic' => 'John',
            'machine' => 'Test Machine',
            'amount' => 1000000,
            'description' => 'Test quotation',
        ]);
        $createResponse->assertCreated();
        $quotationId = $createResponse->json('data.id');

        $this->postJson("/api/v1/quotations/{$quotationId}/follow-ups", [
            'follow_up_date' => now()->toDateString(),
            'description' => 'Initial client discussion',
            'status' => 'waiting_response',
        ])->assertCreated();

        $this->postJson("/api/v1/quotations/{$quotationId}/approve")->assertOk();

        Sanctum::actingAs($admin);
        $soResponse = $this->postJson('/api/v1/sales-orders', [
            'quotation_id' => $quotationId,
            'so_number' => 'SO260727001',
            'spk_global' => 'SPK260727001',
        ]);
        $soResponse->assertCreated();
        $soId = $soResponse->json('data.id');

        $this->patchJson("/api/v1/sales-orders/{$soId}/deadlines", [
            'material_deadline' => now()->addWeek()->toDateString(),
            'deadline' => now()->addMonth()->toDateString(),
        ])->assertOk();

        Sanctum::actingAs($ppic);
        $this->postJson("/api/v1/ppic/bom/{$soId}", [
            'items' => [['material_code' => 'MAT-001', 'material_name' => 'Steel', 'qty' => 2, 'unit' => 'pcs']],
        ])->assertOk();

        $this->postJson('/api/v1/ppic/work-orders', [
            'so_id' => $soId,
            'wo_number' => 'WO260727001',
        ])->assertCreated();
        $this->postJson("/api/v1/ppic/work-orders/{$soId}/release", [
            'schedule_date' => now()->toDateString(),
        ])->assertOk();

        Sanctum::actingAs($production);
        foreach (['fabrication', 'machining', 'assembly', 'qc'] as $stage) {
            $this->postJson("/api/v1/production/{$soId}/{$stage}/start")->assertOk();
            if ($stage === 'qc') {
                $this->postJson("/api/v1/production/{$soId}/qc/pass")->assertOk();
            } else {
                $this->postJson("/api/v1/production/{$soId}/{$stage}/finish")->assertOk();
            }
        }

        Sanctum::actingAs($admin);
        $this->postJson("/api/v1/sales-orders/{$soId}/delivery-note", [
            'delivery_number' => 'SJ-001',
            'delivery_date' => now()->toDateString(),
            'delivery_recipient' => 'PT Test Client',
            'delivery_note_notes' => 'Surat jalan test',
        ])->assertOk();

        Sanctum::actingAs($production);
        $this->postJson("/api/v1/production/{$soId}/shipment", [
            'tracking_number' => 'RESI-001',
            'shipment_date' => now()->toDateString(),
            'vehicle_courier' => 'JNE',
            'shipment_notes' => 'Delivered',
        ])->assertOk();

        Sanctum::actingAs($admin);
        $this->getJson('/api/v1/dashboard')->assertOk()->assertJsonPath('data.stats.completed', 1);

        $this->assertDatabaseHas('sales_orders', [
            'id' => $soId,
            'status' => SalesOrderStatus::Completed->value,
        ]);
    }

    public function test_qc_reject_returns_to_selected_stage(): void
    {
        $production = User::factory()->create(['role' => UserRole::Production]);
        $admin = User::factory()->create(['role' => UserRole::Admin]);

        Sanctum::actingAs($admin);
        $quotation = Quotation::create([
            'quotation_number' => 'QTN260010',
            'client' => 'Client',
            'status' => QuotationStatus::Approved,
            'amount' => 100,
        ]);

        $soResponse = $this->postJson('/api/v1/sales-orders', [
            'quotation_id' => $quotation->id,
            'so_number' => 'SO260727010',
            'spk_global' => 'SPK260727010',
        ]);
        $soId = $soResponse->json('data.id');

        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Ppic]));
        $this->postJson("/api/v1/ppic/bom/{$soId}", [
            'items' => [['material_code' => 'MAT-002', 'material_name' => 'Alu', 'qty' => 1, 'unit' => 'pcs']],
        ])->assertOk();
        $this->postJson('/api/v1/ppic/work-orders', ['so_id' => $soId, 'wo_number' => 'WO260727010'])->assertCreated();
        $this->postJson("/api/v1/ppic/work-orders/{$soId}/release")->assertOk();

        Sanctum::actingAs($production);
        foreach (['fabrication', 'machining', 'assembly'] as $stage) {
            $this->postJson("/api/v1/production/{$soId}/{$stage}/start")->assertOk();
            $this->postJson("/api/v1/production/{$soId}/{$stage}/finish")->assertOk();
        }
        $this->postJson("/api/v1/production/{$soId}/qc/start")->assertOk();
        $this->postJson("/api/v1/production/{$soId}/qc/reject", [
            'notes' => 'Dimensional issue',
            'return_stage' => 'machining',
        ])->assertOk();

        $this->assertDatabaseHas('sales_orders', [
            'id' => $soId,
            'status' => SalesOrderStatus::InProduction->value,
            'production_stage' => 'machining',
        ]);

        $this->assertDatabaseHas('qc_reject_logs', [
            'sales_order_id' => $soId,
            'reject_reason' => 'Dimensional issue',
            'return_to_stage' => 'machining',
        ]);
    }

    public function test_role_dashboards_are_accessible(): void
    {
        foreach ([UserRole::Admin, UserRole::Marketing, UserRole::Ppic, UserRole::Production] as $role) {
            Sanctum::actingAs(User::factory()->create(['role' => $role]));
            $this->getJson('/api/v1/dashboard')->assertOk();
        }
    }
}
