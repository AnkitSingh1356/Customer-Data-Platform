const DeleteConfirmModal = ({ segmentName, onConfirm, onClose, deleting }) => (
  <div className="modal-backdrop" onClick={onClose}>
    <div className="seg-delete-box" onClick={(e) => e.stopPropagation()}>
      <div className="seg-delete-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
      </div>
      <h3 className="seg-delete-title">Delete Segment</h3>
      <p className="seg-delete-msg">
        Are you sure you want to delete <strong>"{segmentName}"</strong>?<br />
        This action cannot be undone.
      </p>
      <div className="seg-delete-actions">
        <button className="btn-cancel" onClick={onClose} disabled={deleting}>Cancel</button>
        <button className="seg-delete-confirm-btn" onClick={onConfirm} disabled={deleting}>
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  </div>
);

export default DeleteConfirmModal;
