@extends('mail.layout')

@section('title', 'Tiket ditugaskan')
@section('heading', 'Tiket baru ditugaskan kepada Anda')

@section('content')
    <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#3f3f46;">
        Halo {{ $ticket->assignee?->name ?? 'Teknisi' }}, tiket berikut sudah ditugaskan kepada Anda.
        Mohon cek detail dan mulai penanganan.
    </p>

    @include('mail.partials.ticket-summary', ['ticket' => $ticket])
@endsection
