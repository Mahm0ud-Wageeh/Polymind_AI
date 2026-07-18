<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Template extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'workspace_id', 'name', 'icon', 'description', 'prompt', 'category', 'is_public', 'domain',
    ];

    protected function casts(): array
    {
        return ['is_public' => 'boolean'];
    }
}
