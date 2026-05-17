/** Back-office staff with broad read access (admin, super_admin, employee). */
export function isStaffRole(role: string): boolean {
  return role === 'admin' || role === 'super_admin' || role === 'employee';
}

export function isAdminRole(role: string): boolean {
  return role === 'admin' || role === 'super_admin';
}

/** Can create/update users (role, suspension, etc.). Excludes employee. */
export function canManageUsers(role: string): boolean {
  return role === 'admin' || role === 'super_admin';
}

export function canModerateMerchants(role: string): boolean {
  return role === 'admin' || role === 'super_admin';
}

export function canModerateCatalog(role: string): boolean {
  return role === 'admin' || role === 'super_admin';
}

export function isMerchantRole(role: string): boolean {
  return role === 'merchant';
}
