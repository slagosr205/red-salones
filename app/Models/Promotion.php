<?php

namespace App\Models;

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

    public function articles(): BelongsToMany
    {
        return $this->belongsToMany(Article::class);
    }

    public function scopeActive($query)
    {
        return $query
            ->where('active', true)
            ->whereDate('start_date', '<=', now()->format('Y-m-d'))
            ->whereDate('end_date', '>=', now()->format('Y-m-d'));
    }
}
