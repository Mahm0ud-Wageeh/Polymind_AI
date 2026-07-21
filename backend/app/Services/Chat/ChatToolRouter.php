<?php

namespace App\Services\Chat;

use App\Models\Conversation;
use App\Models\NetworkDesign;
use App\Services\AI\AiManager;
use App\Services\AI\Data\ChatRequest;
use App\Services\AI\Schemas\NetworkDesignSchema;
use Illuminate\Support\Str;

/**
 * Router للشات الذكي: بيفهم نيّة الرسالة وبينفّذ القدرة المناسبة،
 * أو بيبدّل الـ system prompt لخبير متخصص.
 */
class ChatToolRouter
{
    public function __construct(private AiManager $ai) {}

    /**
     * @return array{tool:string, content?:string, systemPrompt?:string}|null
     *                                                                        content     => رد جاهز نبثّه زي ما هو (زي التوبولوجي)
     *                                                                        systemPrompt => نكمّل streaming عادي بس ببرومبت خبير
     *                                                                        null        => رسالة عادية، استخدم السلوك الافتراضي
     */
    public function route(string $message, Conversation $conversation): ?array
    {
        return match ($this->classify($message)) {
            'generate_topology' => $this->topology($message, $conversation),
            'generate_config' => ['tool' => 'generate_config', 'systemPrompt' => $this->configPrompt()],
            'plan_ip' => ['tool' => 'plan_ip',         'systemPrompt' => $this->ipPrompt()],
            'troubleshoot' => ['tool' => 'troubleshoot',    'systemPrompt' => $this->troubleshootPrompt()],
            default => null,
        };
    }

    /** نسأل الموديل: الرسالة دي محتاجة قدرة معيّنة ولا شات عادي؟ */
    private function classify(string $message): string
    {
        if (mb_strlen(trim($message)) < 6) {
            return 'chat';
        }

        $schema = [
            'type' => 'object',
            'properties' => [
                'action' => [
                    'type' => 'string',
                    'enum' => ['generate_topology', 'generate_config', 'plan_ip', 'troubleshoot', 'chat'],
                ],
            ],
            'required' => ['action'],
        ];

        $system = 'You are an intent classifier for "Polymind", a networking assistant. '
            .'Read the user message (Arabic or English) and pick EXACTLY ONE action. '
            .'generate_topology: user wants to design/build a network, topology, diagram, or a Packet Tracer lab. '
            .'generate_config: user wants device configuration / CLI (Cisco router, switch, firewall). '
            .'plan_ip: user only wants IP addressing, subnetting or VLAN planning. '
            .'troubleshoot: user describes a problem/error and wants a diagnosis. '
            .'chat: anything else (greetings, general questions, explanations). Respond as JSON only.';

        try {
            $out = $this->ai->structured(
                new ChatRequest(
                    model: config('ai.default_model', 'gpt-4o-mini'),
                    messages: [['role' => 'user', 'content' => $message]],
                    temperature: 0.0,
                    systemPrompt: $system,
                ),
                $schema,
            );

            return is_string($out['action'] ?? null) ? $out['action'] : 'chat';
        } catch (\Throwable) {
            return 'chat'; // لو الفلترة فشلت، منوقفش الرد العادي
        }
    }

    /** القدرة الرئيسية: تصميم شبكة كامل منظّم + مخطط مرئي. */
    private function topology(string $message, Conversation $conversation): array
    {
        $system = 'You are a senior network architect AI. Produce a COMPLETE, structured network design '
            .'from the user requirements. Follow the schema exactly. Be specific with device models, IP '
            .'ranges, VLANs and enterprise best practices.';

        $design = $this->ai->structured(
            new ChatRequest(
                model: config('ai.default_model', 'gpt-4o-mini'),
                messages: [['role' => 'user', 'content' => $message]],
                temperature: 0.3,
                systemPrompt: $system,
            ),
            NetworkDesignSchema::schema(),
        );

        // نحفظه كـ NetworkDesign عشان يظهر في قائمة التصاميم كمان (best-effort)
        try {
            NetworkDesign::create([
                'workspace_id' => $conversation->workspace_id,
                'user_id' => $conversation->user_id,
                'name' => Str::limit($message, 40),
                'prompt' => $message,
                'status' => 'ready',
                'summary' => $design['summary'] ?? '',
                'design_data' => $design,
            ]);
        } catch (\Throwable) {
            // مش مشكلة لو الحفظ فشل، المهم نرجّع النتيجة للشات
        }

        return ['tool' => 'generate_topology', 'content' => $this->renderTopology($design)];
    }

