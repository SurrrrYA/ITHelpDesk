@extends('mail.layout')

@section('title', 'Status tiket diperbarui')
@section('heading', 'Status tiket Anda diperbarui')

@section('content')
    <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#3f3f46;">
        Status tiket {{ $ticket->ticket_number }} berubah dari
        <strong>{{ $oldStatusLabel }}</strong> menjadi <strong>{{ $newStatusLabel }}</strong>.
    </p>

    @include('mail.partials.ticket-summary', ['ticket' => $ticket])
@endsection
