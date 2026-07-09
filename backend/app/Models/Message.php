<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'conversation_id', 'role', 'content', 'thinking_content', 'provider', 'model',
        'tokens_input', 'tokens_output', 'cost', 'status', 'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'tokens_input' => 'integer',
            'tokens_output' => 'integer',
            'cost' => 'decimal:6',
        ];
    }

    /** @return BelongsTo<Conversation, Message> */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }
}
