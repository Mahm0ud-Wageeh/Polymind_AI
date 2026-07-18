<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ApiKey extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'user_id', 'organization_id', 'name', 'prefix', 'key_hash', 'scopes',
        'last_used_at', 'expires_at',
    ];

    protected $hidden = ['key_hash'];

    protected function casts(): array
    {
        return ['scopes' => 'array', 'last_used_at' => 'datetime', 'expires_at' => 'datetime'];
    }

    /**
     * Generate a new plaintext key. Only the hash is persisted; the plaintext
     * is returned once for the caller to show the user.
     *
     * @return array{model: self, plain: string}
     */
    public static function generate(User $user, string $name, array $scopes = []): array
    {
        $plain = 'pm_'.Str::random(48);
        $model = static::create([
            'user_id' => $user->id,
            'organization_id' => $user->current_workspace_id ? null : null,
            'name' => $name,
            'prefix' => substr($plain, 0, 11),
            'key_hash' => Hash::make($plain),
            'scopes' => $scopes,
        ]);

        return ['model' => $model, 'plain' => $plain];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
