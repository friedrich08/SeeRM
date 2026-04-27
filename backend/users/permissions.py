from rest_framework.permissions import BasePermission


MODULE_PERMISSIONS = {
    'clients': {
        'read': {'ADMIN', 'MANAGER', 'SALES', 'FINANCE', 'SUPPORT', 'CLIENT'},
        'write': {'ADMIN', 'MANAGER', 'SALES', 'CLIENT'},
    },
    'pipeline': {
        'read': {'ADMIN', 'MANAGER', 'SALES', 'FINANCE', 'SUPPORT'},
        'write': {'ADMIN', 'MANAGER', 'SALES', 'FINANCE', 'SUPPORT'},
    },
    'finance': {
        'read': {'ADMIN', 'MANAGER', 'SALES', 'FINANCE', 'CLIENT'},
        'write': {'ADMIN', 'FINANCE'},
    },
    'chat': {
        'read': {'ADMIN', 'MANAGER', 'SALES', 'SUPPORT', 'CLIENT'},
        'write': {'ADMIN', 'MANAGER', 'SALES', 'SUPPORT', 'CLIENT'},
    },
    'system': {
        'read': {'ADMIN', 'MANAGER'},
        'write': {'ADMIN', 'MANAGER'},
    },
}


def has_module_access(user, module: str, method: str = 'GET') -> bool:
    if not user or not user.is_authenticated:
        return False
    if getattr(user, 'is_superuser', False):
        return True
    rule = MODULE_PERMISSIONS.get(module)
    if not rule:
        return False
    action = 'read' if method in ('GET', 'HEAD', 'OPTIONS') else 'write'
    return getattr(user, 'role', None) in rule[action]


def build_permissions_payload(user) -> dict:
    payload = {}
    for module in MODULE_PERMISSIONS:
        payload[module] = {
            'read': has_module_access(user, module, 'GET'),
            'write': has_module_access(user, module, 'POST'),
        }
    return payload


class ModulePermission(BasePermission):
    module = ''

    def has_permission(self, request, view):
        return has_module_access(request.user, self.module, request.method)


class ClientsPermission(ModulePermission):
    module = 'clients'


class PipelinePermission(ModulePermission):
    module = 'pipeline'


class FinancePermission(ModulePermission):
    module = 'finance'


class ChatPermission(ModulePermission):
    module = 'chat'


class SystemPermission(ModulePermission):
    module = 'system'
