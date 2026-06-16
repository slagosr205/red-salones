<?php

namespace App\Http\Controllers;

use App\Models\Benefit;
use App\Models\Redemption;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BenefitController extends Controller
{
    public function index(): JsonResponse
    {
        $benefits = Benefit::query()
            ->where('active', true)
            ->orderBy('points_cost')
            ->get();

        return response()->json($benefits);
    }

    public function redeem(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'benefit_id' => ['required', 'integer', 'exists:benefits,id'],
            'points_cost' => ['required', 'integer', 'min:0'],
        ]);

        $benefit = Benefit::query()->findOrFail($validated['benefit_id']);

        if (! $benefit->active) {
            return response()->json(['message' => 'Este beneficio ya no está disponible.'], 422);
        }

        $user = $request->user();

        $redemption = Redemption::query()->create([
            'user_id' => $user->id,
            'benefit_id' => $benefit->id,
            'points_cost' => $validated['points_cost'],
        ]);

        $redemption->load('benefit:id,title');

        return response()->json($redemption, 201);
    }
}
