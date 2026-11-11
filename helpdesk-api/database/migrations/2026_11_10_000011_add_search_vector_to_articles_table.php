<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement(<<<'SQL'
            ALTER TABLE articles
            ADD COLUMN search_vector tsvector
            GENERATED ALWAYS AS (
                to_tsvector(
                    'simple',
                    coalesce(title, '') || ' ' || coalesce(excerpt, '') || ' ' || coalesce(body, '')
                )
            ) STORED
        SQL);

        DB::statement('CREATE INDEX articles_search_vector_index ON articles USING GIN (search_vector)');
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('DROP INDEX IF EXISTS articles_search_vector_index');
        DB::statement('ALTER TABLE articles DROP COLUMN IF EXISTS search_vector');
    }
};
