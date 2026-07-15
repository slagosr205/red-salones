<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index(): JsonResponse
    {
        $settings = [
            'membership_price' => Setting::get('membership_price', 0),
            'welcome_kit_articles' => Setting::get('welcome_kit_articles', []),
            'membership_discount_price' => Setting::get('membership_discount_price', null),
            'membership_discount_from' => Setting::get('membership_discount_from', null),
            'membership_discount_until' => Setting::get('membership_discount_until', null),
        ];

        return response()->json($settings);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'membership_price' => 'required|numeric|min:0',
            'welcome_kit_articles' => 'nullable|array',
            'welcome_kit_articles.*' => 'string',
            'membership_discount_price' => 'nullable|numeric|min:0',
            'membership_discount_from' => 'nullable|date',
            'membership_discount_until' => 'nullable|date|after_or_equal:membership_discount_from',
        ]);

        Setting::set('membership_price', $validated['membership_price']);
        Setting::set('welcome_kit_articles', $validated['welcome_kit_articles']);
        Setting::set('membership_discount_price', $validated['membership_discount_price'] ?? null);
        Setting::set('membership_discount_from', $validated['membership_discount_from'] ?? null);
        Setting::set('membership_discount_until', $validated['membership_discount_until'] ?? null);

        return response()->json(['ok' => true, 'message' => 'Configuracion actualizada.']);
    }
}
