<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProviderCredential extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = ['organization_id', 'provider', 'api_key', 'base_url', 'is_active'];

    protected $hidden = ['api_key'];

    protected function casts(): array
    {
        return [
            // Transparently encrypt provider API keys at rest.
            'api_key' => 'encrypted',
            'is_active' => 'boolean',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
