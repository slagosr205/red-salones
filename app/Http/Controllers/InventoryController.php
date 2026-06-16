<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\InventoryMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function index(): JsonResponse
    {
        $articles = Article::query()->orderBy('name')->get();

        $items = $articles->map(fn (Article $a) => [
            'id' => 'art-'.$a->id,
            'name' => $a->name,
            'brand' => $a->brand ?? '',
            'category' => $a->category ?? '',
            'price' => (float) ($a->price ?? 0),
            'stock' => $a->stock ?? 0,
            'minStock' => $a->min_stock ?? 0,
        ]);

        return response()->json($items);
    }

    public function setMinStock(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'string', 'max:50'],
            'min_stock' => ['required', 'integer', 'min:0'],
        ]);

        $id = (int) str_replace('art-', '', $validated['product_id']);
        $article = Article::query()->findOrFail($id);
        $article->update(['min_stock' => $validated['min_stock']]);

        return response()->json([
            'success' => true,
            'min_stock' => $article->fresh()->min_stock,
        ]);
    }

    public function entry(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'string', 'max:50'],
            'qty' => ['required', 'integer', 'min:1'],
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        $id = (int) str_replace('art-', '', $validated['product_id']);
        $article = Article::query()->findOrFail($id);

        $stockBefore = $article->stock ?? 0;
        $article->increment('stock', $validated['qty']);
        $stockAfter = $article->fresh()->stock;

        InventoryMovement::query()->create([
            'article_id' => $article->id,
            'type' => 'entry',
            'quantity' => $validated['qty'],
            'stock_before' => $stockBefore,
            'stock_after' => $stockAfter,
            'note' => $validated['note'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'stock' => $stockAfter,
        ]);
    }

    public function movements(): JsonResponse
    {
        $movements = InventoryMovement::query()
            ->with('article:id,name')
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn (InventoryMovement $m) => [
                'id' => (string) $m->id,
                'productId' => 'art-'.$m->article_id,
                'productName' => $m->article->name,
                'type' => $m->type,
                'qty' => $m->type === 'sale' ? -$m->quantity : $m->quantity,
                'stockBefore' => $m->stock_before,
                'stockAfter' => $m->stock_after,
                'date' => $m->created_at->toIso8601String(),
                'note' => $m->note,
            ]);

        return response()->json($movements);
    }
}
