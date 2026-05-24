import { useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";

const TABS = ["Profile", "Security"];

const UserProfileModal = ({ onClose }) => {
const { user, updateProfile, changePassword } = useAuth();

const [tab, setTab] = useState("Profile");
const [editing, setEditing] = useState(false);
const [saving, setSaving] = useState(false);

const [success, setSuccess] = useState("");
const [error, setError] = useState("");

const [showPwd, setShowPwd] = useState(false);

const [avatarPreview, setAvatarPreview] = useState(
user?.avatar_url || ""
);

const [form, setForm] = useState({
full_name: user?.full_name || "",
department: user?.department || "",
phone: user?.phone || "",
bio: user?.bio || "",
address: user?.address || "",
});

const [pwd, setPwd] = useState({
current_password: "",
new_password: "",
confirm: "",
});

const setF = (k, v) =>
setForm((f) => ({ ...f, [k]: v }));

const setP = (k, v) =>
setPwd((p) => ({ ...p, [k]: v }));

const flash = (msg, isError = false) => {
if (isError) {
setError(msg);
setSuccess("");
} else {
setSuccess(msg);
setError("");
}


setTimeout(() => {
  setSuccess("");
  setError("");
}, 4000);

};

const initials = useMemo(() => {
return (
user?.avatar_initials ||
(user?.full_name
? user.full_name
.split(" ")
.map((w) => w[0])
.join("")
.slice(0, 2)
.toUpperCase()
: "U")
);
}, [user]);

const profileCompletion = useMemo(() => {
const checks = [
user?.full_name,
user?.email,
user?.department,
user?.phone,
form.bio,
form.address,
avatarPreview,
];


const complete = checks.filter(Boolean).length;

return Math.round((complete / checks.length) * 100);


}, [user, form, avatarPreview]);

const handleAvatar = (e) => {

  const file = e.target.files?.[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    flash("Only image files are allowed.", true);
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    flash("Image size must be under 2MB.", true);
    return;
  }

  const reader = new FileReader();

  reader.onloadend = () => {
    setAvatarPreview(reader.result);
  };

  reader.readAsDataURL(file);
};
const handleSaveProfile = async () => {

  if (!form.full_name.trim()) {
    flash("Full name is required.", true);
    return;
  }

  const currentData = {
    full_name: user?.full_name || "",
    department: user?.department || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
    address: user?.address || "",
    avatar_url: user?.avatar_url || "",
  };

  const newData = {
    full_name: form.full_name || "",
    department: form.department || "",
    phone: form.phone || "",
    bio: form.bio || "",
    address: form.address || "",
    avatar_url: avatarPreview || "",
  };
  const hasChanges =
    JSON.stringify(currentData) !==
    JSON.stringify(newData);

  if (!hasChanges) {
    flash("No changes detected.");
    setEditing(false);
    return;
  }

  setSaving(true);

  try {

    await updateProfile(newData);

    flash("Profile updated successfully.");

    setEditing(false);

  } catch (e) {

    flash(e.message, true);

  } finally {

    setSaving(false);

  }
};


const handleSavePassword = async () => {
if (!pwd.current_password || !pwd.new_password) {
flash("All fields are required.", true);
return;
}


if (pwd.new_password.length < 8) {
  flash("New password must be at least 8 characters.", true);
  return;
}

if (pwd.new_password !== pwd.confirm) {
  flash("Passwords do not match.", true);
  return;
}

setSaving(true);

try {
  await changePassword({
    current_password: pwd.current_password,
    new_password: pwd.new_password,
  });

  flash("Password updated successfully.");

  setPwd({
    current_password: "",
    new_password: "",
    confirm: "",
  });

} catch (e) {
  flash(e.message, true);

} finally {
  setSaving(false);
}


};

return ( <div className="modal-backdrop" onClick={onClose}>
<div
className="up-modal-box"
onClick={(e) => e.stopPropagation()}
>
    <div className="up-header">

      <div className="profile-avatar-wrapper">

        <div className="profile-avatar-large">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt={user?.full_name}
            />
          ) : (
            <span>{initials}</span>
          )}

          {editing && (
            <label className="avatar-edit-btn">
              ✎
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleAvatar}
              />
            </label>
          )}
        </div>
      </div>

      <div className="up-header-info">
        <h2 className="up-name">
          {user?.full_name || "—"}
        </h2>

        <p className="up-email">
          {user?.email || "—"}
        </p>

        <div className="up-role-row">
          <span className="up-role-badge">
            {user?.role || "admin"}
          </span>

          <span className="up-last-login">
            Last login:{" "}
            {user?.last_login
              ? new Date(user.last_login).toLocaleDateString()
              : "—"}
          </span>
        </div>

        <div className="up-progress-wrap">
          <div className="up-progress-top">
            <span>Profile Completion</span>
            <span>{profileCompletion}%</span>
          </div>

          <div className="up-progress-bar">
            <div
              className="up-progress-fill"
              style={{
                width: `${profileCompletion}%`,
              }}
            />
          </div>
        </div>
      </div>

      <button
        className="modal-close-btn"
        onClick={onClose}
      >
        ✕
      </button>
    </div>

    <div className="up-tabs">
      {TABS.map((t) => (
        <button
          key={t}
          className={`up-tab${
            tab === t ? " up-tab-active" : ""
          }`}
          onClick={() => {
            setTab(t);
            setEditing(false);
            setError("");
            setSuccess("");
          }}
        >
          {t}
        </button>
      ))}
    </div>

    {success && (
      <div className="up-feedback up-feedback-success">
        {success}
      </div>
    )}

    {error && (
      <div className="up-feedback up-feedback-error">
        {error}
      </div>
    )}

    {tab === "Profile" && (
      <div className="up-body">

        {!editing ? (
          <>
            <div className="up-field-grid">

              <div className="up-field">
                <span className="up-field-label">
                  Full Name
                </span>
                <span className="up-field-value">
                  {user?.full_name || "—"}
                </span>
              </div>

              <div className="up-field">
                <span className="up-field-label">
                  Email
                </span>
                <span className="up-field-value">
                  {user?.email || "—"}
                </span>
              </div>

              <div className="up-field">
                <span className="up-field-label">
                  Department
                </span>
                <span className="up-field-value">
                  {user?.department || "—"}
                </span>
              </div>

              <div className="up-field">
                <span className="up-field-label">
                  Phone
                </span>
                <span className="up-field-value">
                  {user?.phone || "—"}
                </span>
              </div>

              <div className="up-field">
                <span className="up-field-label">
                  Address
                </span>
                <span className="up-field-value">
                  {form.address || "—"}
                </span>
              </div>

              <div className="up-field">
                <span className="up-field-label">
                  Joined Platform
                </span>
                <span className="up-field-value">
                {user?.joined_platform || "—"}
                </span>
              </div>

              <div
                className="up-field"
                style={{ gridColumn: "1 / -1" }}
              >
                <span className="up-field-label">
                  About
                </span>

                <span className="up-field-value">
                  {form.bio || "No bio added yet."}
                </span>
              </div>
            </div>

            <div className="up-footer">
              <button
                className="btn-upload"
                onClick={() => setEditing(true)}
              >
                Edit Profile
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="up-edit-grid">

              <div className="up-edit-field">
                <label className="seg-form-label">
                  Full Name *
                </label>

                <input
                  className="seg-form-input"
                  value={form.full_name}
                  onChange={(e) =>
                    setF("full_name", e.target.value)
                  }
                />
              </div>

              <div className="up-edit-field">
                <label className="seg-form-label">
                  Department
                </label>

                <input
                  className="seg-form-input"
                  value={form.department}
                  onChange={(e) =>
                    setF("department", e.target.value)
                  }
                />
              </div>

              <div className="up-edit-field">
                <label className="seg-form-label">
                  Phone
                </label>

                <input
                  className="seg-form-input"
                  value={form.phone}
                  onChange={(e) =>
                    setF("phone", e.target.value)
                  }
                />
              </div>

              <div className="up-edit-field">
                <label className="seg-form-label">
                  Address
                </label>

                <input
                  className="seg-form-input"
                  value={form.address}
                  onChange={(e) =>
                    setF("address", e.target.value)
                  }
                />
              </div>

              <div
                className="up-edit-field"
                style={{ gridColumn: "1 / -1" }}
              >
                <label className="seg-form-label">
                  About
                </label>

                <textarea
                  className="seg-form-input up-textarea"
                  rows="4"
                  value={form.bio}
                  onChange={(e) =>
                    setF("bio", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="up-footer">
              <button
                className="btn-cancel"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                className="btn-upload"
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </>
        )}
      </div>
    )}

    {tab === "Security" && (
      <div className="up-body">

        <p className="up-section-label">
          Change Password
        </p>

        <div className="up-edit-grid">

          <div
            className="up-edit-field"
            style={{ gridColumn: "1 / -1" }}
          >
            <label className="seg-form-label">
              Current Password
            </label>

            <div className="auth-pwd-wrap">
              <input
                className="seg-form-input"
                type={showPwd ? "text" : "password"}
                value={pwd.current_password}
                onChange={(e) =>
                  setP(
                    "current_password",
                    e.target.value
                  )
                }
              />

              <button
                type="button"
                className="auth-pwd-toggle"
                onClick={() =>
                  setShowPwd((v) => !v)
                }
              >
                👁
              </button>
            </div>
          </div>

          <div className="up-edit-field">
            <label className="seg-form-label">
              New Password
            </label>

            <input
              className="seg-form-input"
              type="password"
              placeholder="Min. 8 characters"
              value={pwd.new_password}
              onChange={(e) =>
                setP(
                  "new_password",
                  e.target.value
                )
              }
            />
          </div>

          <div className="up-edit-field">
            <label className="seg-form-label">
              Confirm Password
            </label>

            <input
              className="seg-form-input"
              type="password"
              value={pwd.confirm}
              onChange={(e) =>
                setP("confirm", e.target.value)
              }
            />
          </div>
        </div>

        <div className="up-footer">
          <button
            className="btn-upload"
            onClick={handleSavePassword}
            disabled={saving}
          >
            {saving
              ? "Updating..."
              : "Update Password"}
          </button>
        </div>
      </div>
    )}

  </div>
</div>


);
};

export default UserProfileModal;
