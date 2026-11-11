<?php

namespace Database\Factories;

use App\Models\Asset;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Asset>
 */
class AssetFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'asset_tag' => strtoupper(fake()->unique()->bothify('AST-####-??')),
            'name' => fake()->randomElement(['Laptop', 'Desktop', 'Monitor', 'Printer', 'Router']).' '.fake()->numerify('##'),
            'category' => fake()->randomElement(['Komputer', 'Jaringan', 'Periferal', 'Penyimpanan']),
            'brand' => fake()->randomElement(['Lenovo', 'Dell', 'HP', 'Asus', 'Epson', 'TP-Link']),
            'model' => strtoupper(fake()->bothify('MDL-####')),
            'serial_number' => strtoupper(fake()->bothify('SN########')),
            'purchased_at' => fake()->dateTimeBetween('-4 years', 'now'),
            'assigned_to' => null,
            'status' => Asset::STATUS_ACTIVE,
            'notes' => fake()->optional()->sentence(),
        ];
    }

    public function assignedTo(User $user): static
    {
        return $this->state(fn () => ['assigned_to' => $user->id]);
    }

    public function maintenance(): static
    {
        return $this->state(fn () => ['status' => Asset::STATUS_MAINTENANCE]);
    }

    public function retired(): static
    {
        return $this->state(fn () => ['status' => Asset::STATUS_RETIRED]);
    }
}
