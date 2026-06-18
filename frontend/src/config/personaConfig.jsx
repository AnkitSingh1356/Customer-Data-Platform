import { navItemsByPersona } from "../data/navItems";

// Static persona-level feature permissions used by admin users who switch personas.
// Non-admin users rely on dynamic RBAC grants from the backend instead.
const FEATURE_PERMISSIONS = {
  admin: {
    segments: { create: true,  edit: true,  delete: true  },
    customer360: { create: true, edit: true, delete: true },
  },
  marketing: {
    // Marketing can build and edit segments but cannot delete them
    segments: { create: true,  edit: true,  delete: false },
    customer360: { create: false, edit: false, delete: false },
  },
  compliance: {
    // Compliance persona has read-only access to segments
    segments: { create: false, edit: false, delete: false },
  },
};

// Returns true when a persona's nav list includes the given page/section id
export function canAccess(persona, sectionId) {
  const items = navItemsByPersona[persona] ?? [];
  return items.some((item) => item.id === sectionId);
}

// Returns the create/edit/delete permission set for a persona+feature pair.
// Defaults to all-false when no explicit entry exists.
export function getPermissions(persona, featureId) {
  return (
    FEATURE_PERMISSIONS[persona]?.[featureId] ?? {
      create: false,
      edit: false,
      delete: false,
    }
  );
}

// Falls back to admin nav when an unknown persona is supplied
export function getNavItems(persona) {
  return navItemsByPersona[persona] ?? navItemsByPersona.admin;
}
