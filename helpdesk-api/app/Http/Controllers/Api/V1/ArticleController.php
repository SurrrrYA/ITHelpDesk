<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Article\StoreArticleRequest;
use App\Http\Requests\Article\UpdateArticleRequest;
use App\Http\Resources\ArticleResource;
use App\Models\Article;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class ArticleController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Article::query()->with('author');

        if (! $user->canHandleTickets()) {
            $query->published();
        } elseif ($request->filled('status')) {
            $status = $request->string('status')->toString();

            if ($status === 'published') {
                $query->where('is_published', true);
            } elseif ($status === 'draft') {
                $query->where('is_published', false);
            }
        }

        if ($request->boolean('mine') && $user->canHandleTickets()) {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('q')) {
            $term = trim((string) $request->string('q'));

            if ($term !== '') {
                $operator = DB::getDriverName() === 'pgsql' ? 'ilike' : 'like';
                $like = '%'.str_replace(['%', '_'], ['\%', '\_'], $term).'%';

                $query->where(function ($search) use ($term, $operator, $like) {
                    if (DB::getDriverName() === 'pgsql') {
                        $search->whereRaw("search_vector @@ plainto_tsquery('simple', ?)", [$term]);
                    }

                    $search->orWhere('title', $operator, $like)
                        ->orWhere('excerpt', $operator, $like);
                });
            }
        }

        $perPage = min(max((int) $request->input('per_page', 10), 1), 50);

        return ArticleResource::collection(
            $query->orderByDesc('is_published')
                ->orderByDesc('published_at')
                ->orderByDesc('views')
                ->paginate($perPage)
                ->withQueryString(),
        );
    }

    public function show(Article $article): ArticleResource
    {
        Gate::authorize('view', $article);

        $article->increment('views');
        $article->load('author');

        return new ArticleResource($article);
    }

    public function store(StoreArticleRequest $request): JsonResponse
    {
        $article = Article::query()->create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
        ]);

        $article->load('author');

        return response()->json([
            'message' => 'Artikel berhasil dibuat.',
            'data' => new ArticleResource($article),
        ], 201);
    }

    public function update(UpdateArticleRequest $request, Article $article): JsonResponse
    {
        $article->update($request->validated());
        $article->load('author');

        return response()->json([
            'message' => 'Artikel berhasil diperbarui.',
            'data' => new ArticleResource($article),
        ]);
    }

    public function destroy(Article $article): JsonResponse
    {
        Gate::authorize('delete', $article);

        $article->delete();

        return response()->json(['message' => 'Artikel berhasil dihapus.']);
    }
}
