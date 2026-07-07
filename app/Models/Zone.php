<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Zone extends Model
{
    protected $fillable = [
        'name',
        'description',
        'created_by',
    ];

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function leaders(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'leader_zone', 'zone_id', 'leader_id');
    }
}
