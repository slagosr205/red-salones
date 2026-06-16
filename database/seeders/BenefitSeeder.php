<?php

namespace Database\Seeders;

use App\Models\Benefit;
use Illuminate\Database\Seeder;

class BenefitSeeder extends Seeder
{
    public function run(): void
    {
        Benefit::query()->create([
            'title' => 'Kit Profesional',
            'kind' => 'Producto',
            'points_cost' => 1000,
        ]);

        Benefit::query()->create([
            'title' => 'Master Class Colorimetria',
            'kind' => 'Capacitacion',
            'points_cost' => 500,
        ]);

        Benefit::query()->create([
            'title' => 'Kit Barberia',
            'kind' => 'Producto',
            'points_cost' => 800,
        ]);

        Benefit::query()->create([
            'title' => 'Taller Marketing para Salones',
            'kind' => 'Capacitacion',
            'points_cost' => 350,
        ]);
    }
}
