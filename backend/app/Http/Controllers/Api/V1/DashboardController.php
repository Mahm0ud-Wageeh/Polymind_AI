<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\UsageRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $since = now()->subDays(30);

        $usage = UsageRecord::where('user_id', $user->id)
            ->where('created_at', '>=', $since)
            ->selectRaw('COALESCE(SUM(tokens_input),0) as tokens_input, COALESCE(SUM(tokens_output),0) as tokens_output, COALESCE(SUM(cost),0) as cost')
            ->first();

        $daily = UsageRecord::where('user_id', $user->id)
            ->where('created_at', '>=', $since)
            ->groupBy('day')
            ->orderBy('day')
            ->get([
                DB::raw('DATE(created_at) as day'),
                DB::raw('SUM(tokens_input + tokens_output) as tokens'),
                DB::raw('SUM(cost) as cost'),
            ]);

        return response()->json([
            'stats' => [
                'conversations' => $user->conversations()->count(),
                'tokens_input' => (int) ($usage->tokens_input ?? 0),
                'tokens_output' => (int) ($usage->tokens_output ?? 0),
                'cost' => (float) ($usage->cost ?? 0),
            ],
            'usage_by_day' => $daily,
            'recent_conversations' => $user->conversations()
                ->orderByDesc('last_message_at')
                ->limit(5)
                ->get(['id', 'title', 'last_message_at']),
        ]);
    }
}
