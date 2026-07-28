<?php

namespace App\Enums;

enum StageLogStatus: string
{
    case Pending = 'pending';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Rejected = 'rejected';
}
