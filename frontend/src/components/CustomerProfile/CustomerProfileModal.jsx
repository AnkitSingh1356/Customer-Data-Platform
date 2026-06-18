import { useEffect, useState } from "react";
import ProfileHeader  from "./ProfileHeader";
import ProfileDetails from "./ProfileDetails";
import ProfileSections from "./ProfileSections";
import apiFetch from "../../services/apiFetch";

const API = `${import.meta.env.VITE_API_BASE_URL}/api/customers`;

// Orchestrates the full customer profile view: fetches data by cdpId and
// composes ProfileHeader, ProfileDetails, and ProfileSections into a modal.
const CustomerProfileModal = ({ cdpId, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(`${API}/${cdpId}/profile`);
      if (!res.ok) throw new Error("Profile not found.");
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, [cdpId]);

  // Re-fetches the full profile after a successful attribute write to stay in sync.
  const handleAddAttribute = async (payload) => {
    try {
      const res = await apiFetch(`${API}/${cdpId}/attributes`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to add attribute.");
      // Re-fetch so the list updates
      await fetchProfile();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="vp-modal-box" onClick={(e) => e.stopPropagation()}>

        {loading && (
          <div className="vp-loading">
            <span className="spinner vp-spinner" />
            Loading profile…
          </div>
        )}

        {!loading && error && (
          <div className="vp-error-state">
            <p className="modal-error">{error}</p>
            <button className="btn-cancel" onClick={onClose}>Close</button>
          </div>
        )}

        {!loading && profile && (
          <>
            <ProfileHeader  profile={profile} onClose={onClose} />
            <div className="vp-divider" />
            <ProfileDetails profile={profile} />
            <ProfileSections profile={profile} onAdd={handleAddAttribute} />
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerProfileModal;
