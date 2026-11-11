<table style="width:100%;border-collapse:collapse;font-size:13px;margin:16px 0;">
    <tr>
        <td style="padding:6px 0;color:#71717a;">Nomor tiket</td>
        <td style="padding:6px 0;text-align:right;font-weight:bold;">{{ $ticket->ticket_number }}</td>
    </tr>
    <tr>
        <td style="padding:6px 0;color:#71717a;">Judul</td>
        <td style="padding:6px 0;text-align:right;">{{ $ticket->subject }}</td>
    </tr>
    <tr>
        <td style="padding:6px 0;color:#71717a;">Status</td>
        <td style="padding:6px 0;text-align:right;">{{ $ticket->status->label() }}</td>
    </tr>
    <tr>
        <td style="padding:6px 0;color:#71717a;">Prioritas</td>
        <td style="padding:6px 0;text-align:right;">{{ $ticket->priority->label() }}</td>
    </tr>
    <tr>
        <td style="padding:6px 0;color:#71717a;">Pelapor</td>
        <td style="padding:6px 0;text-align:right;">{{ $ticket->requester?->name ?? '—' }}</td>
    </tr>
    <tr>
        <td style="padding:6px 0;color:#71717a;">Teknisi</td>
        <td style="padding:6px 0;text-align:right;">{{ $ticket->assignee?->name ?? 'Belum ditugaskan' }}</td>
    </tr>
    <tr>
        <td style="padding:6px 0;color:#71717a;">Batas penyelesaian</td>
        <td style="padding:6px 0;text-align:right;">{{ $ticket->sla_resolution_due_at?->translatedFormat('d M Y H:i') ?? '—' }}</td>
    </tr>
</table>

<p style="margin:20px 0 0;">
    <a href="{{ $url }}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:13px;font-weight:bold;padding:10px 16px;border-radius:8px;">
        Lihat Tiket
    </a>
</p>
