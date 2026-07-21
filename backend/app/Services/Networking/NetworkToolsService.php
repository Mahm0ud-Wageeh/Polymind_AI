<?php

namespace App\Services\Networking;

use InvalidArgumentException;

class NetworkToolsService
{
    /** @param array<int, array{name: string, hosts: int}> $requirements */
    public function planIp(string $cidr, array $requirements = []): array
    {
        [$network, $prefix] = $this->parseCidr($cidr);
        $summary = $this->subnetSummary($network, $prefix);

        if ($requirements === []) {
            return ['summary' => $summary, 'allocations' => [], 'total_waste' => 0];
        }

        usort($requirements, fn (array $left, array $right): int => $right['hosts'] <=> $left['hosts']);
        $cursor = $summary['network_int'];
        $allocations = [];
        $waste = 0;

        foreach ($requirements as $requirement) {
            $needed = $requirement['hosts'] + 2;
            $block = 1;
            while ($block < $needed) {
                $block *= 2;
            }

            $allocationPrefix = 32 - (int) log($block, 2);
            $cursor = (int) (ceil($cursor / $block) * $block);
            $allocation = $this->subnetSummary($cursor, $allocationPrefix);

            if ($allocation['broadcast_int'] > $summary['broadcast_int']) {
                throw new InvalidArgumentException('The requested VLSM allocations do not fit inside the major network.');
            }

            $allocations[] = [
                'name' => $requirement['name'],
                'required_hosts' => $requirement['hosts'],
                'usable_hosts' => $allocation['usable_hosts'],
                'network' => $allocation['network'],
                'cidr' => $allocation['network'].'/'.$allocation['prefix'],
                'mask' => $allocation['mask'],
                'gateway' => $allocation['first_usable'],
                'host_min' => $allocation['first_usable'],
                'host_max' => $allocation['last_usable'],
                'broadcast' => $allocation['broadcast'],
                'waste' => max(0, $allocation['usable_hosts'] - $requirement['hosts']),
            ];
            $waste += max(0, $allocation['usable_hosts'] - $requirement['hosts']);
            $cursor = $allocation['broadcast_int'] + 1;
        }

        return ['summary' => $summary, 'allocations' => $allocations, 'total_waste' => $waste];
    }

    /** @param array<string, mixed> $design */
    public function validate(array $design): array
    {
        $issues = [];
        $vlans = [];
        foreach (($design['vlan_plan'] ?? $design['vlanPlan'] ?? []) as $vlan) {
            $id = $vlan['id'] ?? null;
            if ($id !== null && isset($vlans[$id])) {
                $issues[] = $this->issue('critical', 'vlan', 'Duplicate VLAN ID', "VLAN ID {$id} is assigned more than once.");
            }
            if ($id !== null) {
                $vlans[$id] = true;
            }
        }

        $networks = [];
        foreach (($design['ip_addressing']['subnets'] ?? $design['ipAddressing']['subnets'] ?? []) as $subnet) {
            $value = $subnet['network'] ?? '';
            if (! is_string($value) || $value === '') {
                $issues[] = $this->issue('warning', 'ip_addressing', 'Missing network', 'A subnet has no CIDR network assigned.');

                continue;
            }
            try {
                [$network, $prefix] = $this->parseCidr($value);
                $networks[] = compact('network', 'prefix');
            } catch (InvalidArgumentException) {
                $issues[] = $this->issue('critical', 'ip_addressing', 'Invalid CIDR', "{$value} is not a valid IPv4 CIDR.");
            }
        }

        foreach ($networks as $index => $network) {
            foreach (array_slice($networks, $index + 1) as $other) {
                if ($this->overlaps($network['network'], $network['prefix'], $other['network'], $other['prefix'])) {
                    $issues[] = $this->issue('critical', 'ip_addressing', 'Overlapping subnets', 'Two configured subnets overlap.');
                    break 2;
                }
            }
        }

        $devices = $design['devices'] ?? [];
        $connections = $design['topology']['connections'] ?? [];
        if (is_array($devices) && count($devices) > 1 && $connections === []) {
            $issues[] = $this->issue('warning', 'topology', 'No topology connections', 'Multiple devices are present without any connections.');
        }

        $counts = ['critical' => 0, 'warning' => 0, 'info' => 0];
        foreach ($issues as $issue) {
            $counts[$issue['severity']]++;
        }
        $score = max(0, 100 - $counts['critical'] * 20 - $counts['warning'] * 8 - $counts['info'] * 2);

        return ['issues' => $issues, 'score' => $score, 'summary' => $counts + ['total' => count($issues)]];
    }

