<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Template;
use App\Models\Workspace;
use Illuminate\Http\Request;

class TemplateController extends Controller
{
    public function index(Request $request)
    {
        return Template::query()
            ->where('is_public', true)
            ->when($request->query('workspace_id'), fn ($q, $id) => $q->orWhere('workspace_id', $id))
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
            'prompt' => ['required', 'string'],
            'category' => ['nullable', 'string'],
            'is_public' => ['nullable', 'boolean'],
            'domain' => ['nullable', 'string', 'max:64'],
        ]);

        $this->authorizeWorkspace($request, $data['workspace_id'] ?? null);

        return Template::create($data + ['domain' => $data['domain'] ?? 'networking']);
    }

    public function show(Request $request, Template $template)
    {
        $this->authorizeAccess($request, $template);

        return $template;
    }

    public function update(Request $request, Template $template)
    {
        $this->authorizeWorkspace($request, $template->workspace_id);
        $template->update($request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'icon' => ['sometimes', 'nullable', 'string'],
            'description' => ['sometimes', 'nullable', 'string'],
            'prompt' => ['sometimes', 'string'],
            'category' => ['sometimes', 'nullable', 'string'],
            'is_public' => ['sometimes', 'boolean'],
            'domain' => ['sometimes', 'nullable', 'string', 'max:64'],
        ]));

        return $template;
    }

    public function destroy(Request $request, Template $template)
    {
        $this->authorizeWorkspace($request, $template->workspace_id);
        $template->delete();

        return response()->noContent();
    }

    private function authorizeAccess(Request $request, Template $template): void
    {
        if ($template->is_public) {
            return;
        }

        $this->authorizeWorkspace($request, $template->workspace_id);
    }

    private function authorizeWorkspace(Request $request, ?string $workspaceId): void
    {
        abort_if(! $workspaceId, 403);
        $workspace = Workspace::findOrFail($workspaceId);
        abort_unless(
            $request->user()->organizations()->where('organizations.id', $workspace->organization_id)->exists(),
            403,
        );
    }
}
