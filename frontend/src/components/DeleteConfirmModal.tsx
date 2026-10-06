import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import type { Student } from '../features/students/studentTypes';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  student: Student | null;
  isDeleting: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  student,
  isDeleting,
  onConfirm,
  onClose,
}) => {
  if (!isOpen || !student) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div className="modal-container delete-dialog-container">
        <div className="modal-header">
          <div className="modal-title-group text-danger">
            <AlertTriangle size={20} className="text-danger-icon" />
            <h2 id="delete-dialog-title" className="modal-title">
              Confirm Student Deletion
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="btn-icon"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="delete-dialog-body">
          <p className="delete-warning-text">
            Are you sure you want to permanently delete this student record? This action cannot be undone.
          </p>

          <div className="delete-student-summary">
            <div className="summary-field">
              <span className="summary-label">Student Name:</span>
              <strong className="summary-value">{student.name}</strong>
            </div>
            <div className="summary-field">
              <span className="summary-label">Roll Number:</span>
              <strong className="summary-value font-mono">{student.roll_number}</strong>
            </div>
            <div className="summary-field">
              <span className="summary-label">Department:</span>
              <span className="summary-value">{student.department}</span>
            </div>
            <div className="summary-field">
              <span className="summary-label">Record ID:</span>
              <span className="summary-value">#{student.id}</span>
            </div>
          </div>
        </div>

        <div className="form-actions-bar">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="btn btn-danger delete-confirm-btn"
          >
            {isDeleting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Deleting Record...</span>
              </>
            ) : (
              <>
                <Trash2 size={15} />
                <span>Delete Permanently</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
