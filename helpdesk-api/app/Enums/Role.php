<?php

namespace App\Enums;

enum Role: string
{
    case Employee = 'employee';
    case Technician = 'technician';
    case Admin = 'admin';

    public function label(): string
    {
        return match ($this) {
            self::Employee => 'Karyawan',
            self::Technician => 'Teknisi IT',
            self::Admin => 'Admin',
        };
    }

    public function isAdmin(): bool
    {
        return $this === self::Admin;
    }

    public function isTechnician(): bool
    {
        return $this === self::Technician;
    }

    public function isEmployee(): bool
    {
        return $this === self::Employee;
    }

    public function canManageMasterData(): bool
    {
        return $this === self::Admin;
    }

    public function canHandleTickets(): bool
    {
        return $this === self::Admin || $this === self::Technician;
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $role) => ['value' => $role->value, 'label' => $role->label()],
            self::cases(),
        );
    }
}
