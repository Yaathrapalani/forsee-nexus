import React from 'react';
import { ExternalLink } from 'lucide-react';
import { LinkedInIcon, GitHubIcon } from './BrandIcons';

interface SocialLinksProps {
  linkedinUrl?: string | null;
  githubUrl?: string | null;
}

export const SocialLinks: React.FC<SocialLinksProps> = ({
  linkedinUrl,
  githubUrl,
}) => {
  const hasLinkedIn = Boolean(linkedinUrl && linkedinUrl.trim().length > 0);
  const hasGitHub = Boolean(githubUrl && githubUrl.trim().length > 0);

  return (
    <div className="social-links-grid" aria-label="Professional profiles">
      {hasLinkedIn ? (
        <a
          href={linkedinUrl!}
          target="_blank"
          rel="noopener noreferrer"
          className="social-grid-btn linkedin-btn"
          aria-label="Visit student's LinkedIn profile"
        >
          <LinkedInIcon size={16} className="social-icon" />
          <span className="social-label">LinkedIn</span>
          <ExternalLink size={12} className="external-indicator" />
        </a>
      ) : (
        <div className="social-grid-btn disabled" aria-disabled="true">
          <LinkedInIcon size={16} className="social-icon" />
          <span className="social-label">LinkedIn</span>
          <span className="social-status-tag">Not Set</span>
        </div>
      )}

      {hasGitHub ? (
        <a
          href={githubUrl!}
          target="_blank"
          rel="noopener noreferrer"
          className="social-grid-btn github-btn"
          aria-label="Visit student's GitHub profile"
        >
          <GitHubIcon size={16} className="social-icon" />
          <span className="social-label">GitHub</span>
          <ExternalLink size={12} className="external-indicator" />
        </a>
      ) : (
        <div className="social-grid-btn disabled" aria-disabled="true">
          <GitHubIcon size={16} className="social-icon" />
          <span className="social-label">GitHub</span>
          <span className="social-status-tag">Not Set</span>
        </div>
      )}
    </div>
  );
};
