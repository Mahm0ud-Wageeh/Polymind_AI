<?php

namespace App\Http\Resources;

use App\Models\Conversation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Conversation
 */
class ConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'workspace_id' => $this->workspace_id,
            'project_id' => $this->project_id,
            'provider' => $this->provider,
            'model' => $this->model,
            'is_pinned' => $this->is_pinned,
            'is_archived' => $this->is_archived,
            'last_message_at' => $this->last_message_at,
            'messages' => MessageResource::collection($this->whenLoaded('messages')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
