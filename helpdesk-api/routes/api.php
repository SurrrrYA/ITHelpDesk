<?php

use App\Http\Controllers\Api\V1\ArticleController;
use App\Http\Controllers\Api\V1\AssetController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\SlaPolicyController;
use App\Http\Controllers\Api\V1\TicketAttachmentController;
use App\Http\Controllers\Api\V1\TicketController;
use App\Http\Controllers\Api\V1\TicketReplyController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:login');

    Route::middleware(['auth:sanctum', 'active'])->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::put('auth/profile', [AuthController::class, 'updateProfile']);
        Route::put('auth/password', [AuthController::class, 'updatePassword']);

        Route::get('dashboard/summary', [DashboardController::class, 'summary']);

        Route::get('tickets', [TicketController::class, 'index']);
        Route::post('tickets', [TicketController::class, 'store']);
        Route::get('tickets/{ticket}', [TicketController::class, 'show']);
        Route::put('tickets/{ticket}', [TicketController::class, 'update']);
        Route::post('tickets/{ticket}/assign', [TicketController::class, 'assign'])->middleware('role:admin');
        Route::post('tickets/{ticket}/take', [TicketController::class, 'take']);
        Route::post('tickets/{ticket}/status', [TicketController::class, 'changeStatus']);
        Route::get('tickets/{ticket}/replies', [TicketReplyController::class, 'index']);
        Route::post('tickets/{ticket}/replies', [TicketReplyController::class, 'store']);
        Route::get('tickets/{ticket}/activities', [TicketController::class, 'activities']);
        Route::post('tickets/{ticket}/attachments', [TicketAttachmentController::class, 'store']);

        Route::get('attachments/{attachment}/download', [TicketController::class, 'downloadAttachment'])
            ->name('attachments.download');

        Route::get('categories', [CategoryController::class, 'index']);

        Route::get('assets', [AssetController::class, 'index']);
        Route::get('assets/{asset}', [AssetController::class, 'show']);

        Route::get('articles', [ArticleController::class, 'index']);
        Route::get('articles/{article}', [ArticleController::class, 'show']);

        Route::middleware('role:technician,admin')->group(function () {
            Route::post('articles', [ArticleController::class, 'store']);
            Route::put('articles/{article}', [ArticleController::class, 'update']);
            Route::delete('articles/{article}', [ArticleController::class, 'destroy']);
        });

        Route::middleware('role:admin')->group(function () {
            Route::post('categories', [CategoryController::class, 'store']);
            Route::put('categories/{category}', [CategoryController::class, 'update']);
            Route::delete('categories/{category}', [CategoryController::class, 'destroy']);

            Route::get('sla-policies', [SlaPolicyController::class, 'index']);
            Route::post('sla-policies', [SlaPolicyController::class, 'store']);
            Route::put('sla-policies/{slaPolicy}', [SlaPolicyController::class, 'update']);
            Route::delete('sla-policies/{slaPolicy}', [SlaPolicyController::class, 'destroy']);

            Route::get('users', [UserController::class, 'index']);
            Route::post('users', [UserController::class, 'store']);
            Route::put('users/{user}', [UserController::class, 'update']);
            Route::delete('users/{user}', [UserController::class, 'destroy']);

            Route::post('assets', [AssetController::class, 'store']);
            Route::put('assets/{asset}', [AssetController::class, 'update']);
            Route::delete('assets/{asset}', [AssetController::class, 'destroy']);
        });
    });
});
