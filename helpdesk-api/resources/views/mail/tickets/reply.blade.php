@extends('mail.layout')

@section('title', 'Balasan baru')
@section('heading', 'Ada balasan baru pada tiket Anda')

@section('content')
    <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#3f3f46;">
        {{ $reply->user?->name ?? 'Pengguna' }} menulis:
    </p>

    <div style="margin:12px 0;padding:12px 14px;background:#f4f4f5;border-radius:8px;font-size:13px;line-height:1.6;color:#27272a;">
        {!! nl2br(e($reply->body)) !!}
    </div>

    @include('mail.partials.ticket-summary', ['ticket' => $ticket])
@endsection
