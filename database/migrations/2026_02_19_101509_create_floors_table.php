<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('floors', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code');
            $table->foreignId('buildings_id');
            $table->foreignId('hotels_id');
            $table->timestamps();
            $table->unique(['code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('floors');
    }
};
