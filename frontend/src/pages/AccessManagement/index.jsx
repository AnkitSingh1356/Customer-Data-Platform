import { useState } from "react";
import UserManagement       from "../../components/AccessManagement/UserManagement";
import RoleManagement       from "../../components/AccessManagement/RoleManagement";
import ModuleManagement     from "../../components/AccessManagement/ModuleManagement";
import PermissionManagement from "../../components/AccessManagement/PermissionManagement";
import MenuManagement       from "../../components/AccessManagement/MenuManagement";
import PageAccessManagement from "../../components/AccessManagement/PageAccessManagement";
import AuditTrail           from "../../components/AccessManagement/AuditTrail";
import "../../styles/access-management.css";

// Ordered tab list drives both the tab bar and the component lookup below
const TABS = [
  { id: "users",       label: "Users" },
  { id: "roles",       label: "Roles" },
  { id: "modules",     label: "Modules" },
  { id: "permissions", label: "Permissions" },
  { id: "menus",       label: "Menu Access" },
  { id: "pages",       label: "Page Access" },
  { id: "audit",       label: "Audit Trail" },
];

// Maps tab IDs to their lazily-rendered components; only the active tab mounts
const TAB_COMPONENTS = {
  users:       UserManagement,
  roles:       RoleManagement,
  modules:     ModuleManagement,
  permissions: PermissionManagement,
  menus:       MenuManagement,
  pages:       PageAccessManagement,
  audit:       AuditTrail,
};

export default function AccessManagementPage() {
  const [activeTab, setActiveTab] = useState("users");
  const ActiveTab = TAB_COMPONENTS[activeTab];

  return (
    <div className="am-page">
      <div className="am-page-header">
        <h2 className="am-page-title">Access Management</h2>
        <p className="am-page-subtitle">
          Manage users, roles, permissions, menus, and page access dynamically.
        </p>
      </div>

      <div className="am-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`am-tab ${activeTab === tab.id ? "am-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="am-tab-content">
        <ActiveTab />
      </div>
    </div>
  );
}
