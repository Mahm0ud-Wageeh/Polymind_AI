<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\Conversation;
use App\Models\File;
use App\Models\Message;
use App\Models\UsageRecord;
use App\Models\Workspace;
use App\Services\AI\AiManager;
use App\Services\AI\Data\ChatRequest;
use App\Services\Chat\ChatToolRouter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ChatController extends Controller
{
    public function __construct(protected AiManager $ai) {}

    /**
     * Stream an assistant reply over Server-Sent Events.
     */
    public function stream(Request $request)
    {
        [$conversation, $userMessage, $chatRequest, $provider] = $this->prepare($request);

        // 🧠 توجيه الشات الذكي: الرسالة دي محتاجة قدرة؟
        $route = app(ChatToolRouter::class)->route($userMessage->content, $conversation);

        // لو القدرة عايزة برومبت خبير → بدّل الـ systemPrompt وكمّل streaming عادي
        if ($route !== null && ! empty($route['systemPrompt'])) {
            $chatRequest = new ChatRequest(
                model: $chatRequest->model,
                messages: $chatRequest->messages,
                temperature: $chatRequest->temperature,
                maxTokens: $chatRequest->maxTokens,
                systemPrompt: $route['systemPrompt'],
            );
        }

        return response()->stream(function () use ($conversation, $chatRequest, $provider, $route) {
            $this->sse('meta', ['conversation_id' => $conversation->id]);

            // نتيجة قدرة جاهزة (زي التوبولوجي) → نبثّها زي ما هي
            if ($route !== null && isset($route['content'])) {
                foreach (mb_str_split($route['content'], 40) as $piece) {
                    $this->sse('delta', ['content' => $piece]);
                }

                $assistant = $conversation->messages()->create([
                    'role' => 'assistant',
                    'content' => $route['content'],
                    'provider' => 'polymind',
                    'model' => $route['tool'],
                    'tokens_input' => 0,
                    'tokens_output' => 0,
                    'cost' => 0,
                ]);

                $conversation->forceFill(['last_message_at' => now()])->save();
                $this->sse('done', ['message_id' => $assistant->id, 'usage' => []]);

                return;
            }

            // العادي: رد AI مستمر (أو ببرومبت الخبير)
            $response = $this->ai->stream(
                $chatRequest,
                function (string $delta) {
                    $this->sse('delta', ['content' => $delta]);
                },
                $provider,
            );

            $assistant = $conversation->messages()->create([
                'role' => 'assistant',
                'content' => $response->content,
                'provider' => $response->provider,
                'model' => $response->model,
                'tokens_input' => $response->tokensInput,
                'tokens_output' => $response->tokensOutput,
                'cost' => $response->cost,
            ]);

            $this->recordUsage($conversation, $response->provider, $response->model, $response->tokensInput, $response->tokensOutput, $response->cost);
            $conversation->forceFill(['last_message_at' => now()])->save();

            $this->sse('done', ['message_id' => $assistant->id, 'usage' => $response->toArray()]);
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
            'Connection' => 'keep-alive',
        ]);
    }

    /**
     * Blocking (non-streamed) completion.
     */
    public function complete(Request $request): JsonResponse
    {
        [$conversation, $userMessage, $chatRequest, $provider] = $this->prepare($request);

        $response = $this->ai->chat($chatRequest, $provider);

        $assistant = $conversation->messages()->create([
            'role' => 'assistant',
            'content' => $response->content,
            'provider' => $response->provider,
            'model' => $response->model,
            'tokens_input' => $response->tokensInput,
            'tokens_output' => $response->tokensOutput,
            'cost' => $response->cost,
        ]);

        $this->recordUsage($conversation, $response->provider, $response->model, $response->tokensInput, $response->tokensOutput, $response->cost);
        $conversation->forceFill(['last_message_at' => now()])->save();

        return response()->json(['message' => $assistant, 'usage' => $response->toArray()]);
    }

    /**
     * Shared setup: validate, resolve/create the conversation, persist the user
     * message and build a provider-agnostic ChatRequest from history.
     *
     * @return array{0: Conversation, 1: Message, 2: ChatRequest, 3: string|null}
     */
    protected function prepare(Request $request): array
    {
        $data = $request->validate([
            'conversation_id' => ['nullable', 'uuid'],
            'workspace_id' => ['required_without:conversation_id', 'uuid'],
            'content' => ['required', 'string'],
            'provider' => ['nullable', 'string'],
            'model' => ['nullable', 'string'],
            'file_ids' => ['nullable', 'array'],
            'file_ids.*' => ['uuid'],
            'agent_id' => ['nullable', 'uuid'],
        ]);

        $user = $request->user();

        if (isset($data['workspace_id'])) {
            $workspace = Workspace::findOrFail($data['workspace_id']);
            abort_unless(
                $user->organizations()->where('organizations.id', $workspace->organization_id)->exists(),
                403,
            );
        }

        $conversation = isset($data['conversation_id'])
            ? $user->conversations()->findOrFail($data['conversation_id'])
            : $user->conversations()->create([
                'workspace_id' => $data['workspace_id'],
                'title' => Str::limit($data['content'], 40),
                'provider' => $data['provider'] ?? config('ai.default'),
                'model' => $data['model'] ?? config('ai.default_model'),
            ]);

        $userMessage = $conversation->messages()->create([
            'role' => 'user',
            'content' => $data['content'],
        ]);

        if (! empty($data['file_ids'])) {
            $files = File::query()
                ->where('user_id', $user->id)
                ->whereIn('id', $data['file_ids'])
                ->get();
            abort_unless($files->count() === count($data['file_ids']), 422, 'One or more uploaded files are unavailable.');
            File::whereIn('id', $files->pluck('id'))->update([
                'conversation_id' => $conversation->id,
                'message_id' => $userMessage->id,
            ]);
        }

        $history = $conversation->messages()
            ->whereIn('role', ['user', 'assistant'])
            ->orderBy('created_at')
            ->get()
            ->map(fn (Message $m) => ['role' => $m->role, 'content' => (string) $m->content])
            ->all();

        $systemPrompt = 'You are Polymind, a versatile AI assistant (like ChatGPT/Claude) that helps with ANY topic: coding, writing, analysis, math, networking, and general questions. '
    .'Always format answers in rich Markdown so they render beautifully: use ## and ### headings, bold, bullet and numbered lists, and blockquotes for notes. '
    .'Put every code snippet inside a fenced code block labelled with the correct language (python, ts, tsx, bash, json, sql, etc.) so it gets syntax highlighting. '
    .'Use GitHub-flavored Markdown tables for any structured or comparative data. '
    .'When explaining a process, architecture, flow, or relationship, add a diagram inside a fenced code block labelled mermaid (flowchart, sequence, graph, etc.). '
    .'Use LaTeX for math: inline with single dollar signs and block with double dollar signs. '
    .'Reply in the SAME language the user writes in (if they write Arabic, answer in Arabic) but keep code, commands, and technical keywords in English. '
    .'Be clear, well-structured, and skimmable; prefer short sections over long paragraphs.';

        if (! empty($data['agent_id'])) {
            $agent = Agent::where('id', $data['agent_id'])
                ->where(fn ($q) => $q->where('user_id', $user->id)->orWhere('is_public', true))
                ->first();

            if ($agent && $agent->system_prompt) {
                $systemPrompt = $agent->system_prompt;
            }
        }

        $chatRequest = new ChatRequest(
            model: $data['model'] ?? $conversation->model ?? config('ai.default_model'),
            messages: $history,
            systemPrompt: $systemPrompt,
        );

        return [$conversation, $userMessage, $chatRequest, $data['provider'] ?? $conversation->provider];
    }

    protected function recordUsage(Conversation $conversation, string $provider, string $model, int $in, int $out, float $cost): void
    {
        UsageRecord::create([
            'organization_id' => $conversation->workspace?->organization_id,
            'user_id' => $conversation->user_id,
            'conversation_id' => $conversation->id,
            'provider' => $provider,
            'model' => $model,
            'tokens_input' => $in,
            'tokens_output' => $out,
            'cost' => $cost,
            'created_at' => now(),
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    protected function sse(string $event, array $data): void
    {
        echo 'event: '.$event."\n";
        echo 'data: '.json_encode($data)."\n\n";
        if (function_exists('ob_flush')) {
            @ob_flush();
        }
        flush();
    }
}
