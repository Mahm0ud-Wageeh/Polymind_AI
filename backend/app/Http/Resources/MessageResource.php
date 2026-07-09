<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Message
 */
class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'role' => $this->role,
            'content' => $this->content,
            'thinking_content' => $this->thinking_content,
            'provider' => $this->provider,
            'model' => $this->model,
            'tokens_input' => $this->tokens_input,
            'tokens_output' => $this->tokens_output,
            'cost' => $this->cost,
            'status' => $this->status,
            'created_at' => $this->created_at,
        ];
    }
}
