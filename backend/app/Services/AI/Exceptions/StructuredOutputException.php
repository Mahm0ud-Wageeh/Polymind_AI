<?php

namespace App\Services\AI\Exceptions;

use RuntimeException;

/**
 * Thrown when the AI provider's structured output cannot be parsed or
 * validated against the expected JSON Schema.
 */
class StructuredOutputException extends RuntimeException
{
    /**
     * @param  array<string, mixed>|null  $rawContent  The raw text returned by the model
     * @param  list<string>  $errors  Validation error messages
     */
    public function __construct(
        string $message = 'Structured output validation failed.',
        public readonly ?array $rawContent = null,
        public readonly array $errors = [],
        int $code = 0,
        ?\Throwable $previous = null,
    ) {
        parent::__construct($message, $code, $previous);
    }
}
