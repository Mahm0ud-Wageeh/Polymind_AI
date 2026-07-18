<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use App\Services\AI\AiManager;
use App\Services\AI\Data\ChatRequest;
use Illuminate\Http\Request;

class TroubleshootController extends Controller
{
    public function __construct(protected AiManager $ai) {}

    public function analyze(Request $request)
    {
        $data = $request->validate([
            'workspace_id' => ['required', 'uuid'],
            'input' => ['required', 'string'],
            'type' => ['required', 'string', 'in:config,log,show_command,packet_tracer,other'],
            'context' => ['nullable', 'string'],
        ]);

        $this->authorizeWorkspace($request, $data['workspace_id']);

        $systemPrompt = "You are a CCIE-level network troubleshooting expert. Your task is to analyze the provided network information (configuration, logs, or show command output) to identify the root cause of the issue. "
            . "Provide a clear root cause, assign a severity level (critical, high, medium, low), explain the fix step-by-step, provide the exact CLI commands to resolve the issue (if applicable), and list any best practice recommendations.";

        $userPrompt = "Analyze the following network {$data['type']}:\n\n"
            . "Input:\n{$data['input']}\n\n";

        if (!empty($data['context'])) {
            $userPrompt .= "Additional Context/Symptoms:\n{$data['context']}\n";
        }

        $chatRequest = new ChatRequest(
            model: config('ai.default_model', 'gpt-4o'), // Use a smarter model for troubleshooting
            messages: [['role' => 'user', 'content' => $userPrompt]],
            temperature: 0.1,
            systemPrompt: $systemPrompt,
        );

        $jsonSchema = [
            'type' => 'object',
            'properties' => [
                'rootCause' => [
                    'type' => 'string',
                    'description' => 'The identified root cause of the problem.',
                ],
                'severity' => [
                    'type' => 'string',
                    'enum' => ['critical', 'high', 'medium', 'low'],
                ],
                'explanation' => [
                    'type' => 'string',
                    'description' => 'A detailed explanation of why the problem occurred and how the fix works.',
                ],
                'fixCommands' => [
                    'type' => 'string',
                    'description' => 'The exact CLI commands required to fix the issue. If not applicable, return an empty string or N/A.',
                ],
                'bestPractices' => [
                    'type' => 'array',
                    'items' => ['type' => 'string'],
                    'description' => 'A list of related best practices to prevent similar issues in the future.',
                ],
            ],
            'required' => ['rootCause', 'severity', 'explanation', 'fixCommands', 'bestPractices'],
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
