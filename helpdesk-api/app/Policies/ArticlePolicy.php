<?php

namespace App\Policies;

use App\Models\Article;
use App\Models\User;

class ArticlePolicy
{
    public function view(User $user, Article $article): bool
    {
        return $article->is_published
            || $user->canHandleTickets()
            || $article->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->canHandleTickets();
    }

    public function update(User $user, Article $article): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $user->isTechnician() && $article->user_id === $user->id;
    }

    public function delete(User $user, Article $article): bool
    {
        return $this->update($user, $article);
    }
}
