<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BillingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_billing_overview_returns_plan_and_usage(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'Billy Payer',
            'email' => 'billy@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();

        $user = User::where('email', 'billy@example.com')->firstOrFail();
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/billing')
            ->assertOk()
            ->assertJsonStructure([
                'plan',
                'plan_details' => ['name', 'limits'],
                'usage' => ['messages', 'tokens', 'cost', 'limits'],
                'invoices',
                'billing_enabled',
            ]);
    }

    public function test_plans_endpoint_lists_available_plans(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/billing/plans')
            ->assertOk()
            ->assertJsonPath('plans.free.name', 'Free')
            ->assertJsonPath('plans.pro.name', 'Pro')
            ->assertJsonPath('plans.team.name', 'Team');
    }

    public function test_checkout_requires_a_configured_provider(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'No Stripe',
            'email' => 'nostripe@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();

        $user = User::where('email', 'nostripe@example.com')->firstOrFail();
        Sanctum::actingAs($user);

        // Without STRIPE_SECRET configured the endpoint should fail gracefully.
        $this->postJson('/api/v1/billing/checkout', ['plan' => 'pro'])
            ->assertStatus(422);
    }
}
