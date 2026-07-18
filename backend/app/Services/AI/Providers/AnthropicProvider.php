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
 * Driver for Anthropic's Messages API. Anthropic takes the system prompt as a
 * top-level field and streams via server-sent events with typed event lines.
 *
 * Structured output is implemented via a forced single tool call, since
 * Anthropic does not support native json_schema response_format (as of 2025).
 */
class AnthropicProvider implements AiProvider
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
            ->post('/messages', $this->payload($request, stream: false))
            ->throw()
            ->json();

        $content = '';
        $structured = null;
        foreach ($response['content'] ?? [] as $block) {
            if (($block['type'] ?? '') === 'text') {
                $content .= $block['text'] ?? '';
            } elseif (($block['type'] ?? '') === 'tool_use' && ($block['name'] ?? '') === 'emit') {
                $structured = $block['input'] ?? null;
            }
        }

        $usage = $response['usage'] ?? [];

        return $this->makeResponse($request, $content, [
            'prompt_tokens' => $usage['input_tokens'] ?? 0,
            'completion_tokens' => $usage['output_tokens'] ?? 0,
        ], $response['stop_reason'] ?? null, $structured);
    }

    public function stream(ChatRequest $request, Closure $onChunk): ChatResponse
    {
        // Streaming structured output is not well-supported with forced tools;
        // fall back to blocking chat() for structured requests.
        if ($request->wantsStructured()) {
            $response = $this->chat($request);
            $onChunk(json_encode($response->structured ?? $response->content) ?: '');

            return $response;
        }

        $buffer = '';

        $response = $this->client()
            ->withOptions(['stream' => true])
            ->post('/messages', $this->payload($request, stream: true));

        if (! $response->successful()) {
            throw new RuntimeException('Anthropic stream failed: '.$response->status());
        }

        $body = $response->toPsrResponse()->getBody();

        while (! $body->eof()) {
            $line = trim($this->readLine($body));
            if (! str_starts_with($line, 'data:')) {
                continue;
            }
            $json = json_decode(trim(substr($line, 5)), true);
            if (($json['type'] ?? null) === 'content_block_delta') {
                $delta = $json['delta']['text'] ?? '';
                if ($delta !== '') {
                    $buffer .= $delta;
                    $onChunk($delta);
                }
            }
        }

        return $this->makeResponse($request, $buffer, [
            'completion_tokens' => CostCalculator::approxTokens($buffer),
        ], 'end_turn');
    }

    /**
     * Parse structured JSON from text content as fallback (when no schema given).
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

    /**
     * @param  array<string, mixed>  $usage
     * @param  array<string, mixed>|null  $structured
     */
    protected function makeResponse(ChatRequest $request, string $content, array $usage, ?string $finish, ?array $structured = null): ChatResponse
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
            structured: $structured ?? $this->parseStructured($request, $content),
        );
    }

    /**
     * @return array<string, mixed>
     */
    protected function payload(ChatRequest $request, bool $stream): array
    {
        $payload = array_filter([
            'model' => $request->model,
            'messages' => $request->messages,
            'temperature' => $request->temperature,
            'max_tokens' => $request->maxTokens ?? 4096,
            'stream' => $stream,
        ], fn ($v) => $v !== null);

        // System prompt goes in the top-level field, not in messages.
        if ($request->systemPrompt) {
            $systemText = $request->systemPrompt;

            // When requesting JSON without a schema, hint the model.
            if ($request->responseFormat === 'json' && ! $request->jsonSchema) {
                $systemText .= "\n\nRespond only in valid JSON.";
            }

            $payload['system'] = $systemText;
        }

        // Structured output via forced tool call.
        if ($request->wantsStructured() && $request->jsonSchema) {
            $payload['tools'] = [
                [
                    'name' => 'emit',
                    'description' => 'Emit the structured output for this request.',
                    'input_schema' => $request->jsonSchema,
                ],
            ];
            $payload['tool_choice'] = ['type' => 'tool', 'name' => 'emit'];
        }

        return $payload;
    }

    protected function client()
    {
        return Http::baseUrl(rtrim($this->config['base_url'], '/'))
            ->withHeaders([
                'x-api-key' => $this->config['api_key'] ?? '',
                'anthropic-version' => $this->config['version'] ?? '2023-06-01',
            ])
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
