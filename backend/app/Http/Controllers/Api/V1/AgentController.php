<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\Workspace;
use Illuminate\Http\Request;

class AgentController extends Controller
{
    public function index(Request $request)
    {
        return Agent::query()
            ->where(fn ($q) => $q->where('user_id', $request->user()->id)->orWhere('is_public', true))
            ->when($request->query('workspace_id'), fn ($q, $id) => $q->where('workspace_id', $id))
            ->when($request->query('domain'), fn ($q, $domain) => $q->where('domain', $domain))
            ->orderBy('name')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'workspace_id' => ['nullable', 'uuid'],
            'name' => ['required', 'string', 'max:255'],
            'icon' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'system_prompt' => ['nullable', 'string'],
            'provider' => ['nullable', 'string'],
            'model' => ['nullable', 'string'],
            'temperature' => ['nullable', 'numeric', 'between:0,2'],
            'tools' => ['nullable', 'array'],
            'is_public' => ['nullable', 'boolean'],
            'domain' => ['nullable', 'string', 'max:64'],
        ]);

        $this->authorizeWorkspace($request, $data['workspace_id'] ?? null);

        return Agent::create($data + ['user_id' => $request->user()->id, 'domain' => $data['domain'] ?? 'networking']);
    }

    public function show(Request $request, Agent $agent)
    {
        $this->authorizeAccess($request, $agent);

        return $agent;
    }

    public function update(Request $request, Agent $agent)
    {
        abort_unless($agent->user_id === $request->user()->id, 403);
        $agent->update($request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'icon' => ['sometimes', 'nullable', 'string'],
            'description' => ['sometimes', 'nullable', 'string'],
            'system_prompt' => ['sometimes', 'nullable', 'string'],
            'provider' => ['sometimes', 'nullable', 'string'],
            'model' => ['sometimes', 'nullable', 'string'],
            'temperature' => ['sometimes', 'numeric', 'between:0,2'],
            'tools' => ['sometimes', 'nullable', 'array'],
            'is_public' => ['sometimes', 'boolean'],
            'domain' => ['sometimes', 'nullable', 'string', 'max:64'],
        ]));

        return $agent;
    }

    public function destroy(Request $request, Agent $agent)
    {
        abort_unless($agent->user_id === $request->user()->id, 403);
        $agent->delete();

        return response()->noContent();
    }

    private function authorizeAccess(Request $request, Agent $agent): void
    {
        if ($agent->is_public || $agent->user_id === $request->user()->id) {
            return;
        }

        $this->authorizeWorkspace($request, $agent->workspace_id);
    }

    private function authorizeWorkspace(Request $request, ?string $workspaceId): void
    {
        if (! $workspaceId) {
            return;
        }

        $workspace = Workspace::findOrFail($workspaceId);
        abort_unless(
            $request->user()->organizations()->where('organizations.id', $workspace->organization_id)->exists(),
            403,
        );
    }
}
