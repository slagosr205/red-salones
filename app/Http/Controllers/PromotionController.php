<?php

namespace App\Http\Controllers;

use App\Models\Promotion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PromotionController extends Controller
{
    public function index(): JsonResponse
    {
        $promotions = Promotion::with('articles:id')->orderByDesc('created_at')->get();

        return response()->json($promotions);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:2x1,descuento,combo'],
            'value' => ['required', 'numeric', 'min:0', 'max:100'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'active' => ['boolean'],
            'article_ids' => ['nullable', 'array'],
            'article_ids.*' => ['integer', 'exists:articles,id'],
        ]);

        $promotion = Promotion::create([
            'name' => $validated['name'],
            'type' => $validated['type'],
            'value' => $validated['value'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'active' => $validated['active'] ?? true,
        ]);

        if (! empty($validated['article_ids'])) {
            $promotion->articles()->attach($validated['article_ids']);
        }

        $promotion->load('articles:id');

        return response()->json($promotion, 201);
    }

    public function update(Request $request, Promotion $promotion): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:2x1,descuento,combo'],
            'value' => ['required', 'numeric', 'min:0', 'max:100'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'active' => ['boolean'],
            'article_ids' => ['nullable', 'array'],
            'article_ids.*' => ['integer', 'exists:articles,id'],
        ]);

        $promotion->update([
            'name' => $validated['name'],
            'type' => $validated['type'],
            'value' => $validated['value'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'active' => $validated['active'] ?? true,
        ]);

        $promotion->articles()->sync($validated['article_ids'] ?? []);

        $promotion->load('articles:id');

        return response()->json($promotion);
    }

    public function destroy(Promotion $promotion): JsonResponse
    {
        $promotion->delete();

        return response()->json(['message' => 'Promoción eliminada.']);
    }

    public function toggle(Promotion $promotion): JsonResponse
    {
        $promotion->update(['active' => ! $promotion->active]);

        return response()->json($promotion);
    }

    public function activePromotions(): JsonResponse
    {
        $promotions = Promotion::active()->with('articles:id')->get();

        $mapped = $promotions->map(fn ($p) => [
            'id' => (string) $p->id,
            'name' => $p->name,
            'type' => $p->type,
            'value' => (float) $p->value,
            'startDate' => $p->start_date->format('Y-m-d'),
            'endDate' => $p->end_date->format('Y-m-d'),
            'active' => $p->active,
            'productIds' => $p->articles->pluck('id')->map(fn ($id) => 'art-'.$id)->toArray(),
        ]);

        return response()->json($mapped);
    }

    public function activeWithProducts(): JsonResponse
    {
        $promotions = Promotion::active()
            ->with('articles:id,name,price,image_path,brand')
            ->get();

        $mapped = $promotions->map(fn ($p) => [
            'id' => (string) $p->id,
            'name' => $p->name,
            'type' => $p->type,
            'value' => (float) $p->value,
            'startDate' => $p->start_date->format('Y-m-d'),
            'endDate' => $p->end_date->format('Y-m-d'),
            'active' => $p->active,
            'products' => $p->articles->map(fn ($a) => [
                'id' => 'art-'.$a->id,
                'name' => $a->name,
                'brand' => $a->brand,
                'price' => (float) ($a->price ?? 0),
                'image' => $a->image_path ? '/storage/'.$a->image_path : null,
            ]),
        ]);

        return response()->json($mapped);
    }
}
