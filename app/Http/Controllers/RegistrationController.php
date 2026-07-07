<?php

namespace App\Http\Controllers;

use App\Mail\PendingApproval;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class RegistrationController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Public/RegisterRequest');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
        ]);

        $plainPassword = Str::random(10);

        $user = User::query()->create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($plainPassword),
            'role' => User::ROLE_SALON,
            'status' => 'pending',
        ]);

        Mail::to($user->email)->send(new PendingApproval($user, $plainPassword));

        return response()->json([
            'success' => true,
            'message' => 'Registro exitoso. Revisa tu correo para las credenciales.',
        ]);
    }

    public function pending(): Response
    {
        $this->authorizeApprover();

        $pending = User::query()
            ->where('status', 'pending')
            ->where('role', User::ROLE_SALON)
            ->with('leader:id,name')
            ->get(['id', 'name', 'email', 'leader_id', 'created_at']);

        return Inertia::render('Rc/PendingApprovals', [
            'pending' => $pending,
        ]);
    }

    public function approve(Request $request, int $id): RedirectResponse
    {
        $this->authorizeApprover();

        $user = User::query()->findOrFail($id);

        // `client_type` only applies to salon customers; leaders can be activated without it.
        if ($user->role === User::ROLE_SALON) {
            $validated = $request->validate([
                'client_type' => ['required', 'string', 'in:'.implode(',', User::CLIENT_TYPES)],
            ]);

            $user->update([
                'status' => User::STATUS_ACTIVE,
                'client_type' => $validated['client_type'],
            ]);
        } elseif ($user->role === User::ROLE_LIDER) {
            $user->update([
                'status' => User::STATUS_ACTIVE,
            ]);
        } else {
            abort(422, 'Rol de usuario no soportado para aprobacion.');
        }

        return redirect()->back()->with('success', "Usuario {$user->name} aprobado correctamente.");
    }

    public function reject(int $id): RedirectResponse
    {
        $this->authorizeApprover();

        $user = User::query()->findOrFail($id);
        $user->delete();

        return redirect()->back()->with('success', 'Solicitud rechazada y eliminada.');
    }

    private function authorizeApprover(): void
    {
        $role = request()->user()->role ?? '';
        abort_unless($role === User::ROLE_ADMIN || $role === User::ROLE_LIDER, 403);
    }
}
