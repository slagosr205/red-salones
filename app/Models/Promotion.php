<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Promotion extends Model
{
    protected $fillable = [
        'name',
        'type',
        'value',
        'start_date',
        'end_date',
        'active',
        'target_role',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'start_date' => 'date',
            'end_date' => 'date',
            'active' => 'boolean',
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

    public function scopeActive($query): Builder
    {
        return $query
            ->where('active', true)
            ->whereDate('start_date', '<=', now()->format('Y-m-d'))
            ->whereDate('end_date', '>=', now()->format('Y-m-d'));
    }

    public function articles(): BelongsToMany
    {
        return $this->belongsToMany(Article::class);
    }
}
