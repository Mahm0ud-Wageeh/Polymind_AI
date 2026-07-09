<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConversationResource;
use App\Models\Conversation;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function index(Request $request)
    {
        $conversations = $request->user()->conversations()
            ->when($request->query('workspace_id'), fn ($q, $id) => $q->where('workspace_id', $id))
            ->when($request->query('pinned'), fn ($q) => $q->where('is_pinned', true))
            ->when($request->query('search'), fn ($q, $term) => $q->where('title', 'ilike', "%{$term}%"))
            ->orderByDesc('is_pinned')
            ->orderByDesc('last_message_at')
            ->paginate((int) $request->query('per_page', 30));

        return ConversationResource::collection($conversations);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'workspace_id' => ['required', 'uuid'],
            'project_id' => ['nullable', 'uuid'],
            'title' => ['nullable', 'string', 'max:255'],
            'provider' => ['nullable', 'string'],
            'model' => ['nullable', 'string'],
        ]);

        $conversation = $request->user()->conversations()->create($data + [
            'title' => $data['title'] ?? 'New chat',
        ]);

        return new ConversationResource($conversation);
    }

    public function show(Request $request, Conversation $conversation)
    {
        $this->authorizeOwner($request, $conversation);

        return new ConversationResource($conversation->load('messages', 'artifacts'));
    }

    public function update(Request $request, Conversation $conversation)
    {
        $this->authorizeOwner($request, $conversation);

        $conversation->update($request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'is_pinned' => ['sometimes', 'boolean'],
            'is_archived' => ['sometimes', 'boolean'],
            'project_id' => ['sometimes', 'nullable', 'uuid'],
        ]));

        return new ConversationResource($conversation);
    }

    public function destroy(Request $request, Conversation $conversation)
    {
        $this->authorizeOwner($request, $conversation);
        $conversation->delete();

        return response()->noContent();
    }

    protected function authorizeOwner(Request $request, Conversation $conversation): void
    {
        abort_unless($conversation->user_id === $request->user()->id, 403);
    }
}
