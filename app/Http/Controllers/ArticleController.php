<?php

namespace App\Http\Controllers;

use App\Models\Article;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\JpegEncoder;
use Intervention\Image\ImageManager;

class ArticleController extends Controller
{
    private function resizeAndSave(UploadedFile $file): string
    {
        $manager = new ImageManager(new Driver);
        $image = $manager->read($file);
        $image->resize(width: 800, height: 600);

        $maxBytes = 2 * 1024 * 1024;
        $quality = 90;
        $encoded = (string) $image->encode(new JpegEncoder($quality));

        while (strlen($encoded) > $maxBytes && $quality > 20) {
            $quality -= 10;
            $encoded = (string) $image->encode(new JpegEncoder($quality));
        }

        $filename = 'articles/'.uniqid().'.jpg';
        Storage::disk('public')->put($filename, $encoded);

        return $filename;
    }

    public function index(): Response
    {
        $articles = Article::query()
            ->with('creator:id,name')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Rc/Articles', [
            'articles' => $articles,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Rc/ArticlesCreate', [
            'categories' => array_values(Article::CATEGORIES),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'brand' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'leader_price' => ['nullable', 'numeric', 'min:0'],
            'public_price' => ['nullable', 'numeric', 'min:0'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'points' => ['nullable', 'integer', 'min:0'],
            'summary' => ['nullable', 'string', 'max:1000'],
            'is_featured' => ['boolean'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $this->resizeAndSave($request->file('image'));
        }

        Article::query()->create([
            'name' => $validated['name'],
            'brand' => $validated['brand'] ?? null,
            'category' => $validated['category'] ?: null,
            'price' => $validated['price'] ?? null,
            'leader_price' => $validated['leader_price'] ?? null,
            'public_price' => $validated['public_price'] ?? null,
            'stock' => $validated['stock'] ?? 0,
            'points' => $validated['points'] ?? 0,
            'summary' => $validated['summary'] ?? null,
            'image_path' => $imagePath,
            'is_featured' => $validated['is_featured'] ?? false,
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('rc.articles')->with('success', 'Artículo creado correctamente.');
    }

    public function edit(int $id): Response
    {
        $article = Article::query()->findOrFail($id);

        return Inertia::render('Rc/ArticlesEdit', [
            'article' => $article,
            'categories' => Article::CATEGORIES,
        ]);
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $article = Article::query()->findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'brand' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'leader_price' => ['nullable', 'numeric', 'min:0'],
            'public_price' => ['nullable', 'numeric', 'min:0'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'points' => ['nullable', 'integer', 'min:0'],
            'summary' => ['nullable', 'string', 'max:1000'],
            'is_featured' => ['boolean'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
        ]);

        $data = [
            'name' => $validated['name'],
            'brand' => $validated['brand'] ?? null,
            'category' => $validated['category'] ?: null,
            'price' => $validated['price'] ?? null,
            'leader_price' => $validated['leader_price'] ?? null,
            'public_price' => $validated['public_price'] ?? null,
            'stock' => $validated['stock'] ?? 0,
            'points' => $validated['points'] ?? 0,
            'summary' => $validated['summary'] ?? null,
            'is_featured' => $validated['is_featured'] ?? false,
        ];

        if ($request->hasFile('image')) {
            if ($article->image_path) {
                Storage::disk('public')->delete($article->image_path);
            }
            $data['image_path'] = $this->resizeAndSave($request->file('image'));
        }

        $article->update($data);

        return redirect()->route('rc.articles')->with('success', 'Artículo actualizado correctamente.');
    }

    public function destroy(int $id): RedirectResponse
    {
        $article = Article::query()->findOrFail($id);

        if ($article->image_path) {
            Storage::disk('public')->delete($article->image_path);
        }

        $article->delete();

        return redirect()->route('rc.articles')->with('success', 'Artículo eliminado.');
    }

    public function toggleFeatured(int $id): RedirectResponse
    {
        $article = Article::query()->findOrFail($id);
        $article->update(['is_featured' => ! $article->is_featured]);

        $status = $article->is_featured ? 'agregado a destacados' : 'quitado de destacados';

        return redirect()->route('rc.articles')->with('success', "Artículo {$status}.");
    }

    public function updateImage(Request $request, int $id): RedirectResponse
    {
        $article = Article::query()->findOrFail($id);

        $validated = $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
        ]);

        if ($article->image_path) {
            Storage::disk('public')->delete($article->image_path);
        }

        $article->update([
            'image_path' => $this->resizeAndSave($request->file('image')),
        ]);

        return redirect()->route('rc.articles')->with('success', 'Imagen del artículo actualizada.');
    }

    public function featured(): JsonResponse
    {
        $articles = Article::featured()->latest()->get();

        return response()->json($articles);
    }

    public function catalog(): JsonResponse
    {
        $articles = Article::query()
            ->where('stock', '>', 0)
            ->orWhereNull('stock')
            ->orderByDesc('created_at')
            ->get();

        $products = $articles->map(fn (Article $a) => [
            'id' => 'art-'.$a->id,
            'name' => $a->name,
            'brand' => $a->brand ?? '',
            'category' => $a->category ?? '',
            'price' => (float) ($a->price ?? 0),
            'leader_price' => $a->leader_price !== null ? (float) $a->leader_price : null,
            'public_price' => $a->public_price !== null ? (float) $a->public_price : null,
            'points' => $a->points ?? 0,
            'stock' => $a->stock ?? 0,
            'image' => $a->image_path ? '/storage/'.$a->image_path : null,
        ]);

        return response()->json($products);
    }
}
