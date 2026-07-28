<?php

namespace App\Enums;

enum ProductionStage: string
{
    case Fabrication = 'fabrication';
    case Machining = 'machining';
    case Assembly = 'assembly';
    case Qc = 'qc';

    public function progress(): int
    {
        return match ($this) {
            self::Fabrication => 25,
            self::Machining => 50,
            self::Assembly => 75,
            self::Qc => 100,
        };
    }

    public function next(): ?self
    {
        return match ($this) {
            self::Fabrication => self::Machining,
            self::Machining => self::Assembly,
            self::Assembly => self::Qc,
            self::Qc => null,
        };
    }

    public function previous(): ?self
    {
        return match ($this) {
            self::Fabrication => null,
            self::Machining => self::Fabrication,
            self::Assembly => self::Machining,
            self::Qc => self::Assembly,
        };
    }
}
