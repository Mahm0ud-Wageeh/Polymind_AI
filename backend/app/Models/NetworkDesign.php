<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class NetworkDesign extends Model
{
    use HasFactory;
    use HasUuids;
    use SoftDeletes;

    protected $fillable = [
        'workspace_id', 'project_id', 'conversation_id', 'user_id',
        'name', 'prompt', 'status', 'summary', 'design_data',
    ];

    protected function casts(): array
    {
        return [
            'design_data' => 'array',
        ];
    }

    /** @return BelongsTo<Workspace, NetworkDesign> */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /** @return BelongsTo<Project, NetworkDesign> */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /** @return BelongsTo<User, NetworkDesign> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
