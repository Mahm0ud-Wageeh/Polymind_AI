<?php

namespace Database\Seeders;

use App\Models\User;
use App\Services\Tenancy\WorkspaceProvisioner;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RolePermissionSeeder::class);
        $this->call(EngineeringAgentsSeeder::class);

        $demo = User::firstOrCreate(
            ['email' => 'demo@polymind.ai'],
            ['name' => 'Demo User', 'password' => 'password', 'email_verified_at' => now()]
        );

        if ($demo->wasRecentlyCreated) {
            $demo->assignRole('owner');
            app(WorkspaceProvisioner::class)->bootstrap($demo);
        }

        $this->seedTemplates();
    }

    protected function seedTemplates(): void
    {
        $templates = [
            [
                'name' => 'Network Design',
                'icon' => 'Network',
                'description' => 'Turn a natural-language brief into a structured network design',
                'prompt' => 'You are a senior network architect. Design a complete network from the brief below. '
                    .'Provide: topology (layers + connections), device list with roles, IP addressing & subnetting plan, '
                    .'VLAN plan, routing plan, security recommendations, and a phased deployment plan. '
                    ."Use standard enterprise design patterns and best practices.\n\nBrief:",
                'category' => 'design',
            ],
            [
                'name' => 'Config Generation',
                'icon' => 'FileCode2',
                'description' => 'Generate a production-ready device configuration',
                'prompt' => 'You are a network configuration engineer. Generate a complete, copy-paste-ready '
                    .'configuration for the specified vendor/platform from the requirements below. Include '
                    .'interface config, VLANs, routing, ACLs/NAT, and management (NTP, SNMP, logging). '
                    ."Comment each section. Validate against the platform's syntax.\n\nRequirements:",
                'category' => 'config',
            ],
            [
                'name' => 'Subnet Plan',
                'icon' => 'Calculator',
                'description' => 'VLSM subnet a range across multiple VLANs',
                'prompt' => 'You are a subnetting expert. Given a CIDR block and a list of required subnets/VLANs '
                    .'with host counts, produce a VLSM plan: network, mask, broadcast, usable range, and assignment '
                    .'per VLAN. Show your work and verify no overlaps. Prefer the smallest mask that fits each subnet '
                    ."in descending order of host count.\n\nInput:",
                'category' => 'addressing',
            ],
            [
                'name' => 'ACL Review',
                'icon' => 'Shield',
                'description' => 'Review an ACL or firewall policy for correctness',
                'prompt' => 'You are a network security reviewer. Analyze the ACL/firewall rules below for the '
                    .'stated intent. Flag: least-privilege violations, shadowed or orphaned rules, missing logging, '
                    .'overly broad sources, and protocol/port mismatches. Give a corrected rule set and an explanation '
                    ."of each change.\n\nRules:",
                'category' => 'security',
            ],
            [
                'name' => 'Troubleshoot',
                'icon' => 'Wrench',
                'description' => 'Diagnose a networking issue step-by-step',
                'prompt' => 'You are a senior network troubleshooter. Given the symptom and any command output below, '
                    .'produce a ranked differential, then the exact verification commands and the expected output for '
                    .'each. Walk the layers (physical → data-link → network → transport → application). Conclude with '
                    ."the most likely root cause and a concrete fix.\n\nSymptom/output:",
                'category' => 'troubleshooting',
            ],
            [
                'name' => 'Document Network',
                'icon' => 'FileText',
                'description' => 'Produce formal network documentation from a design',
                'prompt' => 'You are a network documentation writer. From the design below, generate a deployment '
                    .'guide containing: executive summary, topology description, device inventory (table), IP + VLAN '
                    .'tables, cable inventory, rack elevations, implementation steps, and a maintenance/rollback guide. '
                    ."Use Markdown with tables and headings.\n\nDesign:",
                'category' => 'documentation',
            ],
        ];

        foreach ($templates as $t) {
            Template::firstOrCreate(
                ['name' => $t['name']],
                $t + ['is_public' => true, 'domain' => 'networking']
            );
        }
    }
}
