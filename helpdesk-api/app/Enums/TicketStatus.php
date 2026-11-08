<?php

namespace App\Enums;

enum TicketStatus: string
{
    case New = 'new';
    case Assigned = 'assigned';
    case InProgress = 'in_progress';
    case Resolved = 'resolved';
    case Closed = 'closed';

    public function label(): string
    {
        return match ($this) {
            self::New => 'Baru',
            self::Assigned => 'Ditugaskan',
            self::InProgress => 'Diproses',
            self::Resolved => 'Selesai',
            self::Closed => 'Ditutup',
        };
    }

    public function isOpen(): bool
    {
        return in_array($this, [self::New, self::Assigned, self::InProgress], true);
    }

    public function isFinal(): bool
    {
        return $this === self::Closed;
    }

    /**
     * Status tujuan yang diizinkan dari status saat ini.
     *
     * @return array<int, self>
     */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::New => [self::Assigned, self::InProgress, self::Resolved],
            self::Assigned => [self::InProgress, self::Resolved],
            self::InProgress => [self::Resolved],
            self::Resolved => [self::InProgress, self::Closed],
            self::Closed => [],
        };
    }

    public function canTransitionTo(self $target): bool
    {
        return in_array($target, $this->allowedTransitions(), true);
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $status) => ['value' => $status->value, 'label' => $status->label()],
            self::cases(),
        );
    }
}
