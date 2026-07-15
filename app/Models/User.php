<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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

    const CLIENT_TYPE_SALON = 'salon';

    const CLIENT_TYPE_CONSUMIDOR_FINAL = 'consumidor_final';

    const CLIENT_TYPES = [self::CLIENT_TYPE_SALON, self::CLIENT_TYPE_CONSUMIDOR_FINAL];

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'leader_id',
        'status',
        'client_type',
        'points_balance',
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
            'client_type' => 'string',
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

    public function zones(): BelongsToMany
    {
        return $this->belongsToMany(Zone::class, 'leader_zone', 'leader_id', 'zone_id');
    }

    public function redemptions(): HasMany
    {
        return $this->hasMany(Redemption::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
