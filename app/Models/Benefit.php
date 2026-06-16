<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Benefit extends Model
{
    protected $fillable = [
        'title',
        'kind',
        'points_cost',
        'description',
        'image_path',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'points_cost' => 'integer',
            'active' => 'boolean',
        ];
    }

    public function redemptions(): HasMany
    {
        return $this->hasMany(Redemption::class);
    }
}
