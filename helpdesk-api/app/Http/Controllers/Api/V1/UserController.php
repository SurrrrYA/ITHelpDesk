<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Master\UserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query()->orderBy('name');

        if ($request->filled('role')) {
            $query->where('role', $request->string('role'));
        }

        if ($request->filled('status')) {
            $query->where('is_active', $request->string('status')->toString() === 'active');
        }

        if ($request->filled('q')) {
            $term = '%'.str_replace(['%', '_'], ['\%', '\_'], (string) $request->string('q')).'%';
            $operator = DB::getDriverName() === 'pgsql' ? 'ilike' : 'like';

            $query->where(function ($search) use ($term, $operator) {
                $search->where('name', $operator, $term)
                    ->orWhere('email', $operator, $term);
            });
        }

        $perPage = min(max((int) $request->input('per_page', 15), 1), 100);

        return UserResource::collection($query->paginate($perPage)->withQueryString());
    }

    public function store(UserRequest $request): JsonResponse
    {
        $user = User::query()->create($request->validated());

        return response()->json([
            'message' => 'Pengguna berhasil dibuat.',
            'data' => new UserResource($user),
        ], 201);
    }

    public function update(UserRequest $request, User $user): JsonResponse
    {
        $data = $request->validated();
        $actor = $request->user();

        if ($actor->id === $user->id) {
            $newRole = $data['role'] ?? $user->role->value;
            $newActive = $data['is_active'] ?? $user->is_active;

            if ($newRole !== Role::Admin->value) {
                return response()->json([
                    'message' => 'Anda tidak dapat mengubah role akun sendiri.',
                ], 422);
            }

            if (! $newActive) {
                return response()->json([
                    'message' => 'Anda tidak dapat menonaktifkan akun sendiri.',
                ], 422);
            }
        }

        if (blank($data['password'] ?? null)) {
            unset($data['password']);
        }

        $user->update($data);

        return response()->json([
            'message' => 'Pengguna berhasil diperbarui.',
            'data' => new UserResource($user->refresh()),
        ]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($request->user()->id === $user->id) {
            return response()->json([
                'message' => 'Anda tidak dapat menghapus akun sendiri.',
            ], 422);
        }

        $hasHistory = $user->requestedTickets()->exists()
            || $user->assignedTickets()->exists()
            || $user->replies()->exists()
            || $user->attachments()->exists()
            || $user->activities()->exists()
            || $user->articles()->exists();

        if ($hasHistory) {
            return response()->json([
                'message' => 'Pengguna memiliki riwayat tiket atau aktivitas. Nonaktifkan saja daripada menghapus.',
            ], 422);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'Pengguna berhasil dihapus.']);
    }
}
