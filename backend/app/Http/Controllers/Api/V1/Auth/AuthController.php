<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Tenancy\WorkspaceProvisioner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(protected WorkspaceProvisioner $provisioner) {}

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::create($data);
        $user->assignRole('owner');

        // Bootstrap a default organization + workspace for the new account.
        $this->provisioner->bootstrap($user);

        $token = $user->createToken('spa')->plainTextToken;

        return response()->json([
            'user' => $user->fresh()->load('currentWorkspace'),
            'token' => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], (string) $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user->forceFill(['last_login_at' => now()])->save();
        $token = $user->createToken('spa')->plainTextToken;

        return response()->json([
            'user' => $user->load('currentWorkspace'),
            'token' => $token,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()->load('currentWorkspace'),
            'roles' => $request->user()->getRoleNames(),
            'permissions' => $request->user()->getAllPermissions()->pluck('name'),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'theme' => ['sometimes', 'nullable', 'in:light,dark,system'],
            'locale' => ['sometimes', 'nullable', 'string', 'max:12'],
        ]);

        $request->user()->update($data);

        return response()->json([
            'user' => $request->user()->fresh()->load('currentWorkspace'),
            'roles' => $request->user()->getRoleNames(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    public function verifyEmail(Request $request): JsonResponse
    {
        $request->user()->forceFill(['email_verified_at' => now()])->save();

        return response()->json(['message' => 'Email verified.']);
    }
}
