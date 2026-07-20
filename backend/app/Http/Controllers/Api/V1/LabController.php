<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Lab;
use App\Models\Workspace;
use App\Services\Networking\LabOrchestrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LabController extends Controller
{
    public function __construct(private readonly LabOrchestrator $orchestrator) {}

    public function index(Request $request): JsonResponse
    {
        $labs = Lab::query()
            ->where('user_id', $request->user()->id)
            ->where(function ($q) use ($request) {
                if ($workspaceId = $request->query('workspace_id')) {
                    $q->where('workspace_id', $workspaceId);
                }
            })
            ->orderByDesc('updated_at')
            ->get();

        return response()->json($labs);
    }

    public function show(Lab $lab, Request $request): JsonResponse
    {
        $this->authorizeAccess($lab, $request);

        return response()->json($lab);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'workspace_id' => ['nullable', 'uuid'],
            'name' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:5000'],
            'clab_definition' => ['required_without:devices', 'nullable', 'string'],
            'devices' => ['required_without:clab_definition', 'nullable', 'array', 'max:50'],
            'devices.*.name' => ['required', 'string', 'max:100'],
            'devices.*.kind' => ['nullable', 'string', 'max:50'],
            'devices.*.image' => ['nullable', 'string', 'max:200'],
        ]);

        if (isset($data['workspace_id'])) {
            $this->authorizeWorkspace($request, $data['workspace_id']);
        }

        $lab = Lab::create([
            'user_id' => $request->user()->id,
            'workspace_id' => $data['workspace_id'] ?? null,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'status' => LabOrchestrator::STATUS_STOPPED,
            'clab_definition' => $data['clab_definition']
                ?? $this->orchestrator->constructDefinition($data['name'], $data['devices'] ?? []),
            'devices' => $data['devices'] ?? null,
            'node_status' => [],
        ]);

        return response()->json($lab, 201);
    }

    public function update(Request $request, Lab $lab): JsonResponse
    {
        $this->authorizeAccess($lab, $request);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:5000'],
            'clab_definition' => ['sometimes', 'string'],
        ]);

        $lab->update($data);

        return response()->json($lab);
    }

    public function destroy(Lab $lab, Request $request): JsonResponse
    {
        $this->authorizeAccess($lab, $request);

        $lab->delete();

        return response()->json(null, 204);
    }

    /** Deploy / start the lab */
    public function start(Lab $lab, Request $request): JsonResponse
    {
        $this->authorizeAccess($lab, $request);

        $lab = $this->orchestrator->start($lab);

        return response()->json($lab);
    }

    /** Stop the lab */
    public function stop(Lab $lab, Request $request): JsonResponse
    {
        $this->authorizeAccess($lab, $request);

        $lab = $this->orchestrator->stop($lab);

        return response()->json($lab);
    }

    /** Refresh node_status */
    public function refresh(Lab $lab, Request $request): JsonResponse
    {
        $this->authorizeAccess($lab, $request);

        $lab = $this->orchestrator->refresh($lab);

        return response()->json($lab);
    }

    // ---------------------------------------------------------------
    // Authorization helpers
    // ---------------------------------------------------------------

    private function authorizeAccess(Lab $lab, Request $request): void
    {
        abort_unless($lab->user_id === $request->user()->id, 403);
    }

    private function authorizeWorkspace(Request $request, string $workspaceId): void
    {
        $workspace = Workspace::findOrFail($workspaceId);
        abort_unless($request->user()->organizations()->whereKey($workspace->organization_id)->exists(), 403);
    }
}
