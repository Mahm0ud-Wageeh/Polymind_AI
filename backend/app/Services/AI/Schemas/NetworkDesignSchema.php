<?php

namespace App\Services\AI\Schemas;

/**
 * JSON Schema describing the structured output of the AI Network Designer.
 *
 * This is the single source of truth for the network design shape, shared by
 * the controller, the service, and provider tests. Each field mirrors what the
 * AI LLM is expected to produce when asked to design a network.
 *
 * @see https://json-schema.org/understanding-json-schema/
 */
class NetworkDesignSchema
{
    /**
     * Return the full JSON Schema array.
     *
     * @return array<string, mixed>
     */
    public static function schema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'summary' => [
                    'type' => 'string',
                    'description' => 'Executive summary of the network design.',
                ],
                'topology' => [
                    'type' => 'object',
                    'description' => 'High-level topology description.',
                    'properties' => [
                        'layers' => [
                            'type' => 'array',
                            'items' => [
                                'type' => 'object',
                                'properties' => [
                                    'name' => ['type' => 'string'],
                                    'description' => ['type' => 'string'],
                                ],
                                'required' => ['name'],
                            ],
                        ],
                        'connections' => [
                            'type' => 'array',
                            'items' => [
                                'type' => 'object',
                                'properties' => [
                                    'from' => ['type' => 'string'],
                                    'to' => ['type' => 'string'],
                                    'medium' => ['type' => 'string'],
                                ],
                                'required' => ['from', 'to'],
                            ],
                        ],
                    ],
                ],
                'devices' => [
                    'type' => 'array',
                    'description' => 'List of device types/roles required.',
                    'items' => [
                        'type' => 'object',
                        'properties' => [
                            'name' => ['type' => 'string'],
                            'role' => ['type' => 'string'],
                            'type' => ['type' => 'string'],
                            'model_suggestion' => ['type' => 'string'],
                            'count' => ['type' => 'integer'],
                            'layer' => ['type' => 'string'],
                        ],
                        'required' => ['name', 'role', 'count'],
                    ],
                ],
                'ip_addressing' => [
                    'type' => 'object',
                    'description' => 'IP addressing plan.',
                    'properties' => [
                        'strategy' => ['type' => 'string'],
                        'subnets' => [
                            'type' => 'array',
                            'items' => [
                                'type' => 'object',
                                'properties' => [
                                    'name' => ['type' => 'string'],
                                    'network' => ['type' => 'string'],
                                    'mask' => ['type' => 'string'],
                                    'vlan_id' => ['type' => 'integer'],
                                    'purpose' => ['type' => 'string'],
                                ],
                                'required' => ['name', 'network'],
                            ],
                        ],
                    ],
                    'required' => ['strategy'],
                ],
                'vlan_plan' => [
                    'type' => 'array',
                    'description' => 'VLAN layout.',
                    'items' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => ['type' => 'integer'],
                            'name' => ['type' => 'string'],
                            'subnet' => ['type' => 'string'],
                            'purpose' => ['type' => 'string'],
                        ],
                        'required' => ['id', 'name'],
                    ],
                ],
                'routing_plan' => [
                    'type' => 'object',
                    'description' => 'Routing protocol design.',
                    'properties' => [
                        'protocol' => ['type' => 'string'],
                        'areas' => [
                            'type' => 'array',
                            'items' => ['type' => 'string'],
                        ],
                        'details' => ['type' => 'string'],
                    ],
                    'required' => ['protocol'],
                ],
                'security' => [
                    'type' => 'object',
                    'description' => 'Security recommendations.',
                    'properties' => [
                        'firewall' => ['type' => 'string'],
                        'dmz' => ['type' => 'string'],
                        'acls' => [
                            'type' => 'array',
                            'items' => ['type' => 'string'],
                        ],
                    ],
                ],
                'deployment_plan' => [
                    'type' => 'array',
                    'description' => 'Phased deployment steps.',
                    'items' => [
                        'type' => 'object',
                        'properties' => [
                            'phase' => ['type' => 'string'],
                            'tasks' => [
                                'type' => 'array',
                                'items' => ['type' => 'string'],
                            ],
                        ],
                        'required' => ['phase', 'tasks'],
                    ],
                ],
                'rack_recommendations' => [
                    'type' => 'array',
                    'description' => 'Rack elevation suggestions.',
                    'items' => [
                        'type' => 'object',
                        'properties' => [
                            'unit' => ['type' => 'string'],
                            'device' => ['type' => 'string'],
                        ],
                    ],
                ],
            ],
            'required' => ['summary', 'topology', 'devices', 'ip_addressing', 'vlan_plan', 'routing_plan', 'deployment_plan'],
        ];
    }
}
