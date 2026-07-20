<?php

use App\Services\AI\Providers\AnthropicProvider;
use App\Services\AI\Providers\GeminiProvider;
use App\Services\AI\Providers\OpenAiCompatibleProvider;

return [

    /*
    |--------------------------------------------------------------------------
    | Default provider & model
    |--------------------------------------------------------------------------
    */
    'default' => env('AI_DEFAULT_PROVIDER', 'groq'),
    'default_model' => env('AI_DEFAULT_MODEL', 'llama-3.3-70b-versatile'),

    /*
    |--------------------------------------------------------------------------
    | Retry / fallback strategy
    |--------------------------------------------------------------------------
    | When a request to the primary provider fails, the AiManager will try the
    | providers in `fallbacks` order until one succeeds.
    */
    'retries' => (int) env('AI_RETRIES', 2),
    'retry_sleep_ms' => (int) env('AI_RETRY_SLEEP_MS', 400),
    'fallbacks' => ['openai', 'openrouter'],

    /*
    |--------------------------------------------------------------------------
    | Providers
    |--------------------------------------------------------------------------
    | Most modern providers speak the OpenAI Chat Completions dialect, so they
    | share the OpenAiCompatibleProvider driver and only differ by base_url +
    | api_key. Anthropic and Gemini use dedicated drivers.
    */
    'providers' => [

        'openai' => [
            'driver' => OpenAiCompatibleProvider::class,
            'label' => 'OpenAI',
            'api_key' => env('OPENAI_API_KEY'),
            'base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
            'models' => ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'o3-mini'],
        ],

        'anthropic' => [
            'driver' => AnthropicProvider::class,
            'label' => 'Anthropic',
            'api_key' => env('ANTHROPIC_API_KEY'),
            'base_url' => env('ANTHROPIC_BASE_URL', 'https://api.anthropic.com/v1'),
            'version' => '2023-06-01',
            'models' => ['claude-3-7-sonnet-latest', 'claude-3-5-haiku-latest'],
        ],

        'gemini' => [
            'driver' => GeminiProvider::class,
            'label' => 'Google Gemini',
            'api_key' => env('GEMINI_API_KEY'),
            'base_url' => env('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta'),
            'models' => ['gemini-2.0-flash', 'gemini-1.5-pro'],
        ],

        'groq' => [
            'driver' => OpenAiCompatibleProvider::class,
            'label' => 'Groq',
            'api_key' => env('GROQ_API_KEY'),
            'base_url' => env('GROQ_BASE_URL', 'https://api.groq.com/openai/v1'),
            'models' => ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
        ],

        'openrouter' => [
            'driver' => OpenAiCompatibleProvider::class,
            'label' => 'OpenRouter',
            'api_key' => env('OPENROUTER_API_KEY'),
            'base_url' => env('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1'),
            'models' => ['openai/gpt-4o', 'anthropic/claude-3.7-sonnet'],
        ],

        'deepseek' => [
            'driver' => OpenAiCompatibleProvider::class,
            'label' => 'DeepSeek',
            'api_key' => env('DEEPSEEK_API_KEY'),
            'base_url' => env('DEEPSEEK_BASE_URL', 'https://api.deepseek.com/v1'),
            'models' => ['deepseek-chat', 'deepseek-reasoner'],
        ],

        'mistral' => [
            'driver' => OpenAiCompatibleProvider::class,
            'label' => 'Mistral',
            'api_key' => env('MISTRAL_API_KEY'),
            'base_url' => env('MISTRAL_BASE_URL', 'https://api.mistral.ai/v1'),
            'models' => ['mistral-large-latest', 'mistral-small-latest'],
        ],

        'ollama' => [
            'driver' => OpenAiCompatibleProvider::class,
            'label' => 'Ollama (local)',
            'api_key' => env('OLLAMA_API_KEY', 'ollama'),
            'base_url' => env('OLLAMA_BASE_URL', 'http://localhost:11434/v1'),
            'models' => ['llama3.1', 'qwen2.5'],
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Rough cost table (USD per 1M tokens) for usage/cost tracking.
    |--------------------------------------------------------------------------
    */
    'pricing' => [
        'gpt-4o' => ['input' => 2.50, 'output' => 10.00],
        'gpt-4o-mini' => ['input' => 0.15, 'output' => 0.60],
        'claude-3-7-sonnet-latest' => ['input' => 3.00, 'output' => 15.00],
        'gemini-2.0-flash' => ['input' => 0.10, 'output' => 0.40],
    ],
];
