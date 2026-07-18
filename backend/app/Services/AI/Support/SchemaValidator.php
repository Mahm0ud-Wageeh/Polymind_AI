<?php

namespace App\Services\AI\Support;

/**
 * Lightweight recursive JSON Schema validator.
 *
 * Covers the subset of JSON Schema (draft-07) needed for our AI structured
 * output contracts: required keys, type checks, array item validation, and
 * enum constraints. This avoids pulling in a heavy dependency for what is
 * essentially validating AI-generated JSON against a known shape.
 *
 * Unknown properties are ignored (the schema is the contract; the AI may
 * add extra fields that we silently drop in the controller).
 */
class SchemaValidator
{
    /**
     * Validate an associative array against a JSON Schema.
     *
     * @param  array<string, mixed>  $data  The decoded JSON to validate.
     * @param  array<string, mixed>  $schema  The JSON Schema definition.
     * @return list<string> A list of human-readable error messages (empty = valid).
     */
    public static function validate(array $data, array $schema): array
    {
        $errors = [];

        // --- Required properties ---
        if (isset($schema['required']) && is_array($schema['required'])) {
            foreach ($schema['required'] as $key) {
                if (! array_key_exists($key, $data)) {
                    $errors[] = "Missing required property: '{$key}'.";
                }
            }
        }

        // --- Property validation ---
        $props = $schema['properties'] ?? [];
        foreach ($props as $name => $propSchema) {
            if (! array_key_exists($name, $data)) {
                continue; // optional; handled above for required
            }

            $value = $data[$name];
            $path = "'{$name}'";

            $typeErrors = self::checkType($value, $propSchema, $path);
            array_push($errors, ...$typeErrors);

            // Recurse into objects
            if (is_array($value) && self::isAssociative($value) && isset($propSchema['properties'])) {
                $nested = self::validate($value, $propSchema);
                array_push($errors, ...array_map(fn (string $e) => "{$path}.{$e}", $nested));
            }

            // Recurse into array items
            if (is_array($value) && ! self::isAssociative($value) && isset($propSchema['items'])) {
                foreach ($value as $idx => $item) {
                    if (is_array($item) && isset($propSchema['items']['properties'])) {
                        $nested = self::validate($item, $propSchema['items']);
                        array_push($errors, ...array_map(fn (string $e) => "{$path}[{$idx}].{$e}", $nested));
                    } elseif (! is_array($item) && isset($propSchema['items']['type'])) {
                        $itemErrors = self::checkType($item, $propSchema['items'], "{$path}[{$idx}]");
                        array_push($errors, ...$itemErrors);
                    }
                }
            }
        }

        return $errors;
    }

    /**
     * @return list<string>
     */
    private static function checkType(mixed $value, array $schema, string $path): array
    {
        $errors = [];
        $expectedType = $schema['type'] ?? null;

        if ($expectedType === null) {
            return [];
        }

        $typeMap = [
            'string' => 'is_string',
            'integer' => 'is_int',
            'number' => 'is_float',
            'boolean' => 'is_bool',
            'array' => 'is_array',
            'object' => fn ($v) => is_array($v) && self::isAssociative($v),
        ];

        $check = $typeMap[$expectedType] ?? null;
        if ($check && ! $check($value)) {
            $errors[] = "{$path} should be of type '{$expectedType}', got ".gettype($value).'.';
        }

        // Enum constraint
        if (isset($schema['enum']) && is_array($schema['enum'])) {
            if (! in_array($value, $schema['enum'], true)) {
                $errors[] = "{$path} should be one of: ".implode(', ', $schema['enum']).'.';
            }
        }

        return $errors;
    }

    private static function isAssociative(array $array): bool
    {
        if ($array === []) {
            return false;
        }

        return array_keys($array) !== range(0, count($array) - 1);
    }
}
