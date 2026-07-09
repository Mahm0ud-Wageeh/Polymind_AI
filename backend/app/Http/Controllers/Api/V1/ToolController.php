<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class ToolController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'builtin' => config('tools.builtin', []),
            'mcp_servers' => config('tools.mcp_servers', []),
        ]);
    }
}
