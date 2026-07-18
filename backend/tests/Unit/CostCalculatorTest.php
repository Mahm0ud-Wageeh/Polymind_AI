<?php

namespace Tests\Unit;

use App\Services\AI\Support\CostCalculator;
use Tests\TestCase;

class CostCalculatorTest extends TestCase
{
    public function test_estimate_uses_the_pricing_table(): void
    {
        config(['ai.pricing.test-model' => ['input' => 1.0, 'output' => 2.0]]);

        // 1M input tokens @ $1 + 1M output tokens @ $2 = $3.00
        $this->assertSame(3.0, CostCalculator::estimate('test-model', 1_000_000, 1_000_000));
    }

    public function test_estimate_returns_zero_for_unknown_models(): void
    {
        $this->assertSame(0.0, CostCalculator::estimate('does-not-exist', 1000, 1000));
    }

    public function test_estimate_scales_with_token_counts(): void
    {
        config(['ai.pricing.test-model' => ['input' => 10.0, 'output' => 30.0]]);

        // 500k input @ $10/1M = $5.00 ; 250k output @ $30/1M = $7.50
        $this->assertSame(12.5, CostCalculator::estimate('test-model', 500_000, 250_000));
    }

    public function test_approx_tokens_uses_roughly_four_chars_per_token(): void
    {
        $this->assertSame(2, CostCalculator::approxTokens('12345678'));
        $this->assertSame(3, CostCalculator::approxTokens('123456789'));
        $this->assertSame(0, CostCalculator::approxTokens(''));
    }
}
