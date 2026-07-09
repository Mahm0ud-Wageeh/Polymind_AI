<?php

namespace App\Services\AI\Contracts;

use App\Services\AI\Data\ChatRequest;
use App\Services\AI\Data\ChatResponse;
use Closure;

interface AiProvider
{
    /**
     * The provider identifier (e.g. "openai", "anthropic").
     */
    public function key(): string;

    /**
     * Available model identifiers for this provider.
     *
     * @return array<int, string>
     */
    public function models(): array;

    /**
     * Perform a blocking chat completion.
     */
    public function chat(ChatRequest $request): ChatResponse;

    /**
     * Perform a streamed chat completion. The $onChunk closure is invoked with
     * each incremental text delta. Returns the fully assembled response.
     *
     * @param  Closure(string $delta): void  $onChunk
     */
    public function stream(ChatRequest $request, Closure $onChunk): ChatResponse;
}
