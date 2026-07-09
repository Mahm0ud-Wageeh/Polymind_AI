<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = [
            'workspace.view', 'workspace.manage',
            'project.view', 'project.manage',
            'conversation.view', 'conversation.manage',
            'agent.view', 'agent.manage',
            'member.invite', 'member.manage',
            'billing.view', 'billing.manage',
            'settings.manage',
        ];

        foreach ($permissions as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        $roles = [
            'owner' => $permissions,
            'admin' => array_diff($permissions, ['billing.manage']),
            'member' => ['workspace.view', 'project.view', 'project.manage', 'conversation.view', 'conversation.manage', 'agent.view'],
            'viewer' => ['workspace.view', 'project.view', 'conversation.view', 'agent.view'],
        ];

        foreach ($roles as $roleName => $rolePerms) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            $role->syncPermissions($rolePerms);
        }
    }
}
