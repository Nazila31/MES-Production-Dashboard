<?php

namespace App\Enums;

enum SalesOrderStatus: string
{
    case WaitingPpic = 'waiting_ppic';
    case PpicProcessing = 'ppic_processing';
    case Released = 'released';
    case InProduction = 'in_production';
    case QcPassed = 'qc_passed';
    case ReadyForDelivery = 'ready_for_delivery';
    case Completed = 'completed';
}
