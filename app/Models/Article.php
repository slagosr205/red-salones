<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Article extends Model
{
    public const CATEGORIES = [
        'Shampoo',
        'Acondicionador',
        'Aceites',
        'Folletos',
        'Tarjetas',
        'Banners',
        'Uniformes',
        'Merchandising',
        'Muestras',
        'Regalos',
        'Papelería',
        'Digital',
        'Otros',
    ];

    protected $fillable = [
        'name',
        'brand',
        'category',
        'price',
        'leader_price',
        'stock',
        'points',
        'summary',
        'image_path',
        'is_featured',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'leader_price' => 'decimal:2',
            'stock' => 'integer',
            'points' => 'integer',
            'is_featured' => 'boolean',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function promotions(): BelongsToMany
    {
        return $this->belongsToMany(Promotion::class);
    }
}
