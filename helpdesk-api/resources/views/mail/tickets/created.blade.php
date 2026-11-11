@extends('mail.layout')

@section('title', 'Tiket diterima')
@section('heading', 'Tiket Anda sudah diterima')

@section('content')
    <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#3f3f46;">
        Halo {{ $ticket->requester?->name ?? 'Pengguna' }}, tiket Anda sudah masuk ke antrean tim IT.
        Kami akan menghubungi Anda melalui tiket ini.
    </p>

    @include('mail.partials.ticket-summary', ['ticket' => $ticket])
@endsection
