<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'order_id',
        'product_name',
        'product_id',
        'quantity',
        'unit_price',
        'discount',
        'promo_type',
        'subtotal',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
