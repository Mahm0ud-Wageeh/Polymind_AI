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

        $content = $response['content'][0]['text'] ?? '';
        $usage = $response['usage'] ?? [];

        return $this->makeResponse($request, $content, [
            'prompt_tokens' => $usage['input_tokens'] ?? 0,
            'completion_tokens' => $usage['output_tokens'] ?? 0,
        ], $response['stop_reason'] ?? null);
    }

    public function stream(ChatRequest $request, Closure $onChunk): ChatResponse
    {
        $buffer = '';

        $response = $this->client()
            ->withOptions(['stream' => true])
            ->post('/messages', $this->payload($request, stream: true));

        if (! $response->successful()) {
            throw new RuntimeException("Anthropic stream failed: " . $response->status());
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
        );
    }

    /**
     * @return array<string, mixed>
     */
    protected function payload(ChatRequest $request, bool $stream): array
    {
        return array_filter([
            'model' => $request->model,
            'system' => $request->systemPrompt,
            'messages' => $request->messages,
            'temperature' => $request->temperature,
            'max_tokens' => $request->maxTokens ?? 4096,
            'stream' => $stream,
        ], fn ($v) => $v !== null);
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
