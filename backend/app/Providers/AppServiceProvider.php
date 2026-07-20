<?php

namespace App\Providers;

use App\Services\AI\AiManager;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(AiManager::class, fn () => new AiManager);
    }

    public function boot(): void
    {
        JsonResource::withoutWrapping();

        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(120)
            ->by($request->user()?->id ?: $request->ip()));

        RateLimiter::for('auth', fn (Request $request) => Limit::perMinute($this->app->environment('testing') ? 1000 : 10)
            ->by($request->ip()));

        // Stricter limits for compute-heavy tool endpoints.
        RateLimiter::for('tools', fn (Request $request) => Limit::perMinute(20)
            ->by($request->user()?->id ?: $request->ip()));

        // Chat/SSE streams consume AI credits so they get a tighter window.
        RateLimiter::for('chat', fn (Request $request) => Limit::perMinute(30)
            ->by($request->user()?->id ?: $request->ip()));
    }
}
