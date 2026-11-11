@extends('mail.layout')

@section('title', 'Pengingat SLA')
@section('heading', 'Tiket mendekati batas SLA')

@section('content')
    <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#3f3f46;">
        Tiket berikut mendekati atau sudah melewati batas waktu penyelesaian.
        Mohon segera ditindaklanjuti.
    </p>

    @include('mail.partials.ticket-summary', ['ticket' => $ticket])
@endsection
