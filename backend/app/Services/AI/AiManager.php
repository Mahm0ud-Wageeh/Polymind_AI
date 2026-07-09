<?php

namespace App\Services\AI;

use App\Services\AI\Contracts\AiProvider;
use App\Services\AI\Data\ChatRequest;
use App\Services\AI\Data\ChatResponse;
use Closure;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;
use Throwable;

/**
 * Resolves configured AI providers and orchestrates retries + fallbacks.
 */
class AiManager
{
    /** @var array<string, AiProvider> */
    protected array $resolved = [];

    public function provider(?string $name = null): AiProvider
    {
        $name ??= config('ai.default');

        if (isset($this->resolved[$name])) {
            return $this->resolved[$name];
        }

        $config = config("ai.providers.{$name}");
        if (! is_array($config)) {
            throw new InvalidArgumentException("AI provider [{$name}] is not configured.");
        }

        /** @var class-string<AiProvider> $driver */
        $driver = $config['driver'];

        return $this->resolved[$name] = new $driver($name, $config);
    }

    /**
     * Blocking completion with retry + provider fallback.
     */
    public function chat(ChatRequest $request, ?string $provider = null): ChatResponse
    {
        return $this->run($provider, fn (AiProvider $p) => $p->chat($request));
    }

    /**
     * Streamed completion with retry + provider fallback.
     *
     * @param  Closure(string $delta): void  $onChunk
     */
    public function stream(ChatRequest $request, Closure $onChunk, ?string $provider = null): ChatResponse
    {
        return $this->run($provider, fn (AiProvider $p) => $p->stream($request, $onChunk));
    }

    /**
     * @param  Closure(AiProvider): ChatResponse  $callback
     */
    protected function run(?string $provider, Closure $callback): ChatResponse
    {
        $chain = array_values(array_unique(array_filter([
            $provider ?? config('ai.default'),
            ...config('ai.fallbacks', []),
        ])));

        $retries = (int) config('ai.retries', 2);
        $sleep = (int) config('ai.retry_sleep_ms', 400);
        $lastError = null;

        foreach ($chain as $name) {
            for ($attempt = 0; $attempt <= $retries; $attempt++) {
                try {
                    return $callback($this->provider($name));
                } catch (Throwable $e) {
                    $lastError = $e;
                    Log::warning('AI request failed', [
                        'provider' => $name,
                        'attempt' => $attempt,
                        'error' => $e->getMessage(),
                    ]);
                    if ($attempt < $retries) {
                        usleep($sleep * 1000 * ($attempt + 1));
                    }
                }
            }
        }

        throw $lastError ?? new \RuntimeException('All AI providers failed.');
    }

    /**
     * Provider catalog for the frontend model picker.
     *
     * @return array<int, array{key: string, label: string, models: array<int, string>, enabled: bool}>
     */
    public function catalog(): array
    {
        return collect(config('ai.providers'))
            ->map(fn (array $c, string $key) => [
                'key' => $key,
                'label' => $c['label'] ?? $key,
                'models' => $c['models'] ?? [],
                'enabled' => ! empty($c['api_key']),
            ])
            ->values()
            ->all();
    }
}
