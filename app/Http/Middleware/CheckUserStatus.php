<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckUserStatus
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->status === User::STATUS_PENDING) {
            if (! $request->routeIs('pending.waiting', 'logout')) {
                return redirect()->route('pending.waiting');
            }
        }

        return $next($request);
    }
}
