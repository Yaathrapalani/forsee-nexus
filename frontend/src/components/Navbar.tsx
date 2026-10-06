import React from 'react';
import { GraduationCap, FileCode, Plus, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

interface NavbarProps {
  backendHealthy: boolean | null;
  onRefresh: () => void;
  onOpenCreateModal: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  backendHealthy,
  onRefresh,
  onOpenCreateModal,
  isRefreshing,
}) => {
  return (
    <header className="navbar-header" role="banner">
      <div className="navbar-container">
        {/* Brand identity */}
        <div className="navbar-brand">
          <div className="brand-icon-box" aria-hidden="true">
            <GraduationCap size={20} className="brand-icon" />
          </div>
          <div className="brand-text-group">
            <span className="brand-name">FORESE</span>
            <span className="brand-subtitle">Student Profile System</span>
          </div>
        </div>

        {/* Right header controls */}
        <div className="navbar-actions">
          {/* Health indicator */}
          <div
            className={`api-status-badge ${
              backendHealthy === true ? 'online' : backendHealthy === false ? 'offline' : 'checking'
            }`}
            title="FastAPI Backend Status"
            role="status"
          >
            {backendHealthy === true ? (
              <>
                <CheckCircle2 size={13} className="status-icon" />
                <span>API Connected</span>
              </>
            ) : backendHealthy === false ? (
              <>
                <AlertTriangle size={13} className="status-icon" />
                <span>API Offline</span>
              </>
            ) : (
              <span>Connecting...</span>
            )}
          </div>

          {/* Swagger docs link */}
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-nav-secondary docs-link"
            title="Open FastAPI Swagger interactive documentation"
          >
            <FileCode size={14} />
            <span>API Docs</span>
          </a>

          {/* Refresh button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn btn-nav-secondary refresh-btn"
            title="Refresh student records from API"
            aria-label="Refresh student records"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          </button>

          {/* Create new student button */}
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="btn btn-primary create-student-btn"
          >
            <Plus size={15} />
            <span>Add Student</span>
          </button>
        </div>
      </div>
    </header>
  );
};
