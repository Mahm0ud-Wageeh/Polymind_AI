<?php

namespace Database\Seeders;

use App\Models\Agent;
use App\Models\Template;
use App\Models\User;
use App\Services\Tenancy\WorkspaceProvisioner;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RolePermissionSeeder::class);

        $demo = User::firstOrCreate(
            ['email' => 'demo@polymind.ai'],
            ['name' => 'Demo User', 'password' => 'password', 'email_verified_at' => now()]
        );

        if ($demo->wasRecentlyCreated) {
            $demo->assignRole('owner');
            app(WorkspaceProvisioner::class)->bootstrap($demo);
        }

        $templates = [
            ['name' => 'Summarize', 'icon' => 'FileText', 'description' => 'Summarize any text', 'prompt' => 'Summarize the following:'],
            ['name' => 'Code Review', 'icon' => 'Code2', 'description' => 'Review a code snippet', 'prompt' => 'Review this code and suggest improvements:'],
            ['name' => 'Brainstorm', 'icon' => 'Lightbulb', 'description' => 'Generate ideas', 'prompt' => 'Brainstorm ideas for:'],
            ['name' => 'Translate', 'icon' => 'Languages', 'description' => 'Translate text', 'prompt' => 'Translate the following text:'],
        ];

        foreach ($templates as $t) {
            Template::firstOrCreate(['name' => $t['name']], $t + ['is_public' => true, 'category' => 'general']);
        }

        $agents = [
            ['name' => 'Research Assistant', 'icon' => 'Search', 'description' => 'Finds and synthesizes information from multiple sources.', 'system_prompt' => 'You are a meticulous research assistant. Cite sources and stay objective.', 'model' => 'gpt-4o-mini'],
            ['name' => 'Code Copilot', 'icon' => 'Code2', 'description' => 'Writes, reviews, and debugs code across languages.', 'system_prompt' => 'You are an expert software engineer. Prefer clean, well-tested code.', 'model' => 'gpt-4o'],
            ['name' => 'Product Strategist', 'icon' => 'Target', 'description' => 'Turns ideas into roadmaps, specs, and user stories.', 'system_prompt' => 'You are a seasoned product strategist. Be concise and outcome-driven.', 'model' => 'gpt-4o-mini'],
            ['name' => 'Writing Editor', 'icon' => 'PenLine', 'description' => 'Polishes tone, grammar, and clarity of any text.', 'system_prompt' => 'You are a professional editor. Improve clarity without changing meaning.', 'model' => 'gpt-4o-mini'],
        ];

        foreach ($agents as $a) {
            Agent::firstOrCreate(['name' => $a['name']], $a + ['is_public' => true, 'provider' => 'openai', 'temperature' => 0.7]);
        }
    }
}
