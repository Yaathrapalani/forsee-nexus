import React from 'react';
import { X } from 'lucide-react';

interface SkillBadgeProps {
  skill: string;
  onRemove?: () => void;
  interactive?: boolean;
}

export const SkillBadge: React.FC<SkillBadgeProps> = ({
  skill,
  onRemove,
  interactive = false,
}) => {
  return (
    <span className={`skill-badge ${interactive ? 'interactive' : ''}`}>
      <span className="skill-dot" />
      <span className="skill-name">{skill}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="skill-remove-btn"
          aria-label={`Remove ${skill} skill`}
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
};
