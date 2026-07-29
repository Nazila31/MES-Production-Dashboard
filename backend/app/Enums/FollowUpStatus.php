<?php

namespace App\Enums;

enum FollowUpStatus: string
{
    case WaitingResponse = 'waiting_response';
    case Negotiating = 'negotiating';
    case Revision = 'revision';
    case Approved = 'approved';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::WaitingResponse => 'Menunggu Respon',
            self::Negotiating => 'Sedang Negosiasi',
            self::Revision => 'Revisi Quotation',
            self::Approved => 'Disetujui',
            self::Rejected => 'Ditolak',
        };
    }
}
