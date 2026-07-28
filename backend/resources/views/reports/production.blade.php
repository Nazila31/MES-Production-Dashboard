<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Production Report</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .summary { margin-bottom: 12px; color: #475569; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #ccc; padding: 5px; text-align: left; vertical-align: top; }
        th { background: #f3f4f6; font-size: 10px; }
        .docs { font-size: 9px; line-height: 1.4; }
        .docs a { color: #2563eb; text-decoration: none; word-break: break-all; }
        .project-block { page-break-inside: avoid; margin-top: 18px; border: 1px solid #e5e7eb; padding: 10px; }
        .project-title { font-weight: bold; margin-bottom: 6px; }
    </style>
</head>
<body>
    <h1>Production Report</h1>
    <p class="summary">
        Total Orders: {{ $report['total_orders'] ?? 0 }} |
        Completed: {{ $report['completed'] ?? 0 }} |
        Delayed: {{ $report['delayed'] ?? 0 }} |
        Efficiency: {{ $report['efficiency'] ?? 0 }}%
    </p>

    <table>
        <thead>
            <tr>
                <th>Quotation Date</th>
                <th>Quotation No.</th>
                <th>SO Date</th>
                <th>SO Number</th>
                <th>Client</th>
                <th>Deadline</th>
                <th>Production Start</th>
                <th>Completion</th>
                <th>Total Hari</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($report['rows'] ?? [] as $row)
                <tr>
                    <td>{{ $row['quotation_date'] }}</td>
                    <td>{{ $row['quotation_number'] }}</td>
                    <td>{{ $row['so_date'] }}</td>
                    <td>{{ $row['so_number'] }}</td>
                    <td>{{ $row['client'] }}</td>
                    <td>{{ $row['deadline_date'] }}</td>
                    <td>{{ $row['production_start'] }}</td>
                    <td>{{ $row['completion_date'] }}</td>
                    <td>{{ $row['total_days'] ?? '-' }}</td>
                    <td>{{ $row['status_label'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    @foreach ($report['rows'] ?? [] as $row)
        @if (!empty($row['documents']))
            <div class="project-block">
                <div class="project-title">{{ $row['so_number'] }} — {{ $row['client'] }} (Documents)</div>
                <div class="docs">
                    @foreach ($row['documents'] as $doc)
                        <div>
                            <strong>{{ $doc['label'] }}:</strong>
                            {{ $doc['file_name'] }}
                            — <a href="{{ $doc['url'] }}">{{ $doc['url'] }}</a>
                        </div>
                    @endforeach
                </div>
            </div>
        @endif
    @endforeach
</body>
</html>
