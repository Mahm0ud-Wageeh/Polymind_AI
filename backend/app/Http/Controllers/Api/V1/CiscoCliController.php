<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use App\Services\AI\AiManager;
use App\Services\AI\Data\ChatRequest;
use App\Services\AI\Schemas\CiscoCliSchema;
use Illuminate\Http\Request;

class CiscoCliController extends Controller
{
    public function __construct(protected AiManager $ai) {}

    public function generate(Request $request)
    {
        $data = $request->validate([
            'workspace_id' => ['required', 'uuid'],
            'device_type' => ['required', 'string'],
            'platform' => ['required', 'string'],
            'features' => ['required', 'array'],
            'parameters' => ['nullable', 'array'],
        ]);

        $this->authorizeWorkspace($request, $data['workspace_id']);

        $systemPrompt = "You are a CCIE-level network engineer. You are tasked with generating production-ready Cisco CLI configuration for a {$data['platform']} {$data['device_type']}. "
            . "Generate the configuration strictly based on the requested features and parameters. "
            . "Do not include arbitrary configuration that was not requested. "
            . "Include brief comments (using '!') explaining sections of the configuration. "
            . "Return a JSON object containing the full generated 'configuration' string and an 'explanation' string.";

        $userPrompt = "Please generate Cisco CLI configuration for the following features: \n"
            . "- " . implode("\n- ", $data['features']) . "\n\n"
            . "Parameters provided:\n"
            . json_encode($data['parameters'] ?? [], JSON_PRETTY_PRINT);

        $chatRequest = new ChatRequest(
            model: config('ai.default_model', 'gpt-4o-mini'),
            messages: [['role' => 'user', 'content' => $userPrompt]],
            temperature: 0.1, // Low temperature for consistent configurations
            systemPrompt: $systemPrompt,
        );

        $jsonSchema = [
            'type' => 'object',
            'properties' => [
                'configuration' => [
                    'type' => 'string',
                    'description' => 'The raw Cisco CLI configuration, including inline comments (!).',
                ],
                'explanation' => [
                    'type' => 'string',
                    'description' => 'A brief explanation of what the configuration does and any important considerations.',
                ],
            ],
            'required' => ['configuration', 'explanation'],
            'additionalProperties' => false,
        ];

        $result = $this->ai->structured($chatRequest, $jsonSchema);

        return response()->json([
            'data' => $result,
        ]);
    }

    private function authorizeWorkspace(Request $request, string $workspaceId): void
    {
        $workspace = Workspace::findOrFail($workspaceId);
        abort_unless(
            $request->user()->organizations()->where('organizations.id', $workspace->organization_id)->exists(),
            403,
            'Unauthorized access to workspace.',
        );
    }
}
