<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\NetworkDesign;
use App\Models\Workspace;
use App\Services\Networking\NetworkToolsService;
use Illuminate\Http\Request;

class NetworkToolController extends Controller
{
    public function __construct(private readonly NetworkToolsService $tools) {}

    public function planIp(Request $request)
    {
        $data = $request->validate([
            'workspace_id' => ['required', 'uuid'], 'cidr' => ['required', 'string', 'max:32'],
            'requirements' => ['nullable', 'array', 'max:100'], 'requirements.*.name' => ['required_with:requirements', 'string', 'max:100'],
            'requirements.*.hosts' => ['required_with:requirements', 'integer', 'min:1', 'max:16777214'],
        ]);
        $this->authorizeWorkspace($request, $data['workspace_id']);

        return response()->json($this->tools->planIp($data['cidr'], $data['requirements'] ?? []));
    }

    public function validateDesign(Request $request)
    {
        $data = $request->validate(['workspace_id' => ['required', 'uuid'], 'design' => ['required', 'array']]);
        $this->authorizeWorkspace($request, $data['workspace_id']);

        return response()->json($this->tools->validate($data['design']));
    }

    public function diff(Request $request)
    {
        $data = $request->validate([
            'workspace_id' => ['required', 'uuid'], 'original' => ['required', 'string', 'max:1000000'], 'updated' => ['required', 'string', 'max:1000000'],
        ]);
        $this->authorizeWorkspace($request, $data['workspace_id']);

        return response()->json($this->tools->diff($data['original'], $data['updated']));
    }

    public function documentation(Request $request)
    {
        $data = $request->validate(['workspace_id' => ['required', 'uuid'], 'network_design_id' => ['required', 'uuid']]);
        $this->authorizeWorkspace($request, $data['workspace_id']);
        $design = NetworkDesign::query()->whereKey($data['network_design_id'])->where('user_id', $request->user()->id)->where('workspace_id', $data['workspace_id'])->firstOrFail();

        return response()->json($this->tools->documentation($design->toArray()));
    }

    private function authorizeWorkspace(Request $request, string $workspaceId): void
    {
        $workspace = Workspace::findOrFail($workspaceId);
        abort_unless($request->user()->organizations()->whereKey($workspace->organization_id)->exists(), 403);
    }
}
