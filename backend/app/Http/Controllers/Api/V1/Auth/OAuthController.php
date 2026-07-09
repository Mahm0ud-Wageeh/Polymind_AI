<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Tenancy\WorkspaceProvisioner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class OAuthController extends Controller
{
    protected array $allowed = ['google', 'github'];

    public function __construct(protected WorkspaceProvisioner $provisioner) {}

    public function redirect(string $provider): JsonResponse|RedirectResponse
    {
        abort_unless(in_array($provider, $this->allowed, true), 404);

        return response()->json([
            'url' => Socialite::driver($provider)->stateless()->redirect()->getTargetUrl(),
        ]);
    }

    public function callback(string $provider): RedirectResponse
    {
        abort_unless(in_array($provider, $this->allowed, true), 404);

        $oauthUser = Socialite::driver($provider)->stateless()->user();

        $user = User::firstOrCreate(
            ['email' => $oauthUser->getEmail()],
            [
                'name' => $oauthUser->getName() ?: $oauthUser->getNickname() ?: 'User',
                'avatar' => $oauthUser->getAvatar(),
                'password' => Str::password(24),
                'oauth_provider' => $provider,
                'oauth_id' => $oauthUser->getId(),
                'email_verified_at' => now(),
            ]
        );

        if ($user->wasRecentlyCreated) {
            $user->assignRole('owner');
            $this->provisioner->bootstrap($user);
        }

        $token = $user->createToken('spa')->plainTextToken;
        $frontend = rtrim((string) config('app.frontend_url'), '/');

        return redirect()->away("{$frontend}/auth/callback?token={$token}");
    }
}
