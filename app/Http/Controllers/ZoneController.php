<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Zone;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ZoneController extends Controller
{
    public function index(): Response
    {
        abort_unless(request()->user()->role === User::ROLE_ADMIN, 403);

        $zones = Zone::query()
            ->with('leaders:id,name,email')
            ->withCount('leaders')
            ->orderBy('name')
            ->get();

        $leaders = User::query()
            ->where('role', User::ROLE_LIDER)
            ->where('status', User::STATUS_ACTIVE)
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return Inertia::render('Rc/Zones', [
            'zones' => $zones,
            'leaders' => $leaders,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->role === User::ROLE_ADMIN, 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        Zone::query()->create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'created_by' => $request->user()->id,
        ]);

        return redirect()->back()->with('success', 'Zona creada exitosamente.');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        abort_unless($request->user()->role === User::ROLE_ADMIN, 403);

        $zone = Zone::query()->findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $zone->update($validated);

        return redirect()->back()->with('success', 'Zona actualizada exitosamente.');
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        abort_unless($request->user()->role === User::ROLE_ADMIN, 403);

        $zone = Zone::query()->findOrFail($id);
        $zone->delete();

        return redirect()->back()->with('success', 'Zona eliminada exitosamente.');
    }

    public function assignLeaders(Request $request, int $id): RedirectResponse
    {
        abort_unless($request->user()->role === User::ROLE_ADMIN, 403);

        $zone = Zone::query()->findOrFail($id);

        $validated = $request->validate([
            'leader_ids' => ['array'],
            'leader_ids.*' => ['exists:users,id'],
        ]);

        $zone->leaders()->sync($validated['leader_ids'] ?? []);

        return redirect()->back()->with('success', 'Lideres asignados a la zona exitosamente.');
    }
}
