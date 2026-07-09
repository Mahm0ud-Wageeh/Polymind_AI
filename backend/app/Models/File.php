<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class File extends Model
{
    use HasFactory;
    use HasUuids;
    use SoftDeletes;

    protected $fillable = [
        'workspace_id', 'user_id', 'conversation_id', 'message_id',
        'disk', 'path', 'name', 'mime_type', 'size', 'checksum', 'meta',
    ];

    protected function casts(): array
    {
        return ['meta' => 'array', 'size' => 'integer'];
    }

    /** @return BelongsTo<User, File> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function url(): ?string
    {
        return Storage::disk($this->disk)->url($this->path);
    }
}
