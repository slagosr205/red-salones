<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    const ROLE_ADMIN = 'admin';

    const ROLE_LIDER = 'lider';

    const ROLE_SALON = 'salon';

    const ROLES = [self::ROLE_ADMIN, self::ROLE_LIDER, self::ROLE_SALON];

    const STATUS_PENDING = 'pending';

    const STATUS_ACTIVE = 'active';

    const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'leader_id',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'status' => 'string',
        ];
    }

    public function leader(): BelongsTo
    {
        return $this->belongsTo(self::class, 'leader_id');
    }

    public function salons(): HasMany
    {
        return $this->hasMany(self::class, 'leader_id');
    }
}
