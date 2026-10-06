import React, { useState } from 'react';
import {
  Save,
  X,
  Plus,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  User,
  Hash,
  Building2,
  Calendar,
  Linkedin,
  Github,
} from 'lucide-react';
import type { Student, StudentUpdateInput } from '../features/students/studentTypes';
import { SkillBadge } from './SkillBadge';

interface StudentFormProps {
  initialStudent: Student;
  onSave: (data: StudentUpdateInput) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
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

const SUGGESTED_SKILLS = [
  'React',
  'TypeScript',
  'Python',
  'FastAPI',
  'Node.js',
  'SQL',
  'Docker',
  'Git',
  'Java',
  'C++',
];

export const StudentForm: React.FC<StudentFormProps> = ({
  initialStudent,
  onSave,
  onCancel,
  isSaving,
  apiError,
}) => {
  const [name, setName] = useState(initialStudent.name || '');
  const [rollNumber, setRollNumber] = useState(initialStudent.roll_number || '');
  const [department, setDepartment] = useState(initialStudent.department || '');
  const [year, setYear] = useState<number>(initialStudent.year || 3);
  const [avatarUrl, setAvatarUrl] = useState(initialStudent.avatar_url || '');
  const [skills, setSkills] = useState<string[]>(initialStudent.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState(initialStudent.linkedin_url || '');
  const [githubUrl, setGithubUrl] = useState(initialStudent.github_url || '');

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Full name is required.';
    } else if (name.trim().length > 100) {
      errors.name = 'Name cannot exceed 100 characters.';
    }

    if (!rollNumber.trim()) {
      errors.rollNumber = 'Roll number is required.';
    } else if (!/^[A-Za-z0-9_\-/]+$/.test(rollNumber.trim())) {
      errors.rollNumber = 'Roll number must be alphanumeric (hyphens/slashes allowed).';
    }

    if (!department.trim()) {
      errors.department = 'Department is required.';
    }

    if (!year || year < 1 || year > 5) {
      errors.year = 'Academic year must be between 1 and 5.';
    }

    if (avatarUrl && avatarUrl.trim()) {
      const v = avatarUrl.trim();
      if (!v.startsWith('http://') && !v.startsWith('https://') && !v.startsWith('/')) {
        errors.avatarUrl = 'Avatar URL must start with http://, https://, or /';
      }
    }

    if (linkedinUrl && linkedinUrl.trim()) {
      const v = linkedinUrl.trim();
      if (!v.startsWith('http://') && !v.startsWith('https://')) {
        errors.linkedinUrl = 'LinkedIn URL must start with http:// or https://';
      }
    }

    if (githubUrl && githubUrl.trim()) {
      const v = githubUrl.trim();
      if (!v.startsWith('http://') && !v.startsWith('https://')) {
        errors.githubUrl = 'GitHub URL must start with http:// or https://';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSkill = (skillToAdd?: string) => {
    const raw = skillToAdd || skillInput;
    const trimmed = raw.trim();
    if (!trimmed) return;

    if (!skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: StudentUpdateInput = {
      name: name.trim(),
      roll_number: rollNumber.trim().toUpperCase(),
      department: department.trim(),
      year: Number(year),
      avatar_url: avatarUrl.trim() || null,
      skills: skills,
      linkedin_url: linkedinUrl.trim() || null,
      github_url: githubUrl.trim() || null,
    };

    await onSave(payload);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="student-form-card"
      aria-label="Edit student profile form"
    >
      <div className="form-header">
        <div className="form-title-group">
          <h2 className="form-title">Edit Student Profile</h2>
          <p className="form-subtitle text-sm text-muted">
            Update student details for FORSEE Nexus recruitment record #{initialStudent.id}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="btn-icon close-form-btn"
          aria-label="Cancel editing"
        >
          <X size={20} />
        </button>
      </div>

      {apiError && (
        <div className="form-alert error-alert" role="alert">
          <AlertCircle size={18} className="alert-icon" />
          <div className="alert-content">
            <strong>Update Failed</strong>
            <p className="text-sm">{apiError}</p>
          </div>
        </div>
      )}

      <div className="form-grid">
        {/* Full Name */}
        <div className="form-group">
          <label htmlFor="student-name" className="form-label">
            <User size={14} className="label-icon" />
            <span>Full Name *</span>
          </label>
          <input
            id="student-name"
            type="text"
            className={`form-input ${validationErrors.name ? 'input-error' : ''}`}
            placeholder="e.g. Aarav Sharma"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (validationErrors.name) setValidationErrors({ ...validationErrors, name: '' });
            }}
            disabled={isSaving}
            required
          />
          {validationErrors.name && (
            <span className="field-error-text text-xs">{validationErrors.name}</span>
          )}
        </div>

        {/* Roll Number */}
        <div className="form-group">
          <label htmlFor="student-roll" className="form-label">
            <Hash size={14} className="label-icon" />
            <span>Roll Number / Reg No *</span>
          </label>
          <input
            id="student-roll"
            type="text"
            className={`form-input ${validationErrors.rollNumber ? 'input-error' : ''}`}
            placeholder="e.g. 2024CS0142"
            value={rollNumber}
            onChange={(e) => {
              setRollNumber(e.target.value.toUpperCase());
              if (validationErrors.rollNumber)
                setValidationErrors({ ...validationErrors, rollNumber: '' });
            }}
            disabled={isSaving}
            required
          />
          {validationErrors.rollNumber && (
            <span className="field-error-text text-xs">{validationErrors.rollNumber}</span>
          )}
        </div>

        {/* Department */}
        <div className="form-group">
          <label htmlFor="student-dept" className="form-label">
            <Building2 size={14} className="label-icon" />
            <span>Department *</span>
          </label>
          <input
            id="student-dept"
            type="text"
            list="department-options"
            className={`form-input ${validationErrors.department ? 'input-error' : ''}`}
            placeholder="e.g. Computer Science & Engineering"
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              if (validationErrors.department)
                setValidationErrors({ ...validationErrors, department: '' });
            }}
            disabled={isSaving}
            required
          />
          <datalist id="department-options">
            {COMMON_DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept} />
            ))}
          </datalist>
          {validationErrors.department && (
            <span className="field-error-text text-xs">{validationErrors.department}</span>
          )}
        </div>

        {/* Year */}
        <div className="form-group">
          <label htmlFor="student-year" className="form-label">
            <Calendar size={14} className="label-icon" />
            <span>College Year (1 to 5) *</span>
          </label>
          <select
            id="student-year"
            className={`form-select ${validationErrors.year ? 'input-error' : ''}`}
            value={year}
            onChange={(e) => {
              setYear(Number(e.target.value));
              if (validationErrors.year) setValidationErrors({ ...validationErrors, year: '' });
            }}
            disabled={isSaving}
            required
          >
            <option value={1}>1st Year (Freshman)</option>
            <option value={2}>2nd Year (Sophomore)</option>
            <option value={3}>3rd Year (Junior)</option>
            <option value={4}>4th Year (Senior)</option>
            <option value={5}>5th Year (Dual Degree)</option>
          </select>
          {validationErrors.year && (
            <span className="field-error-text text-xs">{validationErrors.year}</span>
          )}
        </div>
      </div>

      {/* Profile Photo / Avatar URL */}
      <div className="form-group full-width">
        <label htmlFor="student-avatar" className="form-label">
          <ImageIcon size={14} className="label-icon" />
          <span>Profile Photo URL</span>
        </label>
        <div className="avatar-input-row">
          <input
            id="student-avatar"
            type="url"
            className={`form-input ${validationErrors.avatarUrl ? 'input-error' : ''}`}
            placeholder="https://images.unsplash.com/... or direct image URL"
            value={avatarUrl}
            onChange={(e) => {
              setAvatarUrl(e.target.value);
              if (validationErrors.avatarUrl)
                setValidationErrors({ ...validationErrors, avatarUrl: '' });
            }}
            disabled={isSaving}
          />
          {avatarUrl && (
            <div className="avatar-mini-preview" title="Live avatar preview">
              <img
                src={avatarUrl}
                alt="Avatar preview"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
        {validationErrors.avatarUrl && (
          <span className="field-error-text text-xs">{validationErrors.avatarUrl}</span>
        )}
      </div>

      {/* Skills Manager */}
      <div className="form-group full-width">
        <label className="form-label">
          <span>Technical Skills</span>
          <span className="text-muted text-xs">({skills.length} added)</span>
        </label>

        <div className="skill-input-bar">
          <input
            type="text"
            className="form-input"
            placeholder="Type skill and press Enter or Add..."
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddSkill();
              }
            }}
            disabled={isSaving}
          />
          <button
            type="button"
            onClick={() => handleAddSkill()}
            disabled={!skillInput.trim() || isSaving}
            className="btn btn-secondary add-skill-btn"
          >
            <Plus size={15} />
            <span>Add</span>
          </button>
        </div>

        {/* Selected skills list */}
        {skills.length > 0 && (
          <div className="selected-skills-container">
            {skills.map((skill) => (
              <SkillBadge
                key={skill}
                skill={skill}
                onRemove={() => handleRemoveSkill(skill)}
              />
            ))}
          </div>
        )}

        {/* Quick add suggestions */}
        <div className="suggested-skills-row">
          <span className="text-xs text-muted">Suggestions:</span>
          {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).slice(0, 6).map((suggested) => (
            <button
              key={suggested}
              type="button"
              onClick={() => handleAddSkill(suggested)}
              className="quick-chip-btn text-xs"
              disabled={isSaving}
            >
              +{suggested}
            </button>
          ))}
        </div>
      </div>

      {/* Social Links */}
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="student-linkedin" className="form-label">
            <Linkedin size={14} className="label-icon" />
            <span>LinkedIn URL</span>
          </label>
          <input
            id="student-linkedin"
            type="url"
            className={`form-input ${validationErrors.linkedinUrl ? 'input-error' : ''}`}
            placeholder="https://linkedin.com/in/username"
            value={linkedinUrl}
            onChange={(e) => {
              setLinkedinUrl(e.target.value);
              if (validationErrors.linkedinUrl)
                setValidationErrors({ ...validationErrors, linkedinUrl: '' });
            }}
            disabled={isSaving}
          />
          {validationErrors.linkedinUrl && (
            <span className="field-error-text text-xs">{validationErrors.linkedinUrl}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="student-github" className="form-label">
            <Github size={14} className="label-icon" />
            <span>GitHub URL</span>
          </label>
          <input
            id="student-github"
            type="url"
            className={`form-input ${validationErrors.githubUrl ? 'input-error' : ''}`}
            placeholder="https://github.com/username"
            value={githubUrl}
            onChange={(e) => {
              setGithubUrl(e.target.value);
              if (validationErrors.githubUrl)
                setValidationErrors({ ...validationErrors, githubUrl: '' });
            }}
            disabled={isSaving}
          />
          {validationErrors.githubUrl && (
            <span className="field-error-text text-xs">{validationErrors.githubUrl}</span>
          )}
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="form-actions-bar">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="btn btn-secondary cancel-btn"
        >
          <X size={16} />
          <span>Cancel</span>
        </button>

        <button
          type="submit"
          disabled={isSaving}
          className="btn btn-primary save-btn"
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
