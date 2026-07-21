<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Lab extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'user_id',
        'workspace_id',
        'name',
        'description',
        'status',
        'clab_definition',
        'devices',
        'node_status',
        'lab_directory',
        'started_at',
        'stopped_at',
    ];

    protected function casts(): array
    {
        return [
            'clab_definition' => 'string',
            'devices' => 'array',
            'node_status' => 'array',
            'started_at' => 'datetime',
            'stopped_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, Lab> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Workspace, Lab> */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function getLabDirectoryAttribute(): string
    {
        return storage_path('app/labs/'.$this->id);
    }
}
