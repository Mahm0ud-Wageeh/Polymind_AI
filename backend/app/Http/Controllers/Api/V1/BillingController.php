<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Services\Billing\BillingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BillingController extends Controller
{
    public function __construct(protected BillingService $billing) {}

    public function show(Request $request): JsonResponse
    {
        $organization = $this->organization($request);

        return response()->json([
            'plan' => $organization->plan ?: 'free',
            'plan_details' => $this->billing->planFor($organization),
            'subscription' => $organization->subscriptions()->latest()->first(),
            'usage' => $this->billing->usageFor($organization),
            'invoices' => $organization->invoices()->latest('issued_at')->limit(12)->get(),
            'billing_enabled' => $this->billing->configured(),
        ]);
    }

    public function plans(): JsonResponse
    {
        return response()->json(['plans' => $this->billing->plans()]);
    }

    public function checkout(Request $request): JsonResponse
    {
        $data = $request->validate([
            'plan' => ['required', 'string'],
        ]);

        $organization = $this->organization($request);
        $url = $this->billing->checkoutUrl($organization, $data['plan'], $request->user());

        return response()->json(['url' => $url]);
    }

    public function portal(Request $request): JsonResponse
    {
        $organization = $this->organization($request);

        return response()->json(['url' => $this->billing->portalUrl($organization)]);
    }

    private function organization(Request $request): Organization
    {
        $user = $request->user();

        return $user->organizations()->first()
            ?? Organization::where('owner_id', $user->id)->firstOrFail();
    }
}
