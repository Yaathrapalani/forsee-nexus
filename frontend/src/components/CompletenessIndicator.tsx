import React, { useState } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import type { Student } from '../features/students/studentTypes';

interface CompletenessIndicatorProps {
  student: Student;
}

interface ChecklistItem {
  label: string;
  weight: number;
  completed: boolean;
  hint: string;
}

export const CompletenessIndicator: React.FC<CompletenessIndicatorProps> = ({ student }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const checklist: ChecklistItem[] = [
    {
      label: 'Student Name',
      weight: 15,
      completed: Boolean(student.name && student.name.trim().length > 0),
      hint: 'Basic student identity',
    },
    {
      label: 'Roll Number',
      weight: 15,
      completed: Boolean(student.roll_number && student.roll_number.trim().length > 0),
      hint: 'College registration number',
    },
    {
      label: 'Academic Department',
      weight: 15,
      completed: Boolean(student.department && student.department.trim().length > 0),
      hint: 'Branch of study',
    },
    {
      label: 'College Year',
      weight: 15,
      completed: Boolean(student.year && student.year >= 1 && student.year <= 5),
      hint: 'Current academic year',
    },
    {
      label: 'Profile Photo',
      weight: 10,
      completed: Boolean(student.avatar_url && student.avatar_url.trim().length > 0),
      hint: 'Student photo or avatar',
    },
    {
      label: 'Skills (at least 3)',
      weight: 15,
      completed: Boolean(student.skills && student.skills.length >= 3),
      hint: 'Technical skills list',
    },
    {
      label: 'LinkedIn Profile',
      weight: 10,
      completed: Boolean(student.linkedin_url && student.linkedin_url.trim().length > 0),
      hint: 'Professional LinkedIn link',
    },
    {
      label: 'GitHub Profile',
      weight: 5,
      completed: Boolean(student.github_url && student.github_url.trim().length > 0),
      hint: 'GitHub code portfolio',
    },
  ];

  const totalPercentage = checklist.reduce(
    (acc, item) => (item.completed ? acc + item.weight : acc),
    0
  );

  const completedCount = checklist.filter((item) => item.completed).length;

  const getStatusColor = (percent: number) => {
    if (percent === 100) return 'var(--success)';
    if (percent >= 60) return 'var(--primary-light)';
    return 'var(--warning)';
  };

  return (
    <div className="card-section completeness-section" aria-label="Profile information completeness">
      <div className="section-header-row">
        <h2 className="section-heading">PROFILE INFORMATION</h2>
      </div>

      {/* Progress Bar + Percentage */}
      <div className="completeness-bar-container">
        <div
          className="progress-bar-track"
          role="progressbar"
          aria-valuenow={totalPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="progress-bar-fill"
            style={{
              width: `${totalPercentage}%`,
              backgroundColor: getStatusColor(totalPercentage),
            }}
          />
        </div>
        <span
          className="completeness-percentage-val"
          style={{ color: getStatusColor(totalPercentage) }}
        >
          {totalPercentage}%
        </span>
      </div>

      {/* Subtext description & collapsible breakdown toggle */}
      <div className="completeness-status-row">
        <span className="completeness-status-text">
          {totalPercentage === 100
            ? 'All profile fields completed'
            : `${checklist.length - completedCount} of ${checklist.length} fields remaining`}
        </span>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="completeness-toggle-btn"
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <>
              <span>Hide details</span>
              <ChevronUp size={13} />
            </>
          ) : (
            <>
              <span>View details</span>
              <ChevronDown size={13} />
            </>
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="completeness-breakdown-academic">
          {checklist.map((item) => (
            <div
              key={item.label}
              className={`checklist-row ${item.completed ? 'completed' : 'pending'}`}
            >
              {item.completed ? (
                <CheckCircle2 size={14} className="checklist-icon success" />
              ) : (
                <Circle size={14} className="checklist-icon pending" />
              )}
              <div className="checklist-info">
                <span className="checklist-label">{item.label}</span>
                <span className="checklist-hint text-muted">{item.hint}</span>
              </div>
              <span className="checklist-weight">+{item.weight}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
