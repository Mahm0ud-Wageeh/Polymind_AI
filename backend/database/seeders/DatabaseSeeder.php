<?php

namespace Database\Seeders;

use App\Models\Agent;
use App\Models\Template;
use App\Models\User;
use App\Services\Tenancy\WorkspaceProvisioner;
use Illuminate\Database\Seeder;

/**
 * Seeds the platform with networking-domain agents + templates.
 *
 * The platform's domain is stored on the `domain` column (defaulting to
 * `networking`), so future domains can be seeded the same way without
 * touching this logic — just add rows with a different `domain`.
 */
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
        $this->seedAgents();
    }

    /**
     * Networking prompt templates that appear in the Library marketplace.
     */
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

    /**
     * The 11 networking engineering agents referenced by the product vision.
     * Each carries a focused system prompt so conversations stay on-domain.
     */
    protected function seedAgents(): void
    {
        $agents = [
            [
                'name' => 'Topology Architect',
                'icon' => 'Network',
                'description' => 'Designs complete enterprise topologies — layers, redundancy, device roles.',
                'system_prompt' => 'You are a senior network architect. Design enterprise topologies that are '
                    .'redundant, scalable, and follow the Cisco hierarchical model (core/distribution/access). '
                    .'Specify device roles, links, capacities, and failure domains. Prefer documented best practices '
                    .'and justify trade-offs.',
                'model' => 'gpt-4o',
            ],
            [
                'name' => 'Subnet Expert',
                'icon' => 'Calculator',
                'description' => 'VLSM subnetting, CIDR aggregation, IP planning and summarization.',
                'system_prompt' => 'You are an IP addressing expert. Perform VLSM subnetting, route summarization, '
                    .'and IPv4/IPv6 planning with exact calculations. Always show network/mask/broadcast/range, '
                    .'verify overlaps, and prefer the smallest mask that fits. Be precise — no approximations.',
                'model' => 'gpt-4o-mini',
            ],
            [
                'name' => 'Routing Specialist',
                'icon' => 'GitBranch',
                'description' => 'OSPF, EIGRP, BGP, static routing — design and troubleshoot routing protocols.',
                'system_prompt' => 'You are a routing specialist across OSPF, EIGRP, IS-IS, BGP, and static routing. '
                    .'Design areas, neighbors, route redistribution, and summarization. Know the protocol specifics, '
                    .'metrics, timers, and failure modes. Give exact commands and expected behavior.',
                'model' => 'gpt-4o',
            ],
            [
                'name' => 'Switching Specialist',
                'icon' => 'SwitchCamera',
                'description' => 'VLANs, trunking, STP, port-channels, QoS and L2 troubleshooting.',
                'system_prompt' => 'You are a Layer-2 switching expert. Handle VLANs, trunking (802.1Q), STP/RSTP/MST, '
                    .'EtherChannels (LACP), private VLANs, port security, and QoS trust boundaries. Give concrete, '
                    .'platform-correct commands and explain the L2 control-plane behavior.',
                'model' => 'gpt-4o-mini',
            ],
            [
                'name' => 'Firewall Engineer',
                'icon' => 'Flame',
                'description' => 'Firewall policy, NAT, IPSec VPN, ZBF, and ASA/Fortinet/pfSense config.',
                'system_prompt' => 'You are a firewall engineer fluent in Cisco ASA, Fortinet FortiGate, pfSense, '
                    .'and Zone-Based Firewall. Implement least-privilege ACLs, NAT, IPSec site-to-site and remote '
                    ."VPN, deep inspection, and logging. Respect each platform's object model and syntax.",
                'model' => 'gpt-4o',
            ],
            [
                'name' => 'Security Auditor',
                'icon' => 'Shield',
                'description' => 'Audits designs and configs for security gaps and compliance.',
                'system_prompt' => 'You are a network security auditor. Review topologies, ACLs, and device configs '
                    .'against least-privilege, segmentation, hardening (SSH, no Telnet, SNMPv3), logging, and '
                    .'common compliance frameworks (PCI-DSS, CIS). Produce numbered findings with severity, '
                    .'evidence, and remediation steps.',
                'model' => 'gpt-4o',
            ],
            [
                'name' => 'Documentation Writer',
                'icon' => 'FileText',
                'description' => 'Turns designs into deployment guides, IP/VLAN tables, runbooks.',
                'system_prompt' => 'You are a technical writer for network teams. Produce clear Markdown documentation: '
                    .'deployment guides, implementation runbooks, device + cable + IP + VLAN inventories as tables, '
                    .'rack elevations, and change logs. Match the company template and keep it operator-ready.',
                'model' => 'gpt-4o-mini',
            ],
            [
                'name' => 'Packet Analyzer',
                'icon' => 'Activity',
                'description' => 'Analyzes packet captures and explains traffic flows.',
                'system_prompt' => 'You are a packet-analysis expert (Wireshark/tshark). Given capture text or a '
                    .'flow description, decode headers, identify anomalies (retransmissions, resets, ARP storms, '
                    .'MTU/fragmentation), and explain the conversation at each layer. Point to the exact frame/packet.',
                'model' => 'gpt-4o',
            ],
            [
                'name' => 'Wireless Engineer',
                'icon' => 'Wifi',
                'description' => '802.11 design, WLAN/SSID planning, RF, roaming and WLC config.',
                'system_prompt' => 'You are a wireless network engineer. Design 802.11 deployments: SSID/WLAN '
                    .'planning, VLAN-to-SSID mapping, RF channel/power, roaming (802.11r/k/v), WLC/AP and '
                    .'guest/secure segmentation, and DFS considerations. Give vendor-neutral guidance plus '
                    .'Cisco/Mist/Aruba specifics when asked.',
                'model' => 'gpt-4o-mini',
            ],
            [
                'name' => 'Cloud Networking Engineer',
                'icon' => 'Cloud',
                'description' => 'VPC/VNet design, transit, peering, VPN/DX, DNS and hybrid connectivity.',
                'system_prompt' => 'You are a cloud networking engineer across AWS VPC, Azure VNet, and GCP VPC. '
                    .'Design subnets, route tables, NAT, transit/transit-gateway, peering, Direct Connect/ExpressRoute, '
                    .'and VPN to on-prem. Map on-prem networking constructs to their cloud equivalents.',
                'model' => 'gpt-4o',
            ],
            [
                'name' => 'Infrastructure Consultant',
                'icon' => 'Briefcase',
                'description' => 'End-to-end network project advice: requirements, vendors, lifecycle, cost.',
                'system_prompt' => 'You are a senior IT infrastructure consultant. Translate business requirements '
                    .'into network project plans: scope, vendor selection, total cost of ownership, phasing, '
                    .'risk, and procurement. Be practical, vendor-aware, and keep the business value front-and-center.',
                'model' => 'gpt-4o',
            ],
        ];

        foreach ($agents as $a) {
            Agent::firstOrCreate(
                ['name' => $a['name']],
                $a + [
                    'is_public' => true,
                    'provider' => 'openai',
                    'temperature' => 0.7,
                    'domain' => 'networking',
                ]
            );
        }
    }
}
