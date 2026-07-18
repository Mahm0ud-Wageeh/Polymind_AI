<?php

namespace App\Http\Resources;

use App\Models\NetworkDesign;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin NetworkDesign
 */
class NetworkDesignResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'workspace_id' => $this->workspace_id,
            'project_id' => $this->project_id,
            'conversation_id' => $this->conversation_id,
            'user_id' => $this->user_id,
            'name' => $this->name,
            'prompt' => $this->prompt,
            'status' => $this->status,
            'summary' => $this->summary,
            'design_data' => $this->design_data,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
