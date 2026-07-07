<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Benefit extends Model
{
    protected $fillable = [
        'title',
        'kind',
        'points_cost',
        'description',
        'instructor',
        'date',
        'modality',
        'seats',
        'image_path',
        'active',
        'target_role',
    ];

    protected function casts(): array
    {
        return [
            'points_cost' => 'integer',
            'active' => 'boolean',
            'seats' => 'integer',
            'date' => 'date',
        ];
    }

    public function scopeForRole(Builder $query, ?string $role): Builder
    {
        if ($role === null) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($role) {
            $q->whereNull('target_role')
                ->orWhere('target_role', $role);
        });
    }

    public function redemptions(): HasMany
    {
        return $this->hasMany(Redemption::class);
    }
}
