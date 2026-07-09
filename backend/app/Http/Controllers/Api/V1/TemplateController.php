<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Template;
use Illuminate\Http\Request;

class TemplateController extends Controller
{
    public function index(Request $request)
    {
        return Template::query()
            ->where('is_public', true)
            ->when($request->query('workspace_id'), fn ($q, $id) => $q->orWhere('workspace_id', $id))
            ->orderBy('name')
            ->get();
    }

    public function store(Request $request)
    {
        return Template::create($request->validate([
            'workspace_id' => ['nullable', 'uuid'],
            'name' => ['required', 'string', 'max:255'],
            'icon' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'prompt' => ['required', 'string'],
            'category' => ['nullable', 'string'],
            'is_public' => ['nullable', 'boolean'],
        ]));
    }

    public function show(Template $template)
    {
        return $template;
    }

    public function update(Request $request, Template $template)
    {
        $template->update($request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'icon' => ['sometimes', 'nullable', 'string'],
            'description' => ['sometimes', 'nullable', 'string'],
            'prompt' => ['sometimes', 'string'],
            'category' => ['sometimes', 'nullable', 'string'],
            'is_public' => ['sometimes', 'boolean'],
        ]));

        return $template;
    }

    public function destroy(Template $template)
    {
        $template->delete();

        return response()->noContent();
    }
}
