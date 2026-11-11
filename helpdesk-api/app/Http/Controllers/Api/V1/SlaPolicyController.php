<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\SlaPolicyRequest;
use App\Http\Resources\SlaPolicyResource;
use App\Models\SlaPolicy;
use Illuminate\Http\JsonResponse;

class SlaPolicyController extends Controller
{
    public function index()
    {
        return SlaPolicyResource::collection(
            SlaPolicy::query()->orderBy('response_minutes')->get(),
        );
    }

    public function store(SlaPolicyRequest $request): JsonResponse
    {
        $policy = SlaPolicy::query()->create($request->validated());

        return response()->json([
            'message' => 'Kebijakan SLA berhasil dibuat.',
            'data' => new SlaPolicyResource($policy),
        ], 201);
    }

    public function update(SlaPolicyRequest $request, SlaPolicy $slaPolicy): JsonResponse
    {
        $slaPolicy->update($request->validated());

        return response()->json([
            'message' => 'Kebijakan SLA berhasil diperbarui.',
            'data' => new SlaPolicyResource($slaPolicy->refresh()),
        ]);
    }

    public function destroy(SlaPolicy $slaPolicy): JsonResponse
    {
        $slaPolicy->delete();

        return response()->json(['message' => 'Kebijakan SLA berhasil dihapus.']);
    }
}
