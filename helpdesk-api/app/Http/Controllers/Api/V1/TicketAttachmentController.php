<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Ticket\StoreAttachmentRequest;
use App\Http\Resources\TicketAttachmentResource;
use App\Models\Ticket;
use App\Services\TicketService;
use Illuminate\Http\JsonResponse;

class TicketAttachmentController extends Controller
{
    public function __construct(private readonly TicketService $service) {}

    public function store(StoreAttachmentRequest $request, Ticket $ticket): JsonResponse
    {
        $attachments = $this->service->attach(
            $ticket,
            $request->user(),
            $request->file('attachments', []),
        );

        return TicketAttachmentResource::collection($attachments)
            ->response()
            ->setStatusCode(201);
    }
}
