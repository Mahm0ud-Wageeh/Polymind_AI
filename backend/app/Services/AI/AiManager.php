<?php

namespace App\Services\AI;

use App\Services\AI\Contracts\AiProvider;
use App\Services\AI\Data\ChatRequest;
use App\Services\AI\Data\ChatResponse;
use App\Services\AI\Exceptions\StructuredOutputException;
use App\Services\AI\Support\SchemaValidator;
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
     * Structured (JSON) completion — requests JSON output, validates against a
     * JSON Schema, and returns the parsed array. On validation failure it
     * retries once with a self-correction prompt before throwing.
     *
     * @param  array<string, mixed>  $jsonSchema  JSON Schema the output must satisfy.
     * @return array<string, mixed> The validated structured output.
     *
     * @throws StructuredOutputException When the output doesn't match the schema.
     */
    public function structured(ChatRequest $request, array $jsonSchema, ?string $provider = null): array
    {
        // Build a request that asks for structured JSON output.
        $structuredRequest = new ChatRequest(
            model: $request->model,
            messages: $request->messages,
            temperature: $request->temperature,
            maxTokens: $request->maxTokens,
            systemPrompt: $request->systemPrompt,
            options: $request->options,
            responseFormat: 'json',
            jsonSchema: $jsonSchema,
        );

        $lastError = null;

        for ($attempt = 0; $attempt <= 1; $attempt++) {
            /** @var ChatResponse $response */
            $response = $this->chat($structuredRequest, $provider);

            $data = $response->structured;

            if ($data === null) {
                // Try parsing from content as fallback
                $decoded = json_decode($response->content, true);
                $data = is_array($decoded) ? $decoded : null;
            }

            if ($data === null) {
                $lastError = new StructuredOutputException(
                    'Could not parse structured output from model response.',
                    rawContent: ['content' => $response->content],
                );
                if ($attempt === 0) {
                    // Self-correction: ask the model to fix its output.
                    $structuredRequest = new ChatRequest(
                        model: $structuredRequest->model,
                        messages: [
                            ...$request->messages,
                            ['role' => 'assistant', 'content' => $response->content],
                            ['role' => 'user', 'content' => 'The previous response was not valid JSON. '
                                .'Please respond with valid JSON matching the required schema. Do not include any text outside the JSON.'],
                        ],
                        temperature: $structuredRequest->temperature,
                        maxTokens: $structuredRequest->maxTokens,
                        systemPrompt: $structuredRequest->systemPrompt,
                        responseFormat: 'json',
                        jsonSchema: $jsonSchema,
                    );
                }

                continue;
            }

            // Validate against schema.
            $errors = SchemaValidator::validate($data, $jsonSchema);

            if (count($errors) === 0) {
                return $data;
            }

            $lastError = new StructuredOutputException(
                'Structured output validation failed with '.count($errors).' error(s).',
                rawContent: $data,
                errors: $errors,
            );

            if ($attempt === 0) {
                // Self-correction with validation feedback.
                $correctionMessage = 'The last response had schema validation errors:'
                    ."\n".implode("\n", array_map(fn ($e) => "- {$e}", $errors))
                    ."\n\nPlease correct the errors and respond with valid JSON only.";

                $structuredRequest = new ChatRequest(
                    model: $structuredRequest->model,
                    messages: [
                        ...$request->messages,
                        ['role' => 'assistant', 'content' => $response->content],
                        ['role' => 'user', 'content' => $correctionMessage],
                    ],
                    temperature: $structuredRequest->temperature,
                    maxTokens: $structuredRequest->maxTokens,
                    systemPrompt: $structuredRequest->systemPrompt,
                    responseFormat: 'json',
                    jsonSchema: $jsonSchema,
                );
            }
        }

        throw $lastError ?? new StructuredOutputException('Structured output failed after retries.');
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
