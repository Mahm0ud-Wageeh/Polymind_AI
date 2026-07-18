<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function index(Request $request, Conversation $conversation)
    {
        $this->authorizeOwner($request, $conversation);

        return MessageResource::collection(
            $conversation->messages()->paginate((int) $request->query('per_page', 50))
        );
    }

    public function store(Request $request, Conversation $conversation)
    {
        $this->authorizeOwner($request, $conversation);

        $data = $request->validate([
            'role' => ['required', 'in:user,assistant,system'],
            'content' => ['required', 'string'],
        ]);

        $message = $conversation->messages()->create($data);
        $conversation->forceFill(['last_message_at' => now()])->save();

        return new MessageResource($message);
    }

    public function destroy(Request $request, Conversation $conversation, Message $message)
    {
        $this->authorizeOwner($request, $conversation);
        abort_unless($message->conversation_id === $conversation->id, 404);
        $message->delete();

        return response()->noContent();
    }

    public function update(Request $request, Conversation $conversation, Message $message)
    {
        $this->authorizeOwner($request, $conversation);
        abort_unless($message->conversation_id === $conversation->id, 404);
        abort_unless($message->role === 'user', 403, 'Only your own messages can be edited.');

        $message->update($request->validate([
            'content' => ['required', 'string'],
        ]));

        return new MessageResource($message);
    }

    protected function authorizeOwner(Request $request, Conversation $conversation): void
    {
        abort_unless($conversation->user_id === $request->user()->id, 403);
    }
}
