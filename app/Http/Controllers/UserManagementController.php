<?php

namespace App\Http\Controllers;

use App\Mail\AffiliateCardMail;
use App\Mail\PendingApproval;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    private function canCreateSalon(): bool
    {
        $role = request()->user()->role ?? '';

        return $role === User::ROLE_ADMIN || $role === User::ROLE_LIDER;
    }

    public function create(): Response
    {
        abort_unless($this->canCreateSalon(), 403);

        $user = request()->user();
        $leaders = collect();

        if ($user->role === User::ROLE_ADMIN) {
            $leaders = User::query()
                ->where('role', User::ROLE_LIDER)
                ->get(['id', 'name', 'email']);
        }

        return Inertia::render('Rc/CreateUser', [
            'leaders' => $leaders,
        ]);
    }

    public function assignLeader(Request $request, int $id): RedirectResponse
    {
        abort_unless($request->user()->role === User::ROLE_ADMIN, 403);

        $validated = $request->validate([
            'leader_id' => ['nullable', 'exists:users,id'],
        ]);

        $target = User::query()->findOrFail($id);

        if ($validated['leader_id']) {
            $leader = User::query()->findOrFail($validated['leader_id']);
            abort_unless($leader->role === User::ROLE_LIDER, 422, 'El usuario seleccionado no es un lider.');
        }

        $target->update(['leader_id' => $validated['leader_id']]);

        return redirect()->back()->with('success', 'Lider asignado correctamente.');
    }

    public function showCarnet(int $id): Response
    {
        $user = User::query()->findOrFail($id);

        return Inertia::render('Public/AffiliateCard', [
            'member' => $this->buildMember($user),
        ]);
    }

    public function sendCarnet(int $id): RedirectResponse
    {
        $user = User::query()->findOrFail($id);

        Mail::to($user->email)->send(new AffiliateCardMail($user, $this->buildMember($user)));

        return redirect()->back()->with('success', 'Carnet enviado por correo a '.$user->email);
    }

    private function buildMember(User $user): array
    {
        $created = $user->created_at;

        return [
            'name' => mb_strtoupper($user->name),
            'id' => 'RC-'.$created->format('Y').'-'.str_pad((string) $user->id, 5, '0', STR_PAD_LEFT),
            'level' => 'PLATINUM',
            'since' => ucfirst($created->format('F Y')),
            'expires' => ucfirst((clone $created)->addYear()->format('F Y')),
        ];
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($this->canCreateSalon(), 403);

        $user = $request->user();
        $isAdmin = $user->role === User::ROLE_ADMIN;

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8'],
        ];

        if ($isAdmin) {
            $rules['role'] = ['required', 'string', 'in:'.User::ROLE_LIDER.','.User::ROLE_SALON];
            $rules['leader_id'] = ['nullable', 'exists:users,id'];
            $rules['client_type'] = ['nullable', 'string', 'in:'.implode(',', User::CLIENT_TYPES)];
        } else {
            $rules['role'] = ['prohibited'];
            $rules['leader_id'] = ['prohibited'];
        }

        $validated = $request->validate($rules);

        $isCreatingLider = $isAdmin && ($validated['role'] ?? '') === User::ROLE_LIDER;

        $validated['password'] = Hash::make($validated['password']);
        $validated['status'] = $isCreatingLider ? User::STATUS_ACTIVE : User::STATUS_PENDING;

        if (! $isAdmin) {
            $validated['role'] = User::ROLE_SALON;
            $validated['leader_id'] = $user->id;
        }

        if ($isAdmin && ! $isCreatingLider && empty($validated['client_type'])) {
            $validated['client_type'] = User::CLIENT_TYPE_SALON;
        }

        $newUser = User::query()->create($validated);

        if (! $isCreatingLider) {
            Mail::to($newUser->email)->send(new PendingApproval($newUser, $request->input('password')));
        }

        $message = $isCreatingLider
            ? 'Lider creado exitosamente.'
            : 'Usuario de salon creado. Pendiente de aprobacion.';

        $redirect = $isCreatingLider ? 'rc.network' : 'rc.pending';

        return redirect()->route($redirect)->with('success', $message);
    }
}
