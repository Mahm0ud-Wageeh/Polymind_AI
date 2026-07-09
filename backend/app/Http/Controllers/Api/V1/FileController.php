<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\File;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FileController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $files = File::query()
            ->where('user_id', $request->user()->id)
            ->when($request->query('conversation_id'), fn ($q, $id) => $q->where('conversation_id', $id))
            ->latest()
            ->limit(200)
            ->get()
            ->map(fn (File $file) => $this->present($file));

        return response()->json(['data' => $files]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'max:20480'],
            'workspace_id' => ['nullable', 'uuid'],
            'conversation_id' => ['nullable', 'uuid'],
        ]);

        $upload = $data['file'];
        $disk = config('filesystems.default', 'local');
        $path = $upload->store('uploads/'.$request->user()->id, $disk);

        $file = File::create([
            'workspace_id' => $data['workspace_id'] ?? null,
            'user_id' => $request->user()->id,
            'conversation_id' => $data['conversation_id'] ?? null,
            'disk' => $disk,
            'path' => $path,
            'name' => $upload->getClientOriginalName(),
            'mime_type' => $upload->getClientMimeType(),
            'size' => $upload->getSize(),
            'checksum' => hash_file('sha256', $upload->getRealPath()),
        ]);

        return response()->json($this->present($file), 201);
    }

    public function show(Request $request, File $file): JsonResponse
    {
        abort_unless($file->user_id === $request->user()->id, 403);

        return response()->json($this->present($file));
    }

    public function destroy(Request $request, File $file): JsonResponse
    {
        abort_unless($file->user_id === $request->user()->id, 403);

        Storage::disk($file->disk)->delete($file->path);
        $file->delete();

        return response()->json(null, 204);
    }

    /** @return array<string, mixed> */
    private function present(File $file): array
    {
        $disk = Storage::disk($file->disk);

        return [
            'id' => $file->id,
            'name' => $file->name,
            'mime_type' => $file->mime_type,
            'size' => $file->size,
            'conversation_id' => $file->conversation_id,
            'created_at' => $file->created_at,
            'url' => $disk->exists($file->path) ? $disk->url($file->path) : null,
        ];
    }
}