    public function diff(string $original, string $updated): array
    {
        $oldLines = preg_split('/\R/', $original) ?: [];
        $newLines = preg_split('/\R/', $updated) ?: [];
        $oldCounts = array_count_values($oldLines);
        $newCounts = array_count_values($newLines);
        $chunks = [];

        foreach ($oldLines as $line) {
            if (($newCounts[$line] ?? 0) > 0) {
                $newCounts[$line]--;
                $chunks[] = ['type' => 'unchanged', 'line' => $line];
            } else {
                $chunks[] = ['type' => 'removed', 'line' => $line];
            }
        }
        foreach ($newLines as $line) {
            if (($oldCounts[$line] ?? 0) > 0) {
                $oldCounts[$line]--;
            } else {
                $chunks[] = ['type' => 'added', 'line' => $line];
            }
        }

        $summary = ['added' => 0, 'removed' => 0, 'unchanged' => 0];
        foreach ($chunks as $chunk) {
            $summary[$chunk['type']]++;
        }

        return ['chunks' => $chunks, 'summary' => $summary];
    }

    /** @param array<string, mixed> $design */
    public function documentation(array $design): array
    {
        $name = (string) ($design['name'] ?? 'Network Design');
        $data = $design['design_data'] ?? $design['designData'] ?? [];
        $summary = (string) ($data['summary'] ?? $design['summary'] ?? '');
        $lines = ["# {$name}", '', '## Executive Summary', '', $summary, '', '## Devices', ''];
        $lines[] = '| Name | Role | Model | Count |';
        $lines[] = '| --- | --- | --- | ---: |';
        foreach (($data['devices'] ?? []) as $device) {
            $lines[] = '| '.($device['name'] ?? '-').' | '.($device['role'] ?? '-').' | '.($device['model_suggestion'] ?? $device['modelSuggestion'] ?? '-').' | '.($device['count'] ?? 1).' |';
        }
        $lines[] = '';
        $lines[] = '## IP Addressing';
        $lines[] = '';
        $lines[] = '| VLAN | Name | Network | Purpose |';
        $lines[] = '| ---: | --- | --- | --- |';
        foreach (($data['ip_addressing']['subnets'] ?? $data['ipAddressing']['subnets'] ?? []) as $subnet) {
            $lines[] = '| '.($subnet['vlan_id'] ?? $subnet['vlanId'] ?? '-').' | '.($subnet['name'] ?? '-').' | '.($subnet['network'] ?? '-').' | '.($subnet['purpose'] ?? '-').' |';
        }

        return ['filename' => str($name)->slug()->append('-documentation.md')->toString(), 'markdown' => implode("\n", $lines)];
    }

    /** @return array{0:int, 1:int} */
    private function parseCidr(string $cidr): array
    {
        [$ip, $prefix] = array_pad(explode('/', trim($cidr), 2), 2, null);
        if (! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) || ! ctype_digit((string) $prefix) || (int) $prefix > 32) {
            throw new InvalidArgumentException('CIDR must contain a valid IPv4 address and prefix length.');
        }

        return [(int) sprintf('%u', ip2long($ip)), (int) $prefix];
    }

    /** @return array<string, int|string> */
    private function subnetSummary(int $address, int $prefix): array
    {
        $mask = $prefix === 0 ? 0 : ((0xFFFFFFFF << (32 - $prefix)) & 0xFFFFFFFF);
        $network = $address & $mask;
        $broadcast = $network | (~$mask & 0xFFFFFFFF);
        $total = $prefix >= 31 ? 2 ** (32 - $prefix) : (2 ** (32 - $prefix));
        $usable = $prefix >= 31 ? $total : max(0, $total - 2);

        return [
            'network' => long2ip($network), 'broadcast' => long2ip($broadcast), 'prefix' => $prefix,
            'mask' => long2ip($mask), 'total_hosts' => $total, 'usable_hosts' => $usable,
            'first_usable' => long2ip($prefix >= 31 ? $network : $network + 1),
            'last_usable' => long2ip($prefix >= 31 ? $broadcast : $broadcast - 1),
            'network_int' => $network, 'broadcast_int' => $broadcast,
        ];
    }

    /** @return array<string, mixed> */
    private function issue(string $severity, string $category, string $title, string $description): array
    {
        return compact('severity', 'category', 'title', 'description') + ['suggestion' => 'Review the affected design input before deployment.'];
    }

    private function overlaps(int $leftNetwork, int $leftPrefix, int $rightNetwork, int $rightPrefix): bool
    {
        $left = $this->subnetSummary($leftNetwork, $leftPrefix);
        $right = $this->subnetSummary($rightNetwork, $rightPrefix);

        return $left['network_int'] <= $right['broadcast_int'] && $right['network_int'] <= $left['broadcast_int'];
    }
}
