<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Remove old demo user if exists (replaced by salon@salon.test)
        User::query()->where('email', 'demo@salon.test')->delete();

        User::query()->updateOrCreate(
            ['email' => 'admin@salon.test'],
            [
                'name' => 'Admin Principal',
                'role' => User::ROLE_ADMIN,
                'password' => Hash::make('Password123!'),
            ],
        );

        User::query()->updateOrCreate(
            ['email' => 'lider@salon.test'],
            [
                'name' => 'Lider Regional',
                'role' => User::ROLE_LIDER,
                'password' => Hash::make('Password123!'),
            ],
        );

        $lider = User::query()->where('email', 'lider@salon.test')->first();

        User::query()->updateOrCreate(
            ['email' => 'salon@salon.test'],
            [
                'name' => 'Salon Demo',
                'role' => User::ROLE_SALON,
                'leader_id' => $lider?->id,
                'password' => Hash::make('Password123!'),
            ],
        );
    }
}
