<?php

namespace App\Services\AI\Providers;

use App\Services\AI\Contracts\AiProvider;
use App\Services\AI\Data\ChatRequest;
use App\Services\AI\Data\ChatResponse;
use App\Services\AI\Support\CostCalculator;
use Closure;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Driver for every provider that implements the OpenAI Chat Completions API:
 * OpenAI, Groq, OpenRouter, DeepSeek, Mistral and Ollama. They differ only by
 * base_url + api_key, supplied via config/ai.php.
 */
class OpenAiCompatibleProvider implements AiProvider
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
        $response = $this->client()
            ->post('/chat/completions', $this->payload($request, stream: false))
            ->throw()
            ->json();

        $content = $response['choices'][0]['message']['content'] ?? '';
        $usage = $response['usage'] ?? [];

        return $this->makeResponse($request, $content, $usage, $response['choices'][0]['finish_reason'] ?? null);
    }

    /**
     * Parse structured JSON content from a chat response when the request
     * asked for JSON output. Returns null when parsing fails or the request
     * didn't ask for structured output.
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

    public function stream(ChatRequest $request, Closure $onChunk): ChatResponse
    {
        $buffer = '';

        $response = $this->client()
            ->withOptions(['stream' => true])
            ->post('/chat/completions', $this->payload($request, stream: true));

        if (! $response->successful()) {
            throw new RuntimeException("AI provider [{$this->name}] stream failed: ".$response->status());
        }

        $body = $response->toPsrResponse()->getBody();

        while (! $body->eof()) {
            $line = $this->readLine($body);
            if ($line === '' || ! str_starts_with($line, 'data:')) {
                continue;
            }

            $data = trim(substr($line, 5));
            if ($data === '[DONE]') {
                break;
            }

            $json = json_decode($data, true);
            $delta = $json['choices'][0]['delta']['content'] ?? '';
            if ($delta !== '') {
                $buffer .= $delta;
                $onChunk($delta);
            }
        }

        $tokensOutput = CostCalculator::approxTokens($buffer);

        return $this->makeResponse($request, $buffer, ['completion_tokens' => $tokensOutput], 'stop');
    }

    /**
     * @param  array<string, mixed>  $usage
     */
    protected function makeResponse(ChatRequest $request, string $content, array $usage, ?string $finish): ChatResponse
    {
        $tokensInput = (int) ($usage['prompt_tokens'] ?? 0);
        $tokensOutput = (int) ($usage['completion_tokens'] ?? 0);

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
    protected function payload(ChatRequest $request, bool $stream): array
    {
        $payload = array_filter([
            'model' => $request->model,
            'messages' => $request->withSystem(),
            'temperature' => $request->temperature,
            'max_tokens' => $request->maxTokens,
            'stream' => $stream,
        ], fn ($v) => $v !== null);

        if ($request->wantsStructured()) {
            if ($request->jsonSchema) {
                $payload['response_format'] = [
                    'type' => 'json_schema',
                    'json_schema' => [
                        'name' => 'structured_output',
                        'schema' => $request->jsonSchema,
                        'strict' => true,
                    ],
                ];
            } else {
                $payload['response_format'] = ['type' => 'json_object'];
            }
        }

        return $payload;
    }

    protected function client()
    {
        return Http::baseUrl(rtrim($this->config['base_url'], '/'))
            ->withToken($this->config['api_key'] ?? '')
            ->acceptJson()
            ->timeout(120);
    }

    protected function readLine($stream): string
    {
        $line = '';
        while (! $stream->eof()) {
            $char = $stream->read(1);
            if ($char === "\n") {
                break;
            }
            $line .= $char;
        }

        return rtrim($line, "\r");
    }
}
