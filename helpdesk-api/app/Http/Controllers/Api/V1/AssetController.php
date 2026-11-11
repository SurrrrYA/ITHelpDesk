<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\AssetRequest;
use App\Http\Resources\AssetResource;
use App\Models\Asset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AssetController extends Controller
{
    public function index(Request $request)
    {
        $query = Asset::query()
            ->with('assignedUser')
            ->withCount('tickets')
            ->orderBy('asset_tag');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->integer('assigned_to'));
        }

        if ($request->filled('q')) {
            $term = '%'.str_replace(['%', '_'], ['\%', '\_'], (string) $request->string('q')).'%';
            $operator = DB::getDriverName() === 'pgsql' ? 'ilike' : 'like';

            $query->where(function ($search) use ($term, $operator) {
                $search->where('asset_tag', $operator, $term)
                    ->orWhere('name', $operator, $term)
                    ->orWhere('serial_number', $operator, $term);
            });
        }

        $perPage = min(max((int) $request->input('per_page', 15), 1), 100);

        return AssetResource::collection($query->paginate($perPage)->withQueryString());
    }

    public function show(Request $request, Asset $asset): AssetResource
    {
        $asset->load('assignedUser')->loadCount('tickets');

        $tickets = $asset->tickets()
            ->with(['requester'])
            ->latest()
            ->limit(50);

        if ($request->user()->isEmployee()) {
            $tickets->where('requester_id', $request->user()->id);
        }

        $asset->setRelation('tickets', $tickets->get());

        return new AssetResource($asset);
    }

    public function store(AssetRequest $request): JsonResponse
    {
        $asset = Asset::query()->create($request->validated());
        $asset->load('assignedUser')->loadCount('tickets');

        return response()->json([
            'message' => 'Aset berhasil dibuat.',
            'data' => new AssetResource($asset),
        ], 201);
    }

    public function update(AssetRequest $request, Asset $asset): JsonResponse
    {
        $asset->update($request->validated());
        $asset->load('assignedUser')->loadCount('tickets');

        return response()->json([
            'message' => 'Aset berhasil diperbarui.',
            'data' => new AssetResource($asset),
        ]);
    }

    public function destroy(Asset $asset): JsonResponse
    {
        if ($asset->tickets()->exists()) {
            return response()->json([
                'message' => 'Aset masih terkait tiket. Ubah status menjadi retired daripada menghapus.',
            ], 422);
        }

        $asset->delete();

        return response()->json(['message' => 'Aset berhasil dihapus.']);
    }
}
