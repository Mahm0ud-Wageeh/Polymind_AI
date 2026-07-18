<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class WorkspaceController extends Controller
{
    public function index(Request $request)
    {
        $orgIds = $request->user()->organizations()->pluck('organizations.id');

        return Workspace::whereIn('organization_id', $orgIds)->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'organization_id' => ['required', 'uuid'],
            'name' => ['required', 'string', 'max:255'],
            'icon' => ['nullable', 'string'],
        ]);

        abort_unless(
            $request->user()->organizations()->where('organizations.id', $data['organization_id'])->exists(),
            403
        );

        return Workspace::create($data + ['slug' => Str::slug($data['name']).'-'.Str::random(5)]);
    }

    public function show(Request $request, Workspace $workspace)
    {
        $this->authorizeMember($request, $workspace);

        return $workspace->load('projects');
    }

    public function update(Request $request, Workspace $workspace)
    {
        $this->authorizeMember($request, $workspace);
        $workspace->update($request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'icon' => ['sometimes', 'nullable', 'string'],
            'settings' => ['sometimes', 'array'],
        ]));

        return $workspace;
    }

    public function destroy(Request $request, Workspace $workspace)
    {
        $this->authorizeMember($request, $workspace);
        $workspace->delete();

        return response()->noContent();
    }

    protected function authorizeMember(Request $request, Workspace $workspace): void
    {
        abort_unless(
            $request->user()->organizations()->where('organizations.id', $workspace->organization_id)->exists(),
            403
        );
    }
}
