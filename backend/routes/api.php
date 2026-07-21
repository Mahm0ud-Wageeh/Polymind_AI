<?php

use App\Http\Controllers\Api\V1\AgentController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\OAuthController;
use App\Http\Controllers\Api\V1\Auth\PasswordResetController;
use App\Http\Controllers\Api\V1\BillingController;
use App\Http\Controllers\Api\V1\BillingWebhookController;
use App\Http\Controllers\Api\V1\ChatController;
use App\Http\Controllers\Api\V1\CiscoCliController;
use App\Http\Controllers\Api\V1\ConversationController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\FileController;
use App\Http\Controllers\Api\V1\LabController;
use App\Http\Controllers\Api\V1\MessageController;
use App\Http\Controllers\Api\V1\NetworkDesignController;
use App\Http\Controllers\Api\V1\NetworkToolController;
use App\Http\Controllers\Api\V1\ProjectController;
use App\Http\Controllers\Api\V1\ProviderController;
use App\Http\Controllers\Api\V1\TemplateController;
use App\Http\Controllers\Api\V1\ToolController;
use App\Http\Controllers\Api\V1\TroubleshootController;
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
        Route::patch('auth/me', [AuthController::class, 'updateProfile']);
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::post('auth/email/verify', [AuthController::class, 'verifyEmail']);

        Route::apiResource('workspaces', WorkspaceController::class);
        Route::apiResource('projects', ProjectController::class);
        Route::apiResource('conversations', ConversationController::class);
        Route::apiResource('conversations.messages', MessageController::class)
            ->only(['index', 'store', 'update', 'destroy']);
        Route::apiResource('agents', AgentController::class);
        Route::apiResource('templates', TemplateController::class);
        Route::apiResource('files', FileController::class)->only(['index', 'store', 'show', 'destroy']);

        // Network designs: CRUD + AI generation.
        Route::apiResource('network-designs', NetworkDesignController::class);
        Route::post('network-designs/generate', [NetworkDesignController::class, 'generate']);

        // Tools (tighter throttle — compute-heavy or AI-backed).
        Route::middleware('throttle:tools')->group(function () {
            Route::post('tools/cisco-cli/generate', [CiscoCliController::class, 'generate']);
            Route::post('tools/troubleshoot/analyze', [TroubleshootController::class, 'analyze']);
            Route::post('tools/ip-plan', [NetworkToolController::class, 'planIp']);
            Route::post('tools/validate', [NetworkToolController::class, 'validateDesign']);
            Route::post('tools/config-diff', [NetworkToolController::class, 'diff']);
            Route::post('tools/documentation/generate', [NetworkToolController::class, 'documentation']);

            Route::apiResource('labs', LabController::class);
            Route::post('labs/{lab}/start', [LabController::class, 'start']);
            Route::post('labs/{lab}/stop', [LabController::class, 'stop']);
            Route::post('labs/{lab}/refresh', [LabController::class, 'refresh']);
        });

        // Chat: streamed completion (SSE) + regenerate (tighter throttle — AI credits).
        Route::middleware('throttle:chat')->group(function () {
            Route::post('chat/stream', [ChatController::class, 'stream']);
            Route::post('chat/completions', [ChatController::class, 'complete']);
        });

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
