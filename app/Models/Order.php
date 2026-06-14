<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'salon_id',
        'order_number',
        'status',
        'subtotal',
        'total_discount',
        'isv',
        'grand_total',
        'points_earned',
        'payment_method',
        'stripe_payment_intent_id',
        'customer_name',
        'customer_email',
        'notes',
    ];

    const STATUS_PACKAGING = 'packaging';

    const STATUS_IN_TRANSIT = 'in_transit';

    const STATUS_DELIVERED = 'delivered';

    const STATUS_CANCELLED = 'cancelled';

    const STATUSES = [
        self::STATUS_PACKAGING,
        self::STATUS_IN_TRANSIT,
        self::STATUS_DELIVERED,
        self::STATUS_CANCELLED,
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function salon(): BelongsTo
    {
        return $this->belongsTo(User::class, 'salon_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
