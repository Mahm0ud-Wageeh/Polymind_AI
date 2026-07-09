<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\OAuthController;
use App\Http\Controllers\Api\V1\Auth\PasswordResetController;
use App\Http\Controllers\Api\V1\AgentController;
use App\Http\Controllers\Api\V1\BillingController;
use App\Http\Controllers\Api\V1\BillingWebhookController;
use App\Http\Controllers\Api\V1\ChatController;
use App\Http\Controllers\Api\V1\ConversationController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\FileController;
use App\Http\Controllers\Api\V1\MessageController;
use App\Http\Controllers\Api\V1\ProjectController;
use App\Http\Controllers\Api\V1\ProviderController;
use App\Http\Controllers\Api\V1\TemplateController;
use App\Http\Controllers\Api\V1\ToolController;
use App\Http\Controllers\Api\V1\WorkspaceController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API v1
|--------------------------------------------------------------------------
| All routes are versioned under /api/v1. Public auth routes are rate limited;
| everything else requires a valid Sanctum token/session.
*/

Route::prefix('v1')->group(function () {

    // Stripe webhook (no auth; verified by signature).
    Route::post('billing/webhook', [BillingWebhookController::class, 'handle']);

    // ----- Public -----------------------------------------------------
    Route::middleware('throttle:auth')->group(function () {
        Route::post('auth/register', [AuthController::class, 'register']);
        Route::post('auth/login', [AuthController::class, 'login']);
        Route::post('auth/forgot-password', [PasswordResetController::class, 'sendResetLink']);
        Route::post('auth/reset-password', [PasswordResetController::class, 'reset']);

        Route::get('auth/oauth/{provider}/redirect', [OAuthController::class, 'redirect']);
        Route::get('auth/oauth/{provider}/callback', [OAuthController::class, 'callback']);
    });

    // ----- Authenticated ---------------------------------------------
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::post('auth/email/verify', [AuthController::class, 'verifyEmail']);

        Route::apiResource('workspaces', WorkspaceController::class);
        Route::apiResource('projects', ProjectController::class);
        Route::apiResource('conversations', ConversationController::class);
        Route::apiResource('conversations.messages', MessageController::class)
            ->only(['index', 'store', 'destroy']);
        Route::apiResource('agents', AgentController::class);
        Route::apiResource('templates', TemplateController::class);
        Route::apiResource('files', FileController::class)->only(['index', 'store', 'show', 'destroy']);

        // Chat: streamed completion (SSE) + regenerate.
        Route::post('chat/stream', [ChatController::class, 'stream']);
        Route::post('chat/completions', [ChatController::class, 'complete']);

        // Providers, tools & usage.
        Route::get('providers', [ProviderController::class, 'index']);
        Route::get('tools', [ToolController::class, 'index']);
        Route::get('dashboard', [DashboardController::class, 'index']);

        // Billing & subscriptions.
        Route::get('billing', [BillingController::class, 'show']);
        Route::get('billing/plans', [BillingController::class, 'plans']);
        Route::post('billing/checkout', [BillingController::class, 'checkout']);
        Route::post('billing/portal', [BillingController::class, 'portal']);
    });
});
