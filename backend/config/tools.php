<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Built-in tools
    |--------------------------------------------------------------------------
    | Capabilities an agent can be granted. Surfaced in the Library UI and
    | referenced by id from an agent's `tools` array.
    */
    'builtin' => [
        [
            'id' => 'web_search',
            'name' => 'Web Search',
            'description' => 'Search the web for up-to-date information.',
            'icon' => 'Globe',
            'category' => 'research',
        ],
        [
            'id' => 'code_interpreter',
            'name' => 'Code Interpreter',
            'description' => 'Run and evaluate code snippets in a sandbox.',
            'icon' => 'Terminal',
            'category' => 'development',
        ],
        [
            'id' => 'file_reader',
            'name' => 'File Reader',
            'description' => 'Read and extract text from uploaded files.',
            'icon' => 'FileText',
            'category' => 'files',
        ],
        [
            'id' => 'image_generation',
            'name' => 'Image Generation',
            'description' => 'Generate images from a text prompt.',
            'icon' => 'Image',
            'category' => 'creative',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | MCP servers (Model Context Protocol)
    |--------------------------------------------------------------------------
    | Optional external tool servers. Configure via env; disabled entries are
    | filtered out so the list only contains servers you have set up.
    */
    'mcp_servers' => array_values(array_filter([
        env('MCP_GITHUB_URL') ? [
            'id' => 'github',
            'name' => 'GitHub',
            'description' => 'Access repositories, issues, and pull requests.',
            'url' => env('MCP_GITHUB_URL'),
            'icon' => 'Github',
        ] : null,
        env('MCP_SLACK_URL') ? [
            'id' => 'slack',
            'name' => 'Slack',
            'description' => 'Read and post messages across your Slack workspace.',
            'url' => env('MCP_SLACK_URL'),
            'icon' => 'MessageSquare',
        ] : null,
    ])),
];
