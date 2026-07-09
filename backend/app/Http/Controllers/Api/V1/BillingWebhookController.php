<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Organization;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Stripe\Webhook;

class BillingWebhookController extends Controller
{
    public function handle(Request $request): Response
    {
        $secret = config('services.stripe.webhook_secret');

        try {
            $event = $secret
                ? Webhook::constructEvent($request->getContent(), (string) $request->header('Stripe-Signature', ''), $secret)
                : json_decode($request->getContent());
        } catch (\Throwable $e) {
            Log::warning('Stripe webhook verification failed', ['error' => $e->getMessage()]);

            return response('Invalid signature', 400);
        }

        $type = is_object($event) ? ($event->type ?? '') : '';
        $object = $event->data->object ?? null;

        match ($type) {
            'checkout.session.completed' => $this->onCheckoutCompleted($object),
            'customer.subscription.created', 'customer.subscription.updated' => $this->onSubscriptionUpdated($object),
            'customer.subscription.deleted' => $this->onSubscriptionDeleted($object),
            'invoice.paid', 'invoice.payment_succeeded' => $this->onInvoicePaid($object),
            default => null,
        };

        return response('ok', 200);
    }

    private function onCheckoutCompleted(mixed $session): void
    {
        if (! $session) {
            return;
        }

        $orgId = $session->metadata->organization_id ?? $session->client_reference_id ?? null;
        $org = $orgId ? Organization::find($orgId) : null;
        if (! $org) {
            return;
        }

        $plan = $session->metadata->plan ?? ($org->plan ?: 'pro');

        $org->forceFill([
            'plan' => $plan,
            'billing_customer_id' => $session->customer ?? $org->billing_customer_id,
        ])->save();

        Subscription::updateOrCreate(
            ['organization_id' => $org->id, 'provider' => 'stripe'],
            [
                'plan' => $plan,
                'status' => 'active',
                'provider_id' => $session->subscription ?? null,
            ],
        );
    }

    private function onSubscriptionUpdated(mixed $sub): void
    {
        $org = $this->orgForCustomer($sub);
        if (! $org) {
            return;
        }

        $end = isset($sub->current_period_end)
            ? Carbon::createFromTimestamp($sub->current_period_end)
            : null;

        Subscription::updateOrCreate(
            ['organization_id' => $org->id, 'provider' => 'stripe'],
            [
                'status' => $sub->status ?? 'active',
                'provider_id' => $sub->id ?? null,
                'current_period_end' => $end,
            ],
        );
    }

    private function onSubscriptionDeleted(mixed $sub): void
    {
        $org = $this->orgForCustomer($sub);
        if (! $org) {
            return;
        }

        $org->forceFill(['plan' => 'free'])->save();

        Subscription::where('organization_id', $org->id)
            ->where('provider', 'stripe')
            ->update(['status' => 'canceled', 'ends_at' => now()]);
    }

    private function onInvoicePaid(mixed $invoice): void
    {
        $org = $this->orgForCustomer($invoice);
        if (! $org) {
            return;
        }

        Invoice::updateOrCreate(
            ['number' => $invoice->number ?? $invoice->id],
            [
                'organization_id' => $org->id,
                'amount' => isset($invoice->amount_paid) ? $invoice->amount_paid / 100 : 0,
                'currency' => strtoupper($invoice->currency ?? 'usd'),
                'status' => 'paid',
                'issued_at' => now(),
                'paid_at' => now(),
            ],
        );
    }

    private function orgForCustomer(mixed $object): ?Organization
    {
        $customer = $object->customer ?? null;

        return $customer ? Organization::where('billing_customer_id', $customer)->first() : null;
    }
}
