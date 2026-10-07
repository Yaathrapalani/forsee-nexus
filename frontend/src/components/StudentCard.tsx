import React from 'react';
import {
  Edit3,
  Building2,
  Calendar,
  Hash,
  Clock,
  Trash2,
} from 'lucide-react';
import type { Student } from '../features/students/studentTypes';
import { SkillBadge } from './SkillBadge';
import { SocialLinks } from './SocialLinks';
import { CompletenessIndicator } from './CompletenessIndicator';

interface StudentCardProps {
  student: Student;
  onEdit: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  onEdit,
  onDelete,
  isDeleting = false,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const formatYear = (year: number) => {
    switch (year) {
      case 1:
        return '1st Year (Freshman)';
      case 2:
        return '2nd Year (Sophomore)';
      case 3:
        return '3rd Year (Junior)';
      case 4:
        return '4th Year (Senior)';
      case 5:
        return '5th Year (Dual Degree)';
      default:
        return `Year ${year}`;
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <article className="student-profile-card" aria-label={`Profile card for ${student.name}`}>
      {/* Official FORESE Dossier Masthead Bar */}
      <div className="card-masthead-row">
        <div className="masthead-brand">
          <img
            src="/forese-logo.png"
            alt="FORESE Official Crest"
            className="card-forese-mini-logo"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <span className="masthead-inst">FORESE // SVCE CAREER ARCHIVE</span>
        </div>
        <div className="masthead-seq">
          <span className="masthead-reg">REG-2026</span>
          <span className="masthead-id">DOSSIER #{String(student.id).padStart(4, '0')}</span>
        </div>
      </div>

      <div className="card-banner" />

      <div className="card-body">
        {/* Profile Avatar & Primary Actions */}
        <div className="profile-header-row">
          <div className="avatar-wrapper">
            {student.avatar_url ? (
              <img
                src={student.avatar_url}
                alt={`${student.name}'s profile avatar`}
                className="avatar-image"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                  const fallback = (e.target as HTMLElement).nextElementSibling;
                  if (fallback) (fallback as HTMLElement).style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="avatar-fallback"
              style={{ display: student.avatar_url ? 'none' : 'flex' }}
              aria-hidden="true"
            >
              <span>{getInitials(student.name)}</span>
            </div>
          </div>

          <div className="profile-action-group">
            <button
              type="button"
              onClick={onEdit}
              className="btn btn-primary edit-trigger-btn"
              aria-label="Edit student profile"
            >
              <Edit3 size={15} />
              <span>Edit Profile</span>
            </button>

            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                disabled={isDeleting}
                className="btn btn-danger-outline delete-trigger-btn"
                aria-label="Delete student profile"
                title="Delete student"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Primary Identification */}
        <div className="student-identity-section">
          <div className="name-row">
            <h1 className="student-name">{student.name}</h1>
            <span className="roll-number-badge">
              <Hash size={13} className="text-muted" />
              <span>{student.roll_number}</span>
            </span>
          </div>

          <div className="meta-details-grid">
            <div className="meta-item">
              <Building2 size={16} className="meta-icon" />
              <span className="meta-label">Department:</span>
              <strong className="meta-value">{student.department}</strong>
            </div>

            <div className="meta-item">
              <Calendar size={16} className="meta-icon" />
              <span className="meta-label">Academic Year:</span>
              <strong className="meta-value">{formatYear(student.year)}</strong>
            </div>
          </div>
        </div>

        {/* Profile Completeness Indicator */}
        <CompletenessIndicator student={student} />

        {/* Technical Skills Section */}
        <div className="skills-section">
          <h2 className="section-title">
            <span>Skills & Tech Stack</span>
            <span className="count-badge">{student.skills?.length || 0}</span>
          </h2>
          {student.skills && student.skills.length > 0 ? (
            <div className="skills-badge-list">
              {student.skills.map((skill) => (
                <SkillBadge key={skill} skill={skill} />
              ))}
            </div>
          ) : (
            <p className="empty-state-text text-muted text-sm">
              No skills added yet. Click &apos;Edit Profile&apos; to add technical skills.
            </p>
          )}
        </div>

        {/* Social & Professional Links */}
        <div className="social-section">
          <h2 className="section-title">Professional Links</h2>
          <SocialLinks
            linkedinUrl={student.linkedin_url}
            githubUrl={student.github_url}
          />
        </div>

        {/* Footer Record Metadata */}
        <footer className="card-footer-meta">
          <div className="timestamp-info">
            <Clock size={12} className="meta-icon-mini" />
            <span>Updated: {formatDate(student.updated_at)}</span>
          </div>
          <span className="record-id-meta">Record ID: #{student.id}</span>
        </footer>
      </div>
    </article>
  );
};
