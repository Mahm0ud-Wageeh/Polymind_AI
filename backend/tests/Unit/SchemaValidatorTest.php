<?php

namespace Tests\Unit;

use App\Services\AI\Support\SchemaValidator;
use Tests\TestCase;

class SchemaValidatorTest extends TestCase
{
    private array $simpleSchema = [
        'type' => 'object',
        'required' => ['name', 'role'],
        'properties' => [
            'name' => ['type' => 'string'],
            'role' => ['type' => 'string'],
            'age' => ['type' => 'integer'],
        ],
    ];

    public function test_valid_data_passes(): void
    {
        $errors = SchemaValidator::validate([
            'name' => 'Core Switch',
            'role' => 'distribution',
            'age' => 5,
        ], $this->simpleSchema);

        $this->assertEmpty($errors);
    }

    public function test_optional_fields_are_not_required(): void
    {
        $errors = SchemaValidator::validate([
            'name' => 'Access Point',
            'role' => 'access',
        ], $this->simpleSchema);

        $this->assertEmpty($errors);
    }

    public function test_missing_required_field(): void
    {
        $errors = SchemaValidator::validate([
            'name' => 'Switch',
        ], $this->simpleSchema);

        $this->assertCount(1, $errors);
        $this->assertStringContainsString("'role'", $errors[0]);
    }

    public function test_type_mismatch(): void
    {
        $errors = SchemaValidator::validate([
            'name' => 'Switch',
            'role' => 'core',
            'age' => 'five', // should be integer
        ], $this->simpleSchema);

        $this->assertCount(1, $errors);
        $this->assertStringContainsString('integer', $errors[0]);
    }

    public function test_nested_object_validation(): void
    {
        $schema = [
            'type' => 'object',
            'required' => ['device'],
            'properties' => [
                'device' => [
                    'type' => 'object',
                    'required' => ['name', 'ports'],
                    'properties' => [
                        'name' => ['type' => 'string'],
                        'ports' => ['type' => 'integer'],
                    ],
                ],
            ],
        ];

        // Valid nested
        $errors = SchemaValidator::validate([
            'device' => ['name' => 'Switch', 'ports' => 24],
        ], $schema);
        $this->assertEmpty($errors);

        // Missing nested required
        $errors = SchemaValidator::validate([
            'device' => ['name' => 'Switch'],
        ], $schema);
        $this->assertNotEmpty($errors);
        $this->assertStringContainsString('ports', $errors[0]);
    }

    public function test_array_items_validation(): void
    {
        $schema = [
            'type' => 'object',
            'required' => ['devices'],
            'properties' => [
                'devices' => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'required' => ['name'],
                        'properties' => [
                            'name' => ['type' => 'string'],
                            'count' => ['type' => 'integer'],
                        ],
                    ],
                ],
            ],
        ];

        // Valid items
        $errors = SchemaValidator::validate([
            'devices' => [
                ['name' => 'Switch', 'count' => 5],
                ['name' => 'Router', 'count' => 2],
            ],
        ], $schema);
        $this->assertEmpty($errors);

        // Missing required in item
        $errors = SchemaValidator::validate([
            'devices' => [
                ['count' => 5], // missing 'name'
            ],
        ], $schema);
        $this->assertNotEmpty($errors);
        $this->assertStringContainsString('name', $errors[0]);
    }

    public function test_enum_constraint(): void
    {
        $schema = [
            'type' => 'object',
            'properties' => [
                'role' => [
                    'type' => 'string',
                    'enum' => ['core', 'distribution', 'access'],
                ],
            ],
        ];

        $errors = SchemaValidator::validate(['role' => 'core'], $schema);
        $this->assertEmpty($errors);

        $errors = SchemaValidator::validate(['role' => 'invalid'], $schema);
        $this->assertNotEmpty($errors);
    }

    public function test_empty_array_is_not_associative(): void
    {
        $this->assertEmpty(SchemaValidator::validate([], ['type' => 'object', 'properties' => []]));
    }
}
