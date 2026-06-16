<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\Promotion;
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
                'client_type' => User::CLIENT_TYPE_SALON,
                'password' => Hash::make('Password123!'),
            ],
        );

        User::query()->updateOrCreate(
            ['email' => 'consumidor@salon.test'],
            [
                'name' => 'Cliente Consumidor Final',
                'role' => User::ROLE_SALON,
                'leader_id' => $lider?->id,
                'client_type' => User::CLIENT_TYPE_CONSUMIDOR_FINAL,
                'password' => Hash::make('Password123!'),
            ],
        );

        // Create sample articles with all 3 price tiers
        if (Article::query()->count() === 0) {
            $admin = User::query()->where('email', 'admin@salon.test')->first();

            Article::query()->create([
                'name' => 'Shampoo Profesional Keratina',
                'brand' => 'KeratinPro',
                'category' => 'Shampoo',
                'price' => 250.00,
                'leader_price' => 180.00,
                'public_price' => 320.00,
                'stock' => 50,
                'points' => 25,
                'summary' => 'Shampoo profesional con keratina para cabello dañado.',
                'is_featured' => true,
                'created_by' => $admin?->id,
            ]);

            Article::query()->create([
                'name' => 'Acondicionador Reparador',
                'brand' => 'KeratinPro',
                'category' => 'Acondicionador',
                'price' => 230.00,
                'leader_price' => 165.00,
                'public_price' => 300.00,
                'stock' => 40,
                'points' => 23,
                'summary' => 'Acondicionador reparador con aceite de argán.',
                'is_featured' => true,
                'created_by' => $admin?->id,
            ]);

            Article::query()->create([
                'name' => 'Aceite Capilar Argan',
                'brand' => 'NaturalOil',
                'category' => 'Aceites',
                'price' => 180.00,
                'leader_price' => 130.00,
                'public_price' => 240.00,
                'stock' => 30,
                'points' => 18,
                'summary' => 'Aceite capilar 100% natural de argán.',
                'is_featured' => false,
                'created_by' => $admin?->id,
            ]);

            Article::query()->create([
                'name' => 'Kit de Tinte Profesional',
                'brand' => 'ColorMaster',
                'category' => 'Otros',
                'price' => 350.00,
                'leader_price' => 250.00,
                'public_price' => 450.00,
                'stock' => 20,
                'points' => 35,
                'summary' => 'Kit completo de tinte profesional con 8 tonos.',
                'is_featured' => true,
                'created_by' => $admin?->id,
            ]);
        }

        // Create sample promotions
        if (Promotion::query()->count() === 0) {
            $articles = Article::all();
            $art1 = $articles->firstWhere('name', 'Shampoo Profesional Keratina');
            $art2 = $articles->firstWhere('name', 'Acondicionador Reparador');
            $art3 = $articles->firstWhere('name', 'Aceite Capilar Argan');
            $art4 = $articles->firstWhere('name', 'Kit de Tinte Profesional');

            $promo1 = Promotion::query()->create([
                'name' => '2x1 Shampoo + Acondicionador',
                'type' => '2x1',
                'value' => 0,
                'start_date' => '2026-06-16',
                'end_date' => '2026-07-16',
                'active' => true,
            ]);
            if ($art1) {
                $promo1->articles()->attach($art1->id);
            }
            if ($art2) {
                $promo1->articles()->attach($art2->id);
            }

            $promo2 = Promotion::query()->create([
                'name' => 'Combo Cuidado Capilar',
                'type' => 'combo',
                'value' => 20,
                'start_date' => '2026-06-16',
                'end_date' => '2026-07-31',
                'active' => true,
            ]);
            if ($art1) {
                $promo2->articles()->attach($art1->id);
            }
            if ($art2) {
                $promo2->articles()->attach($art2->id);
            }
            if ($art3) {
                $promo2->articles()->attach($art3->id);
            }

            $promo3 = Promotion::query()->create([
                'name' => 'Descuento Kit Coloración',
                'type' => 'descuento',
                'value' => 15,
                'start_date' => '2026-06-16',
                'end_date' => '2026-07-16',
                'active' => true,
            ]);
            if ($art4) {
                $promo3->articles()->attach($art4->id);
            }
        }
    }
}
