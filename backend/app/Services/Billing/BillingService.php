<?php

namespace App\Services\Billing;

use App\Models\Organization;
use App\Models\UsageRecord;
use App\Models\User;
use Illuminate\Support\Carbon;
use Stripe\StripeClient;

class BillingService
{
    public function configured(): bool
    {
        return filled(config('services.stripe.secret'));
    }

    public function client(): StripeClient
    {
        return new StripeClient((string) config('services.stripe.secret'));
    }

    /** @return array<string, mixed> */
    public function plans(): array
    {
        return config('billing.plans', []);
    }

    /** @return array<string, mixed> */
    public function planFor(Organization $organization): array
    {
        $plans = $this->plans();
        $key = $organization->plan ?: 'free';

        return $plans[$key] ?? ($plans['free'] ?? []);
    }

    /** @return array<string, mixed> */
    public function usageFor(Organization $organization): array
    {
        $periodStart = Carbon::now()->startOfMonth();

        $usage = UsageRecord::where('organization_id', $organization->id)
            ->where('created_at', '>=', $periodStart)
            ->selectRaw('COALESCE(SUM(tokens_input),0) as tokens_input, COALESCE(SUM(tokens_output),0) as tokens_output, COALESCE(SUM(cost),0) as cost, COUNT(*) as messages')
            ->first();

        $plan = $this->planFor($organization);
        $limits = $plan['limits'] ?? [];

        $tokensInput = (int) ($usage->tokens_input ?? 0);
        $tokensOutput = (int) ($usage->tokens_output ?? 0);
        $tokens = $tokensInput + $tokensOutput;
        $messages = (int) ($usage->messages ?? 0);

        return [
            'period_start' => $periodStart->toIso8601String(),
            'messages' => $messages,
            'tokens' => $tokens,
            'tokens_input' => $tokensInput,
            'tokens_output' => $tokensOutput,
            'cost' => (float) ($usage->cost ?? 0),
            'limits' => $limits,
            'usage_ratio' => [
                'messages' => $this->ratio($messages, $limits['messages_per_month'] ?? null),
                'tokens' => $this->ratio($tokens, $limits['tokens_per_month'] ?? null),
            ],
        ];
    }

    private function ratio(int $used, ?int $limit): ?float
    {
        if (! $limit || $limit <= 0) {
            return null;
        }

        return round(min($used / $limit, 1), 4);
    }

    public function checkoutUrl(Organization $organization, string $planKey, User $user): string
    {
        $plan = $this->plans()[$planKey] ?? null;
        $priceId = $plan['stripe_price_id'] ?? null;

        abort_unless($this->configured(), 422, 'Billing is not configured.');
        abort_unless($priceId, 422, "Plan [{$planKey}] is not available for purchase.");

        $session = $this->client()->checkout->sessions->create([
            'mode' => 'subscription',
            'customer_email' => $user->email,
            'client_reference_id' => $organization->id,
            'line_items' => [[
                'price' => $priceId,
                'quantity' => 1,
            ]],
            'metadata' => [
                'organization_id' => $organization->id,
                'plan' => $planKey,
            ],
            'success_url' => config('billing.success_url'),
            'cancel_url' => config('billing.cancel_url'),
        ]);

        return (string) $session->url;
    }

    public function portalUrl(Organization $organization): string
    {
        abort_unless($this->configured(), 422, 'Billing is not configured.');
        abort_unless($organization->billing_customer_id, 422, 'No billing account yet.');

        $session = $this->client()->billingPortal->sessions->create([
            'customer' => $organization->billing_customer_id,
            'return_url' => config('billing.success_url'),
        ]);

        return (string) $session->url;
    }
}
