<?php

namespace App\Services\AI\Data;

/**
 * Provider-agnostic chat request.
 */
readonly class ChatRequest
{
    /**
     * @param  array<int, array{role: string, content: string}>  $messages
     * @param  array<string, mixed>  $options
     */
    public function __construct(
        public string $model,
        public array $messages,
        public float $temperature = 0.7,
        public ?int $maxTokens = null,
        public ?string $systemPrompt = null,
        public array $options = [],
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
}
