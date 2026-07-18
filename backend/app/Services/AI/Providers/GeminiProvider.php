<?php

namespace App\Services\AI\Providers;

use App\Services\AI\Contracts\AiProvider;
use App\Services\AI\Data\ChatRequest;
use App\Services\AI\Data\ChatResponse;
use App\Services\AI\Support\CostCalculator;
use Closure;
use Illuminate\Support\Facades\Http;

/**
 * Driver for Google Gemini's generateContent API. Roles are mapped to Gemini's
 * "user"/"model" convention and the system prompt uses system_instruction.
 *
 * Structured output uses Gemini's native responseMimeType + responseSchema,
 * which is the cleanest implementation among the three providers.
 */
class GeminiProvider implements AiProvider
{
    /**
     * @param  array<string, mixed>  $config
     */
    public function __construct(
        protected string $name,
        protected array $config,
    ) {}

    public function key(): string
    {
        return $this->name;
    }

    public function models(): array
    {
        return $this->config['models'] ?? [];
    }

    public function chat(ChatRequest $request): ChatResponse
    {
        $key = $this->config['api_key'] ?? '';
        $response = Http::baseUrl(rtrim($this->config['base_url'], '/'))
            ->acceptJson()
            ->timeout(120)
            ->post("/models/{$request->model}:generateContent?key={$key}", $this->payload($request))
            ->throw()
            ->json();

        $content = $response['candidates'][0]['content']['parts'][0]['text'] ?? '';
        $usage = $response['usageMetadata'] ?? [];
        $tokensInput = (int) ($usage['promptTokenCount'] ?? 0);
        $tokensOutput = (int) ($usage['candidatesTokenCount'] ?? 0);

        return $this->makeResponse($request, $content, $tokensInput, $tokensOutput, $response['candidates'][0]['finishReason'] ?? null);
    }

    public function stream(ChatRequest $request, Closure $onChunk): ChatResponse
    {
        // Gemini streaming uses :streamGenerateContent. For simplicity and
        // reliability we fall back to a blocking call and emit the whole text
        // as a single chunk; swap to SSE parsing when low-latency is required.
        $response = $this->chat($request);
        $onChunk($response->content);

        return $response;
    }

    /**
     * Parse structured JSON when the request asked for structured output.
     *
     * @return array<string, mixed>|null
     */
    protected function parseStructured(ChatRequest $request, string $content): ?array
    {
        if (! $request->wantsStructured()) {
            return null;
        }

        $decoded = json_decode($content, true);

        return is_array($decoded) ? $decoded : null;
    }

    protected function makeResponse(ChatRequest $request, string $content, int $tokensInput, int $tokensOutput, ?string $finish): ChatResponse
    {
        return new ChatResponse(
            content: $content,
            provider: $this->name,
            model: $request->model,
            tokensInput: $tokensInput,
            tokensOutput: $tokensOutput,
            cost: CostCalculator::estimate($request->model, $tokensInput, $tokensOutput),
            finishReason: $finish,
            structured: $this->parseStructured($request, $content),
        );
    }

    /**
     * @return array<string, mixed>
     */
    protected function payload(ChatRequest $request): array
    {
        $contents = array_map(fn (array $m) => [
            'role' => $m['role'] === 'assistant' ? 'model' : 'user',
            'parts' => [['text' => $m['content']]],
        ], $request->messages);

        $generationConfig = ['temperature' => $request->temperature];

        if ($request->wantsStructured()) {
            $generationConfig['responseMimeType'] = 'application/json';
            if ($request->jsonSchema) {
                $generationConfig['responseSchema'] = $request->jsonSchema;
            }
        }

        $payload = [
            'contents' => $contents,
            'generationConfig' => $generationConfig,
        ];

        if ($request->systemPrompt) {
            $payload['system_instruction'] = ['parts' => [['text' => $request->systemPrompt]]];
        }

        return $payload;
    }
}
