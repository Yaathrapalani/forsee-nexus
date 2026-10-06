import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Loader2,
  AlertCircle,
  Building2,
  Calendar,
  Hash,
  User,
  Plus,
} from 'lucide-react';
import type { StudentCreateInput } from '../features/students/studentTypes';
import { SkillBadge } from './SkillBadge';

interface StudentManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: StudentCreateInput) => Promise<void>;
  isCreating: boolean;
  apiError?: string | null;
}

const COMMON_DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Artificial Intelligence & Data Science',
];

export const StudentManagementModal: React.FC<StudentManagementModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  isCreating,
  apiError,
}) => {
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [year, setYear] = useState<number>(3);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [skills, setSkills] = useState<string[]>(['React', 'FastAPI']);
  const [skillInput, setSkillInput] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = 'Full name is required.';
    if (!rollNumber.trim()) {
      errors.rollNumber = 'Roll number is required.';
    } else if (!/^[A-Za-z0-9_\-/]+$/.test(rollNumber.trim())) {
      errors.rollNumber = 'Alphanumeric characters only.';
    }
    if (!department.trim()) errors.department = 'Department is required.';
    if (!year || year < 1 || year > 5) errors.year = 'Year must be 1 to 5.';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onCreate({
      name: name.trim(),
      roll_number: rollNumber.trim().toUpperCase(),
      department: department.trim(),
      year: Number(year),
      avatar_url: avatarUrl.trim() || null,
      skills,
      linkedin_url: linkedinUrl.trim() || null,
      github_url: githubUrl.trim() || null,
    });
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-title-group">
            <UserPlus size={20} className="modal-icon" />
            <h2 id="modal-title" className="modal-title">Add New Student</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            aria-label="Close modal"
            disabled={isCreating}
          >
            <X size={18} />
          </button>
        </div>

        {apiError && (
          <div className="form-alert error-alert" role="alert">
            <AlertCircle size={16} />
            <span className="text-sm">{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="new-student-name" className="form-label">
                <User size={13} />
                <span>Name *</span>
              </label>
              <input
                id="new-student-name"
                type="text"
                className={`form-input ${validationErrors.name ? 'input-error' : ''}`}
                placeholder="e.g. Riya Sen"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              {validationErrors.name && (
                <span className="field-error-text text-xs">{validationErrors.name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="new-student-roll" className="form-label">
                <Hash size={13} />
                <span>Roll Number *</span>
              </label>
              <input
                id="new-student-roll"
                type="text"
                className={`form-input ${validationErrors.rollNumber ? 'input-error' : ''}`}
                placeholder="e.g. 2024CS0912"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                required
              />
              {validationErrors.rollNumber && (
                <span className="field-error-text text-xs">{validationErrors.rollNumber}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="new-student-dept" className="form-label">
                <Building2 size={13} />
                <span>Department *</span>
              </label>
              <select
                id="new-student-dept"
                className="form-select"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                {COMMON_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="new-student-year" className="form-label">
                <Calendar size={13} />
                <span>Year (1-5) *</span>
              </label>
              <select
                id="new-student-year"
                className="form-select"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                <option value={1}>1st Year</option>
                <option value={2}>2nd Year</option>
                <option value={3}>3rd Year</option>
                <option value={4}>4th Year</option>
                <option value={5}>5th Year</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="new-student-avatar" className="form-label">
              <span>Avatar / Photo URL</span>
            </label>
            <input
              id="new-student-avatar"
              type="url"
              className="form-input"
              placeholder="https://..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Skills</label>
            <div className="skill-input-bar">
              <input
                type="text"
                className="form-input"
                placeholder="Add skill..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="btn btn-secondary"
              >
                <Plus size={14} />
              </button>
            </div>
            {skills.length > 0 && (
              <div className="selected-skills-container mt-2">
                {skills.map((skill) => (
                  <SkillBadge
                    key={skill}
                    skill={skill}
                    onRemove={() => setSkills(skills.filter((s) => s !== skill))}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="new-student-linkedin" className="form-label">LinkedIn URL</label>
              <input
                id="new-student-linkedin"
                type="url"
                className="form-input"
                placeholder="https://linkedin.com/in/..."
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-student-github" className="form-label">GitHub URL</label>
              <input
                id="new-student-github"
                type="url"
                className="form-input"
                placeholder="https://github.com/..."
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="form-actions-bar">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="btn btn-primary"
            >
              {isCreating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Student</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
