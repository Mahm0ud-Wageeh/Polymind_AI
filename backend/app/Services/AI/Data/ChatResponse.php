<?php

namespace App\Services\AI\Data;

/**
 * Provider-agnostic chat response.
 */
readonly class ChatResponse
{
    public function __construct(
        public string $content,
        public string $provider,
        public string $model,
        public int $tokensInput = 0,
        public int $tokensOutput = 0,
        public float $cost = 0.0,
        public ?string $finishReason = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'content' => $this->content,
            'provider' => $this->provider,
            'model' => $this->model,
            'tokens_input' => $this->tokensInput,
            'tokens_output' => $this->tokensOutput,
            'cost' => $this->cost,
            'finish_reason' => $this->finishReason,
        ];
    }
}
