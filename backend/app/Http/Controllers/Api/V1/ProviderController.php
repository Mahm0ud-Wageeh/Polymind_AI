<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\AI\AiManager;
use Illuminate\Http\JsonResponse;

class ProviderController extends Controller
{
    public function __construct(protected AiManager $ai) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'default' => config('ai.default'),
            'default_model' => config('ai.default_model'),
            'providers' => $this->ai->catalog(),
        ]);
    }
}
