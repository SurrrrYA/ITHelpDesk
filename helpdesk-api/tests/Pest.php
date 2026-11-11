<?php

use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| Seluruh feature test menggunakan Tests\TestCase yang sudah menyiapkan
| RefreshDatabase dan helper login per role.
|
*/

pest()->extend(TestCase::class)->in('Feature');
