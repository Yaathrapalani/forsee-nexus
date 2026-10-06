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
  const hasLinks = Boolean(linkedinUrl || githubUrl);

  if (!hasLinks) {
    return (
      <div className="social-links empty">
        <span className="text-muted text-sm">No social links linked yet</span>
      </div>
    );
  }

  return (
    <div className="social-links-container" aria-label="Student social links">
      {linkedinUrl && (
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="social-btn linkedin-btn"
          aria-label="Visit student's LinkedIn profile"
        >
          <LinkedInIcon size={16} className="social-icon" />
          <span>LinkedIn</span>
          <ExternalLink size={12} className="external-indicator" />
        </a>
      )}

      {githubUrl && (
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="social-btn github-btn"
          aria-label="Visit student's GitHub profile"
        >
          <GitHubIcon size={16} className="social-icon" />
          <span>GitHub</span>
          <ExternalLink size={12} className="external-indicator" />
        </a>
      )}
    </div>
  );
};
