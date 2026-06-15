import { navItemsByPersona } from "../data/navItems";

const FEATURE_PERMISSIONS = {
  admin: {
    segments: { create: true,  edit: true,  delete: true  },
    customer360: { create: true, edit: true, delete: true },
  },
  marketing: {
    segments: { create: true,  edit: true,  delete: false },
    customer360: { create: false, edit: false, delete: false },
  },
  compliance: {
    segments: { create: false, edit: false, delete: false },
  },
};


export function canAccess(persona, sectionId) {
  const items = navItemsByPersona[persona] ?? [];
  return items.some((item) => item.id === sectionId);
}


export function getPermissions(persona, featureId) {
  return (
    FEATURE_PERMISSIONS[persona]?.[featureId] ?? {
      create: false,
      edit: false,
      delete: false,
    }
  );
}


export function getNavItems(persona) {
  return navItemsByPersona[persona] ?? navItemsByPersona.admin;
}