    /** نبني رد Markdown غني (فيه مخطط Mermaid) من التصميم. */
    private function renderTopology(array $d): string
    {
        $fence = str_repeat(chr(96), 3); // ثلاث علامات backtick

        $md = "## 🖧 تصميم الشبكة\n\n";
        $md .= ($d['summary'] ?? '')."\n\n";

        $md .= "### مخطط الشبكة\n\n";
        $md .= $fence."mermaid\n".$this->mermaid($d)."\n".$fence."\n\n";

        if (! empty($d['devices'])) {
            $md .= "### الأجهزة\n\n| # | الجهاز | الدور | الموديل | العدد |\n|---|--------|-------|---------|------|\n";
            foreach ($d['devices'] as $i => $dev) {
                $md .= '| '.($i + 1).' | '.($dev['name'] ?? '-').' | '.($dev['role'] ?? '-')
                    .' | '.($dev['model_suggestion'] ?? '-').' | '.($dev['count'] ?? 1)." |\n";
            }
            $md .= "\n";
        }

        if (! empty($d['vlan_plan'])) {
            $md .= "### الـ VLANs\n\n| VLAN | الاسم | الشبكة | الغرض |\n|------|-------|--------|-------|\n";
            foreach ($d['vlan_plan'] as $v) {
                $md .= '| '.($v['id'] ?? '-').' | '.($v['name'] ?? '-').' | '.($v['subnet'] ?? '-')
                    .' | '.($v['purpose'] ?? '-')." |\n";
            }
            $md .= "\n";
        }

        if (! empty($d['ip_addressing']['subnets'])) {
            $md .= "### خطة الـ IP\n\n";
            if (! empty($d['ip_addressing']['strategy'])) {
                $md .= '*'.$d['ip_addressing']['strategy']."*\n\n";
            }
            $md .= "| الاسم | الشبكة | القناع | VLAN | الغرض |\n|-------|--------|--------|------|-------|\n";
            foreach ($d['ip_addressing']['subnets'] as $s) {
                $md .= '| '.($s['name'] ?? '-').' | '.($s['network'] ?? '-').' | '.($s['mask'] ?? '-')
                    .' | '.($s['vlan_id'] ?? '-').' | '.($s['purpose'] ?? '-')." |\n";
            }
            $md .= "\n";
        }

        if (! empty($d['routing_plan']['protocol'])) {
            $md .= "### التوجيه (Routing)\n\n";
            $md .= '- **البروتوكول:** '.$d['routing_plan']['protocol']."\n";
            if (! empty($d['routing_plan']['areas'])) {
                $md .= '- **Areas:** '.implode(', ', $d['routing_plan']['areas'])."\n";
            }
            if (! empty($d['routing_plan']['details'])) {
                $md .= '- '.$d['routing_plan']['details']."\n";
            }
            $md .= "\n";
        }

        if (! empty($d['security'])) {
            $md .= "### الأمان\n\n";
            if (! empty($d['security']['firewall'])) {
                $md .= '- **Firewall:** '.$d['security']['firewall']."\n";
            }
            if (! empty($d['security']['dmz'])) {
                $md .= '- **DMZ:** '.$d['security']['dmz']."\n";
            }
            foreach (($d['security']['acls'] ?? []) as $acl) {
                $md .= '- ACL: '.$acl."\n";
            }
            $md .= "\n";
        }

        if (! empty($d['deployment_plan'])) {
            $md .= "### خطة التنفيذ\n\n";
            foreach ($d['deployment_plan'] as $p) {
                $md .= '**'.($p['phase'] ?? 'Phase')."**\n";
                foreach (($p['tasks'] ?? []) as $t) {
                    $md .= '- '.$t."\n";
                }
                $md .= "\n";
            }
        }

        $md .= "### تصدير draw.io\n\n";
        $md .= "انسخ الكود، احفظه في ملف اسمه topology.drawio، وافتحه في app.diagrams.net:\n\n";
        $md .= $fence."xml\n".$this->drawio($d)."\n".$fence."\n\n";

        $md .= "> 💡 لعمل نفس الشبكة في Packet Tracer: ابنِ الأجهزة من الجدول، طبّق خطة الـ VLAN/IP، واطلب مني \"اعملي كونفيج\" لأي جهاز.\n";

        return $md;
    }

