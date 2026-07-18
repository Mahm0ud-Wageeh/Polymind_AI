<?php

namespace App\Services\AI\Data;

/**
 * Provider-agnostic chat request.
 *
 * `responseFormat` + `jsonSchema` enable structured (JSON) output mode.
 * When `responseFormat === 'json'`, providers should request a JSON-shaped
 * response, validated (where the upstream API supports it) against
 * `jsonSchema`. The result is exposed on ChatResponse::$structured.
 */
readonly class ChatRequest
{
    /**
     * @param  array<int, array{role: string, content: string}>  $messages
     * @param  array<string, mixed>  $options
     * @param  'json'|null  $responseFormat  When set to 'json', the provider must return parseable JSON.
     * @param  array<string, mixed>|null  $jsonSchema  JSON Schema describing the expected object shape.
     */
    public function __construct(
        public string $model,
        public array $messages,
        public float $temperature = 0.7,
        public ?int $maxTokens = null,
        public ?string $systemPrompt = null,
        public array $options = [],
        public ?string $responseFormat = null,
        public ?array $jsonSchema = null,
    ) {}

    /**
     * Messages with the system prompt prepended (when present).
     *
     * @return array<int, array{role: string, content: string}>
     */
    public function withSystem(): array
    {
        if (! $this->systemPrompt) {
            return $this->messages;
        }

        return array_merge(
            [['role' => 'system', 'content' => $this->systemPrompt]],
            $this->messages,
        );
    }

    /**
     * Whether this request asks for structured (JSON) output.
     */
    public function wantsStructured(): bool
    {
        return $this->responseFormat === 'json' || $this->jsonSchema !== null;
    }
}
