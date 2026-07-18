<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\NetworkDesignResource;
use App\Models\NetworkDesign;
use App\Models\Project;
use App\Models\Workspace;
use App\Services\AI\AiManager;
use App\Services\AI\Data\ChatRequest;
use App\Services\AI\Schemas\NetworkDesignSchema;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class NetworkDesignController extends Controller
{
    public function __construct(protected AiManager $ai) {}

    public function index(Request $request)
    {
        return NetworkDesignResource::collection(
            NetworkDesign::query()
                ->where('user_id', $request->user()->id)
                ->when($request->query('workspace_id'), fn ($q, $id) => $q->where('workspace_id', $id))
                ->orderByDesc('created_at')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'workspace_id' => ['required', 'uuid'],
            'project_id' => ['nullable', 'uuid'],
            'name' => ['required', 'string', 'max:255'],
            'prompt' => ['required', 'string'],
        ]);

        $this->authorizeWorkspace($request, $data['workspace_id']);
        $this->authorizeProject($data['project_id'] ?? null, $data['workspace_id']);

        return new NetworkDesignResource(
            NetworkDesign::create($data + ['user_id' => $request->user()->id, 'status' => 'draft'])
        );
    }

    public function show(NetworkDesign $networkDesign)
    {
        abort_unless($networkDesign->user_id === request()->user()->id, 403);

        return new NetworkDesignResource($networkDesign);
    }

    public function update(Request $request, NetworkDesign $networkDesign)
    {
        abort_unless($networkDesign->user_id === $request->user()->id, 403);

        $networkDesign->update($request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'status' => ['sometimes', 'string', 'in:draft,generating,ready,failed'],
            'summary' => ['sometimes', 'nullable', 'string'],
        ]));

        return new NetworkDesignResource($networkDesign);
    }

    public function destroy(Request $request, NetworkDesign $networkDesign)
    {
        abort_unless($networkDesign->user_id === $request->user()->id, 403);
        $networkDesign->delete();

        return response()->noContent();
    }

    /**
     * Generate a network design from a natural language prompt using AI.
     */
    public function generate(Request $request)
    {
        $data = $request->validate([
            'workspace_id' => ['required', 'uuid'],
            'project_id' => ['nullable', 'uuid'],
            'name' => ['nullable', 'string', 'max:255'],
            'prompt' => ['required', 'string'],
            'provider' => ['nullable', 'string'],
            'model' => ['nullable', 'string'],
        ]);

        $user = $request->user();
        $this->authorizeWorkspace($request, $data['workspace_id']);
        $this->authorizeProject($data['project_id'] ?? null, $data['workspace_id']);

        $design = NetworkDesign::create([
            'workspace_id' => $data['workspace_id'],
            'project_id' => $data['project_id'] ?? null,
            'user_id' => $user->id,
            'name' => $data['name'] ?? Str::limit($data['prompt'], 40),
            'prompt' => $data['prompt'],
            'status' => 'generating',
        ]);

        try {
            $systemPrompt = 'You are a senior network architect AI. Your task is to produce a complete, '
                .'structured network design from the user\'s natural language requirements. '
                .'Follow the schema exactly. Be specific with device models, IP ranges, and configurations. '
                .'Use industry-standard best practices for enterprise networks.';

            $chatRequest = new ChatRequest(
                model: $data['model'] ?? config('ai.default_model', 'gpt-4o-mini'),
                messages: [['role' => 'user', 'content' => $data['prompt']]],
                temperature: 0.3,
                systemPrompt: $systemPrompt,
            );

            $result = $this->ai->structured(
                $chatRequest,
                NetworkDesignSchema::schema(),
                $data['provider'] ?? null,
            );

            $design->update([
                'status' => 'ready',
                'summary' => $result['summary'] ?? '',
                'design_data' => $result,
            ]);
        } catch (\Throwable $e) {
            $design->update([
                'status' => 'failed',
                'design_data' => ['error' => $e->getMessage()],
            ]);

            throw $e;
        }

        return new NetworkDesignResource($design->fresh());
    }

    private function authorizeWorkspace(Request $request, string $workspaceId): void
    {
        $workspace = Workspace::findOrFail($workspaceId);
        abort_unless(
            $request->user()->organizations()->where('organizations.id', $workspace->organization_id)->exists(),
            403,
        );
    }

    private function authorizeProject(?string $projectId, string $workspaceId): void
    {
        if (! $projectId) {
            return;
        }

        abort_unless(Project::whereKey($projectId)->where('workspace_id', $workspaceId)->exists(), 422);
    }
}
