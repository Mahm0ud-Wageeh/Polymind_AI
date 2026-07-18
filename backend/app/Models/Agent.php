<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Agent extends Model
{
    use HasFactory;
    use HasUuids;
    use SoftDeletes;

    protected $fillable = [
        'workspace_id', 'user_id', 'name', 'icon', 'description', 'system_prompt',
        'provider', 'model', 'temperature', 'tools', 'memory', 'is_public', 'domain',
    ];

    protected function casts(): array
    {
        return [
            'tools' => 'array',
            'memory' => 'array',
            'is_public' => 'boolean',
            'temperature' => 'float',
        ];
    }

    /** @return BelongsTo<Workspace, Agent> */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /** @return BelongsTo<User, Agent> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
