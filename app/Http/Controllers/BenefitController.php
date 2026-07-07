<?php

namespace App\Http\Controllers;

use App\Models\Benefit;
use App\Models\Redemption;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\JpegEncoder;
use Intervention\Image\ImageManager;

class BenefitController extends Controller
{
    private function resizeAndSave(UploadedFile $file): string
    {
        $manager = new ImageManager(new Driver);
        $image = $manager->read($file);
        $image->resize(width: 1200, height: 675);

        $maxBytes = 2 * 1024 * 1024;
        $quality = 90;
        $encoded = (string) $image->encode(new JpegEncoder($quality));

        while (strlen($encoded) > $maxBytes && $quality > 20) {
            $quality -= 10;
            $encoded = (string) $image->encode(new JpegEncoder($quality));
        }

        $filename = 'benefits/'.uniqid().'.jpg';
        Storage::disk('public')->put($filename, $encoded);

        return $filename;
    }

    public function index(): JsonResponse
    {
        $user = request()->user();

        $benefits = Benefit::query()
            ->where('active', true)
            ->when($user, fn ($q) => $q->forRole($user->role))
            ->orderBy('points_cost')
            ->get()
            ->map(fn ($b) => [
                'id' => $b->id,
                'title' => $b->title,
                'kind' => $b->kind,
                'points_cost' => $b->points_cost,
                'description' => $b->description,
                'instructor' => $b->instructor,
                'date' => $b->date?->format('Y-m-d'),
                'modality' => $b->modality,
                'seats' => $b->seats,
                'image_path' => $b->image_path ? '/storage/'.$b->image_path : null,
                'active' => $b->active,
                'target_role' => $b->target_role,
            ]);

        return response()->json($benefits);
    }

    public function adminIndex(): JsonResponse
    {
        $benefits = Benefit::query()->orderByDesc('created_at')->get();

        $mapped = $benefits->map(fn ($b) => [
            'id' => (string) $b->id,
            'title' => $b->title,
            'kind' => $b->kind,
            'pointsCost' => $b->points_cost,
            'description' => $b->description,
            'instructor' => $b->instructor,
            'date' => $b->date?->format('Y-m-d'),
            'modality' => $b->modality,
            'seats' => $b->seats,
            'imagePath' => $b->image_path ? '/storage/'.$b->image_path : null,
            'active' => $b->active,
            'targetRole' => $b->target_role,
            'createdAt' => $b->created_at,
        ]);

        return response()->json($mapped);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'kind' => ['required', 'string', 'max:100'],
            'points_cost' => ['required', 'integer', 'min:1'],
            'description' => ['nullable', 'string'],
            'instructor' => ['nullable', 'string', 'max:255'],
            'date' => ['nullable', 'date'],
            'modality' => ['nullable', 'string', 'max:50'],
            'seats' => ['nullable', 'integer', 'min:1'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
            'active' => ['boolean'],
            'target_role' => ['nullable', 'string', 'in:lider,salon,consumidor_final'],
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $this->resizeAndSave($request->file('image'));
        }

        $benefit = Benefit::create([
            'title' => $validated['title'],
            'kind' => $validated['kind'],
            'points_cost' => $validated['points_cost'],
            'description' => $validated['description'] ?? null,
            'instructor' => $validated['instructor'] ?? null,
            'date' => $validated['date'] ?? null,
            'modality' => $validated['modality'] ?? null,
            'seats' => $validated['seats'] ?? null,
            'image_path' => $imagePath,
            'active' => $validated['active'] ?? true,
            'target_role' => $validated['target_role'] ?? null,
        ]);

        return response()->json($benefit, 201);
    }

    public function update(Request $request, Benefit $benefit): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'kind' => ['required', 'string', 'max:100'],
            'points_cost' => ['required', 'integer', 'min:1'],
            'description' => ['nullable', 'string'],
            'instructor' => ['nullable', 'string', 'max:255'],
            'date' => ['nullable', 'date'],
            'modality' => ['nullable', 'string', 'max:50'],
            'seats' => ['nullable', 'integer', 'min:1'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
            'active' => ['boolean'],
            'target_role' => ['nullable', 'string', 'in:lider,salon,consumidor_final'],
        ]);

        $imagePath = $benefit->image_path;
        if ($request->hasFile('image')) {
            if ($benefit->image_path) {
                Storage::disk('public')->delete($benefit->image_path);
            }
            $imagePath = $this->resizeAndSave($request->file('image'));
        }

        $benefit->update([
            'title' => $validated['title'],
            'kind' => $validated['kind'],
            'points_cost' => $validated['points_cost'],
            'description' => $validated['description'] ?? null,
            'instructor' => $validated['instructor'] ?? null,
            'date' => $validated['date'] ?? null,
            'modality' => $validated['modality'] ?? null,
            'seats' => $validated['seats'] ?? null,
            'image_path' => $imagePath,
            'active' => $validated['active'] ?? true,
            'target_role' => $validated['target_role'] ?? null,
        ]);

        return response()->json($benefit);
    }

    public function destroy(Benefit $benefit): JsonResponse
    {
        if ($benefit->image_path) {
            Storage::disk('public')->delete($benefit->image_path);
        }
        $benefit->delete();

        return response()->json(['message' => 'Beneficio eliminado.']);
    }

    public function toggle(Benefit $benefit): JsonResponse
    {
        $benefit->update(['active' => ! $benefit->active]);

        return response()->json($benefit);
    }

    public function redeem(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'benefit_id' => ['required', 'integer', 'exists:benefits,id'],
            'points_cost' => ['required', 'integer', 'min:1'],
        ]);

        $benefit = Benefit::query()->findOrFail($validated['benefit_id']);

        if (! $benefit->active) {
            return response()->json(['message' => 'Este beneficio ya no esta disponible.'], 422);
        }

        $user = $request->user();

        if ($user->points_balance < $validated['points_cost']) {
            return response()->json(['message' => 'Puntos insuficientes para este canje.'], 422);
        }

        $user->decrement('points_balance', $validated['points_cost']);

        $redemption = Redemption::query()->create([
            'user_id' => $user->id,
            'benefit_id' => $benefit->id,
            'points_cost' => $validated['points_cost'],
        ]);

        $redemption->load('benefit:id,title');

        return response()->json([
            ...$redemption->toArray(),
            'new_balance' => $user->fresh()->points_balance,
        ], 201);
    }
}
