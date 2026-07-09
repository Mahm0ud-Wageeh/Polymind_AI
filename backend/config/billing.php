<?php

return [

    'currency' => env('BILLING_CURRENCY', 'USD'),

    // Where Stripe Checkout returns the customer after success/cancel.
    'success_url' => env('BILLING_SUCCESS_URL', env('FRONTEND_URL', 'http://localhost:5173').'/settings?billing=success'),
    'cancel_url' => env('BILLING_CANCEL_URL', env('FRONTEND_URL', 'http://localhost:5173').'/settings?billing=cancelled'),

    /*
    |--------------------------------------------------------------------------
    | Plans
    |--------------------------------------------------------------------------
    | Each paid plan maps to a Stripe recurring Price id (set via env) and
    | declares soft usage limits displayed/enforced by the app.
    */
    'plans' => [

        'free' => [
            'name' => 'Free',
            'price' => 0,
            'interval' => 'month',
            'stripe_price_id' => null,
            'limits' => [
                'messages_per_month' => 100,
                'tokens_per_month' => 100_000,
                'seats' => 1,
                'projects' => 3,
            ],
            'features' => [
                'Community & fast models',
                '100 messages / month',
                '1 seat',
            ],
        ],

        'pro' => [
            'name' => 'Pro',
            'price' => 20,
            'interval' => 'month',
            'stripe_price_id' => env('STRIPE_PRICE_PRO'),
            'limits' => [
                'messages_per_month' => 5_000,
                'tokens_per_month' => 5_000_000,
                'seats' => 1,
                'projects' => 50,
            ],
            'features' => [
                'All frontier models',
                '5,000 messages / month',
                'Priority streaming',
                'File uploads & artifacts',
            ],
        ],

        'team' => [
            'name' => 'Team',
            'price' => 60,
            'interval' => 'month',
            'stripe_price_id' => env('STRIPE_PRICE_TEAM'),
            'limits' => [
                'messages_per_month' => 50_000,
                'tokens_per_month' => 50_000_000,
                'seats' => 10,
                'projects' => -1,
            ],
            'features' => [
                'Everything in Pro',
                '10 seats included',
                'Shared workspaces & agents',
                'Usage analytics',
            ],
        ],

    ],
];
