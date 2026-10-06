import React, { useState } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
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
      hint: 'Basic identity verification',
    },
    {
      label: 'Roll Number',
      weight: 15,
      completed: Boolean(student.roll_number && student.roll_number.trim().length > 0),
      hint: 'Institutional registration',
    },
    {
      label: 'Academic Department',
      weight: 15,
      completed: Boolean(student.department && student.department.trim().length > 0),
      hint: 'Branch affiliation',
    },
    {
      label: 'College Year',
      weight: 15,
      completed: Boolean(student.year && student.year >= 1 && student.year <= 5),
      hint: 'Academic progression level',
    },
    {
      label: 'Profile Photo',
      weight: 10,
      completed: Boolean(student.avatar_url && student.avatar_url.trim().length > 0),
      hint: 'Visual identity badge',
    },
    {
      label: 'Skills (at least 3)',
      weight: 15,
      completed: Boolean(student.skills && student.skills.length >= 3),
      hint: 'Technical stack readiness',
    },
    {
      label: 'LinkedIn Profile',
      weight: 10,
      completed: Boolean(student.linkedin_url && student.linkedin_url.trim().length > 0),
      hint: 'Professional network presence',
    },
    {
      label: 'GitHub Profile',
      weight: 5,
      completed: Boolean(student.github_url && student.github_url.trim().length > 0),
      hint: 'Code repository portfolio',
    },
  ];

  const totalPercentage = checklist.reduce(
    (acc, item) => (item.completed ? acc + item.weight : acc),
    0
  );

  const getStatusColor = (percent: number) => {
    if (percent >= 80) return 'var(--success)';
    if (percent >= 50) return 'var(--warning)';
    return 'var(--primary)';
  };

  return (
    <div className="completeness-card" aria-label="Profile completeness score">
      <div className="completeness-header">
        <div className="completeness-title-row">
          <div className="completeness-title">
            <Sparkles size={16} className="text-accent" />
            <span>Profile Completeness</span>
          </div>
          <span
            className="completeness-percentage"
            style={{ color: getStatusColor(totalPercentage) }}
          >
            {totalPercentage}%
          </span>
        </div>

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

        <div className="completeness-subtext-row">
          <span className="text-muted text-xs">
            {totalPercentage === 100
              ? 'Complete profile ready for FORESE review'
              : `${100 - totalPercentage}% remaining for comprehensive profile`}
          </span>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="completeness-toggle-btn text-xs"
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <>
                <span>Hide breakdown</span>
                <ChevronUp size={14} />
              </>
            ) : (
              <>
                <span>View checklist</span>
                <ChevronDown size={14} />
              </>
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="completeness-breakdown">
          {checklist.map((item) => (
            <div
              key={item.label}
              className={`checklist-row ${item.completed ? 'completed' : 'pending'}`}
            >
              {item.completed ? (
                <CheckCircle2 size={15} className="checklist-icon success" />
              ) : (
                <Circle size={15} className="checklist-icon pending" />
              )}
              <div className="checklist-info">
                <span className="checklist-label">{item.label}</span>
                <span className="checklist-hint text-xs text-muted">{item.hint}</span>
              </div>
              <span className="checklist-weight text-xs">
                {item.completed ? `+${item.weight}%` : `${item.weight}%`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
