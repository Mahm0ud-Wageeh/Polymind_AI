<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Workspace;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        return Project::query()
            ->where('user_id', $request->user()->id)
            ->when($request->query('workspace_id'), fn ($q, $id) => $q->where('workspace_id', $id))
            ->orderBy('name')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'workspace_id' => ['required', 'uuid'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'color' => ['nullable', 'string', 'max:32'],
        ]);

        $this->authorizeWorkspace($request, $data['workspace_id']);

        return Project::create($data + ['user_id' => $request->user()->id]);
    }

    public function show(Request $request, Project $project)
    {
        $this->authorizeOwner($request, $project);

        return $project->load('conversations');
    }

    public function update(Request $request, Project $project)
    {
        $this->authorizeOwner($request, $project);
        $project->update($request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'color' => ['sometimes', 'nullable', 'string', 'max:32'],
        ]));

        return $project;
    }

    public function destroy(Request $request, Project $project)
    {
        $this->authorizeOwner($request, $project);
        $project->delete();

        return response()->noContent();
    }

    private function authorizeOwner(Request $request, Project $project): void
    {
        abort_unless($project->user_id === $request->user()->id, 403);
    }

    private function authorizeWorkspace(Request $request, string $workspaceId): void
    {
        $workspace = Workspace::findOrFail($workspaceId);
        abort_unless(
            $request->user()->organizations()->where('organizations.id', $workspace->organization_id)->exists(),
            403,
        );
    }
}
