<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use Illuminate\Http\Request;

class AgentController extends Controller
{
    public function index(Request $request)
    {
        return Agent::query()
            ->where(fn ($q) => $q->where('user_id', $request->user()->id)->orWhere('is_public', true))
            ->when($request->query('workspace_id'), fn ($q, $id) => $q->where('workspace_id', $id))
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
        ]);

        return Agent::create($data + ['user_id' => $request->user()->id]);
    }

    public function show(Agent $agent)
    {
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
        ]));

        return $agent;
    }

    public function destroy(Request $request, Agent $agent)
    {
        abort_unless($agent->user_id === $request->user()->id, 403);
        $agent->delete();

        return response()->noContent();
    }
}