    /** مخطط Mermaid من الطبقات/الوصلات (fallback على الأجهزة). */
    private function mermaid(array $d): string
    {
        $lines = ['graph TD'];
        $ids = [];
        $idOf = function (string $label) use (&$ids) {
            if (! isset($ids[$label])) {
                $ids[$label] = 'n'.count($ids);
            }

            return $ids[$label];
        };

        $conns = $d['topology']['connections'] ?? [];

        if (! empty($conns)) {
            foreach ($conns as $c) {
                $from = trim((string) ($c['from'] ?? ''));
                $to = trim((string) ($c['to'] ?? ''));
                if ($from === '' || $to === '') {
                    continue;
                }
                $medium = ! empty($c['medium']) ? '|'.$this->clean($c['medium']).'|' : '';
                $lines[] = '  '.$idOf($from).'["'.$this->clean($from).'"] -->'.$medium.' '
                    .$idOf($to).'["'.$this->clean($to).'"]';
            }
        } else {
            $prev = null;
            foreach (($d['devices'] ?? []) as $dev) {
                $label = (string) ($dev['name'] ?? 'device');
                if ($prev !== null) {
                    $lines[] = '  '.$prev.' --> '.$idOf($label).'["'.$this->clean($label).'"]';
                }
                $prev = $idOf($label);
            }
        }

        return count($lines) > 1 ? implode("\n", $lines) : "graph TD\n  n0[\"Network\"]";
    }

    /** draw.io (mxGraph) XML بسيط وصالح من الأجهزة + الوصلات. */
    private function drawio(array $d): string
    {
        $cells = '';
        $x = 40;
        $y = 40;
        $i = 2;
        $pos = [];

        foreach (($d['devices'] ?? []) as $dev) {
            $label = htmlspecialchars((string) ($dev['name'] ?? 'device'), ENT_QUOTES);
            $id = 'd'.$i;
            $pos[(string) ($dev['name'] ?? '')] = $id;
            $cells .= '<mxCell id="'.$id.'" value="'.$label.'" '
                .'style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">'
                .'<mxGeometry x="'.$x.'" y="'.$y.'" width="120" height="50" as="geometry"/></mxCell>';
            $x += 180;
            if ($x > 760) {
                $x = 40;
                $y += 120;
            }
            $i++;
        }

        foreach (($d['topology']['connections'] ?? []) as $c) {
            $s = $pos[(string) ($c['from'] ?? '')] ?? null;
            $t = $pos[(string) ($c['to'] ?? '')] ?? null;
            if (! $s || ! $t) {
                continue;
            }
            $cells .= '<mxCell id="e'.$i.'" style="edgeStyle=orthogonalEdgeStyle;html=1;" '
                .'edge="1" parent="1" source="'.$s.'" target="'.$t.'">'
                .'<mxGeometry relative="1" as="geometry"/></mxCell>';
            $i++;
        }

        return '<mxfile><diagram name="Polymind Topology"><mxGraphModel dx="800" dy="600" '
            .'grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" '
            .'page="1" pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0">'
            .'<root><mxCell id="0"/><mxCell id="1" parent="0"/>'.$cells
            .'</root></mxGraphModel></diagram></mxfile>';
    }

    private function clean(string $s): string
    {
        return trim(str_replace(['"', '[', ']', '|', '\\'], ' ', $s));
    }

    private function configPrompt(): string
    {
        return 'You are a senior Cisco network engineer. Produce clean, production-ready CLI inside '
            .'fenced code blocks labelled bash, one block per device, with a short comment header per '
            .'section. Assume Cisco IOS unless told otherwise. Explain briefly in the user language '
            .'(Arabic if they wrote Arabic) but keep the configuration itself in English.';
    }

    private function ipPrompt(): string
    {
        return 'You are an IP addressing and subnetting expert. Return a clear VLSM/subnet plan as a '
            .'Markdown table (Subnet name, Network, CIDR, Mask, Usable range, Broadcast, VLAN). Show your '
            .'calculation briefly. Reply in the user language (Arabic if they wrote Arabic).';
    }

    private function troubleshootPrompt(): string
    {
        return 'You are a senior network troubleshooting expert. Diagnose the described problem step by '
            .'step: likely causes, the exact show/debug commands to run, and the fix. Use short Markdown '
            .'sections. Reply in the user language (Arabic if they wrote Arabic).';
    }
}
