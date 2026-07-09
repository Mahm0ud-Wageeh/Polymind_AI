<?php

namespace App\Services\AI\Support;

class CostCalculator
{
    /**
     * Estimate the USD cost of a completion using the pricing table in
     * config/ai.php (values are USD per 1M tokens).
     */
    public static function estimate(string $model, int $tokensInput, int $tokensOutput): float
    {
        $pricing = config("ai.pricing.{$model}");

        if (! is_array($pricing)) {
            return 0.0;
        }

        $inputCost = ($tokensInput / 1_000_000) * (float) ($pricing['input'] ?? 0);
        $outputCost = ($tokensOutput / 1_000_000) * (float) ($pricing['output'] ?? 0);

        return round($inputCost + $outputCost, 6);
    }

    /**
     * Very rough token estimate (~4 chars per token) used as a fallback when a
     * provider does not return usage data.
     */
    public static function approxTokens(string $text): int
    {
        return (int) ceil(mb_strlen($text) / 4);
    }
}
