import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  LayoutGrid,
  CheckCircle2,
  Sparkles,
  ArrowDown,
  ArrowUp,
  Code2,
  Building2,
  Hash,
} from 'lucide-react';
import type { Student } from '../features/students/studentTypes';
import { StudentCard } from './StudentCard';

export interface StudentBookStackProps {
  students: Student[];
  selectedStudentId: number | null;
  onSelectStudent: (id: number) => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export const StudentBookStack: React.FC<StudentBookStackProps> = ({
  students,
  selectedStudentId,
  onSelectStudent,
  onEdit,
  onDelete,
  isDeleting,
}) => {
  // 'stack' = physical Book Stack (facing us), 'expose' = Mac 3-finger slide down grid spread
  const [viewMode, setViewMode] = useState<'stack' | 'expose'>('stack');
  const [dragProgress, setDragProgress] = useState<number>(0);
  const [isDraggingHandle, setIsDraggingHandle] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const threeFingerStartY = useRef<number | null>(null);
  const dragHandleStartY = useRef<number | null>(null);

  // Derive current student index
  const currentIndex = Math.max(
    0,
    students.findIndex((s) => s.id === selectedStudentId)
  );
  const activeStudent = students[currentIndex] || students[0];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getDeptShortCode = (dept: string) => {
    if (dept.includes('Computer Science')) return 'CSE';
    if (dept.includes('Artificial Intelligence')) return 'AI/ML';
    if (dept.includes('Data Science')) return 'DATA';
    if (dept.includes('Mechanical')) return 'MECH';
    if (dept.includes('Electronics') || dept.includes('IoT')) return 'ECE';
    if (dept.includes('Cybersecurity')) return 'CYBER';
    if (dept.includes('Biomedical')) return 'BIOMED';
    if (dept.includes('Aerospace')) return 'AERO';
    if (dept.includes('Cloud') || dept.includes('DevOps')) return 'CLOUD';
    if (dept.includes('Information Technology')) return 'IT';
    if (dept.includes('Electrical')) return 'EEE';
    return dept.split(' ')[0] || 'ENG';
  };

  const calculateCompleteness = (s: Student): number => {
    let score = 0;
    if (s.name?.trim()) score += 20;
    if (s.roll_number?.trim()) score += 20;
    if (s.department?.trim()) score += 15;
    if (s.year) score += 15;
    if (s.skills && s.skills.length > 0) score += 15;
    if (s.linkedin_url?.trim() || s.github_url?.trim()) score += 15;
    return score;
  };

  // Stack navigation handlers
  const handlePrev = useCallback(() => {
    if (students.length === 0) return;
    const nextIdx = (currentIndex - 1 + students.length) % students.length;
    onSelectStudent(students[nextIdx].id);
  }, [currentIndex, students, onSelectStudent]);

  const handleNext = useCallback(() => {
    if (students.length === 0) return;
    const nextIdx = (currentIndex + 1) % students.length;
    onSelectStudent(students[nextIdx].id);
  }, [currentIndex, students, onSelectStudent]);

  // Keyboard navigation for power users & senior evaluators
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setViewMode((prev) => (prev === 'stack' ? 'expose' : 'stack'));
      } else if (e.key === 'e' || e.key === 'E') {
        setViewMode((prev) => (prev === 'stack' ? 'expose' : 'stack'));
      } else if (e.key === 'Escape' && viewMode === 'expose') {
        setViewMode('stack');
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, handlePrev, handleNext]);

  // Touch Gesture Detection: True 3-Finger Drag / Slide Down
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 3) {
        // Average Y coordinate of all 3 fingers
        const avgY =
          (e.touches[0].clientY + e.touches[1].clientY + e.touches[2].clientY) / 3;
        threeFingerStartY.current = avgY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 3 && threeFingerStartY.current !== null) {
        const avgY =
          (e.touches[0].clientY + e.touches[1].clientY + e.touches[2].clientY) / 3;
        const deltaY = avgY - threeFingerStartY.current;

        // 3-Finger slide down in stack mode -> trigger Exposé Spread
        if (viewMode === 'stack' && deltaY > 40) {
          setViewMode('expose');
          threeFingerStartY.current = null;
        }
        // 3-Finger slide up in expose mode -> return to Book Stack
        else if (viewMode === 'expose' && deltaY < -40) {
          setViewMode('stack');
          threeFingerStartY.current = null;
        }
      }
    };

    const handleTouchEnd = () => {
      threeFingerStartY.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [viewMode]);

  // Pointer Drag Handle logic (for mouse / trackpad slide-down gesture)
  const handlePointerDown = (e: React.PointerEvent) => {
    dragHandleStartY.current = e.clientY;
    setIsDraggingHandle(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingHandle || dragHandleStartY.current === null) return;
    const deltaY = e.clientY - dragHandleStartY.current;
    if (viewMode === 'stack') {
      const p = Math.max(0, Math.min(1, deltaY / 120));
      setDragProgress(p);
      if (deltaY > 80) {
        setViewMode('expose');
        setIsDraggingHandle(false);
        setDragProgress(0);
        dragHandleStartY.current = null;
      }
    } else {
      if (deltaY < -60) {
        setViewMode('stack');
        setIsDraggingHandle(false);
        setDragProgress(0);
        dragHandleStartY.current = null;
      }
    }
  };

  const handlePointerUp = () => {
    setIsDraggingHandle(false);
    setDragProgress(0);
    dragHandleStartY.current = null;
  };

  // Up to 3 subordinate cards stacked directly underneath the front card
  const backgroundStackCards = [];
  if (students.length > 1) {
    for (let i = 1; i <= Math.min(3, students.length - 1); i++) {
      const idx = (currentIndex + i) % students.length;
      backgroundStackCards.push({
        student: students[idx],
        depthIndex: i,
      });
    }
  }

  return (
    <div
      ref={containerRef}
      className={`student-bookstack-system ${viewMode === 'expose' ? 'mode-expose' : 'mode-stack'}`}
      aria-label="Student Dossier Book Stack System"
    >
      {/* ====================================================================
          TOP GESTURE BAR / MAC 3-FINGER SLIDE DOWN INTERACTIVE HANDLE
          ==================================================================== */}
      <div className="bookstack-gesture-bar">
        <div
          className={`mac-expose-drag-handle ${isDraggingHandle ? 'dragging' : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={() => setViewMode(viewMode === 'stack' ? 'expose' : 'stack')}
          role="button"
          tabIndex={0}
          aria-label={
            viewMode === 'stack'
              ? 'Three-finger slide down or click to spread all candidates into Exposé view'
              : 'Slide up or click to collapse back into Book Stack'
          }
          title="Trackpad 3-Finger Slide Down · Click · Drag Handle · Space Key"
        >
          <div className="handle-mac-pill">
            <span className="handle-dot red" />
            <span className="handle-dot yellow" />
            <span className="handle-dot green" />
          </div>

          <div className="handle-content">
            {viewMode === 'stack' ? (
              <>
                <ArrowDown size={14} className="handle-arrow-anim" />
                <span className="handle-text">
                  <strong>Three-Finger Slide Down</strong> to View All ({students.length})
                </span>
                <span className="handle-shortcut-hint">[Space / Drag]</span>
              </>
            ) : (
              <>
                <ArrowUp size={14} className="handle-arrow-anim" />
                <span className="handle-text">
                  <strong>Slide Up / Click</strong> to Stack Dossiers
                </span>
                <span className="handle-shortcut-hint">[Esc]</span>
              </>
            )}
          </div>

          {/* Quick Mode Toggle Pills */}
          <div className="view-mode-pill-group" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={`mode-pill-btn ${viewMode === 'stack' ? 'active' : ''}`}
              onClick={() => setViewMode('stack')}
              aria-pressed={viewMode === 'stack'}
            >
              <Layers size={13} />
              <span>Book Stack</span>
            </button>
            <button
              type="button"
              className={`mode-pill-btn ${viewMode === 'expose' ? 'active' : ''}`}
              onClick={() => setViewMode('expose')}
              aria-pressed={viewMode === 'expose'}
            >
              <LayoutGrid size={13} />
              <span>Spread All ({students.length})</span>
            </button>
          </div>
        </div>

        {/* Tactile drag indicator bar */}
        {dragProgress > 0 && (
          <div
            className="drag-progress-indicator-bar"
            style={{ width: `${dragProgress * 100}%` }}
          />
        )}
      </div>

      {/* ====================================================================
          VIEW MODE 1: PHYSICAL BOOK STACK (CARDS FACING US DIRECTLY)
          ==================================================================== */}
      {viewMode === 'stack' && (
        <div className="bookstack-viewport">
          <div className="bookstack-stage">
            {/* Background Layered Cards Peeking Out Directly Facing Us */}
            {backgroundStackCards.map(({ student: bgStudent, depthIndex }) => {
              const deptCode = getDeptShortCode(bgStudent.department);
              const completeness = calculateCompleteness(bgStudent);

              return (
                <div
                  key={bgStudent.id}
                  className={`stack-layer-card stack-layer-${depthIndex}`}
                  style={{
                    transform: `translate3d(0, ${depthIndex * 14}px, ${-depthIndex * 24}px) scale(${
                      1 - depthIndex * 0.035
                    })`,
                    zIndex: 10 - depthIndex,
                  }}
                  onClick={() => onSelectStudent(bgStudent.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onSelectStudent(bgStudent.id);
                    }
                  }}
                  aria-label={`Promote ${bgStudent.name} to front of book stack`}
                >
                  {/* Peeking Spine Tab (Always legible and facing us) */}
                  <div className="stack-layer-tab">
                    <span className="layer-tag">
                      #{String(students.findIndex((s) => s.id === bgStudent.id) + 1).padStart(2, '0')}
                    </span>
                    <span className="layer-name">{bgStudent.name}</span>
                    <span className="layer-dept-badge">{deptCode}</span>
                    <span className="layer-year-badge">Y{bgStudent.year}</span>
                    <span className="layer-metric-badge">{completeness}%</span>
                    <span className="layer-click-hint">Click to bring to front</span>
                  </div>

                  {/* Faint preview backing */}
                  <div className="stack-layer-backing" />
                </div>
              );
            })}

            {/* Top Tab Rack: Physical Book Stack Divider Tabs Peeking out */}
            {backgroundStackCards.length > 0 && (
              <div className="bookstack-tab-rack" aria-label="Stacked Candidate Tabs">
                <span className="tab-rack-label">STACKED BEHIND:</span>
                {backgroundStackCards.map(({ student: bgStudent, depthIndex }) => {
                  const deptCode = getDeptShortCode(bgStudent.department);
                  const completeness = calculateCompleteness(bgStudent);
                  const candidateNum = students.findIndex((s) => s.id === bgStudent.id) + 1;
                  return (
                    <button
                      key={bgStudent.id}
                      type="button"
                      className={`peeking-dossier-tab tab-depth-${depthIndex}`}
                      onClick={() => onSelectStudent(bgStudent.id)}
                      title={`Click to promote ${bgStudent.name} (#${candidateNum}) to front`}
                    >
                      <span className="tab-order-num">#{String(candidateNum).padStart(2, '0')}</span>
                      <span className="tab-candidate-name">{bgStudent.name}</span>
                      <span className="tab-dept-chip">{deptCode}</span>
                      <span className="tab-metric">{completeness}%</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Frontmost Active Student Card (100% Facing Us with Full Fidelity) */}
            <div className="active-card-anchor" style={{ zIndex: 20 }}>
              <StudentCard
                student={activeStudent}
                onEdit={onEdit}
                onDelete={onDelete}
                isDeleting={isDeleting}
              />
            </div>
          </div>

          {/* ====================================================================
              STACK NAVIGATION DECK CONTROLS
              ==================================================================== */}
          <div className="bookstack-navigation-deck">
            <button
              type="button"
              onClick={handlePrev}
              className="deck-nav-btn prev-btn"
              aria-label="Previous Student Dossier in Stack (Left Arrow)"
              title="Previous Dossier [Left Arrow]"
            >
              <ChevronLeft size={16} />
              <span>Prev Dossier</span>
              <kbd className="deck-kbd">←</kbd>
            </button>

            {/* Quick Candidate Dots & Counter */}
            <div className="deck-counter-group">
              <div className="deck-counter-badge">
                <Sparkles size={12} className="counter-icon" />
                <span className="counter-current">
                  {String(currentIndex + 1).padStart(2, '0')}
                </span>
                <span className="counter-sep">/</span>
                <span className="counter-total">
                  {String(students.length).padStart(2, '0')}
                </span>
              </div>

              {/* Quick Jump Dot Pagination */}
              <div className="deck-dot-strip" role="tablist">
                {students.map((s, idx) => {
                  const isCurrent = idx === currentIndex;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="tab"
                      aria-selected={isCurrent}
                      onClick={() => onSelectStudent(s.id)}
                      className={`deck-dot ${isCurrent ? 'active' : ''}`}
                      title={`#${idx + 1}: ${s.name} (${s.department})`}
                      aria-label={`Jump to student #${idx + 1}: ${s.name}`}
                    />
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="deck-nav-btn next-btn"
              aria-label="Next Student Dossier in Stack (Right Arrow)"
              title="Next Dossier [Right Arrow]"
            >
              <kbd className="deck-kbd">→</kbd>
              <span>Next Dossier</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          VIEW MODE 2: MAC EXPOSÉ SPREAD VIEW (ALL CARDS FACING US DIRECTLY)
          ==================================================================== */}
      {viewMode === 'expose' && (
        <div className="expose-spread-viewport">
          <div className="expose-header-banner">
            <div className="expose-header-title">
              <LayoutGrid size={16} className="text-primary" />
              <span>CANDIDATE EXPOSÉ SPREAD</span>
              <span className="expose-count-pill">
                [{students.length} REGISTERED PROFILES]
              </span>
            </div>

            <p className="expose-header-sub">
              Every student dossier spread out facing you directly. Click any card to promote it to the
              primary stack and inspect full credentials.
            </p>

            <button
              type="button"
              onClick={() => setViewMode('stack')}
              className="btn btn-secondary btn-sm collapse-expose-btn"
            >
              <Layers size={13} />
              <span>Collapse into Book Stack (Esc)</span>
            </button>
          </div>

          {/* Grid of ALL Candidate Cards Facing Us */}
          <div className="expose-grid-container" role="grid">
            {students.map((student, index) => {
              const isSelected = student.id === selectedStudentId;
              const deptCode = getDeptShortCode(student.department);
              const completeness = calculateCompleteness(student);

              return (
                <div
                  key={student.id}
                  className={`expose-card ${isSelected ? 'active-selected' : ''}`}
                  onClick={() => {
                    onSelectStudent(student.id);
                    setViewMode('stack');
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onSelectStudent(student.id);
                      setViewMode('stack');
                    }
                  }}
                  aria-label={`Select student dossier for ${student.name}`}
                >
                  {/* Card Index Header Bar */}
                  <div className="expose-card-topbar">
                    <span className="expose-card-index">
                      #{String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="expose-card-dept">{deptCode}</span>
                    <span className="expose-card-year">Y{student.year}</span>
                    {isSelected && (
                      <span className="expose-card-active-pill" title="Currently Selected">
                        <CheckCircle2 size={11} />
                        <span>ACTIVE</span>
                      </span>
                    )}
                  </div>

                  {/* Avatar & Identification */}
                  <div className="expose-card-identity">
                    <div className="expose-avatar-box">
                      {student.avatar_url ? (
                        <img
                          src={student.avatar_url}
                          alt={student.name}
                          className="expose-avatar-img"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                            const fallback = (e.target as HTMLElement).nextElementSibling;
                            if (fallback) (fallback as HTMLElement).style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="expose-avatar-fallback"
                        style={{ display: student.avatar_url ? 'none' : 'flex' }}
                      >
                        {getInitials(student.name)}
                      </div>
                      <div className="expose-status-pip" />
                    </div>

                    <div className="expose-meta-box">
                      <h3 className="expose-name" title={student.name}>
                        {student.name}
                      </h3>
                      <div className="expose-roll">
                        <Hash size={11} className="text-muted" />
                        <span>{student.roll_number}</span>
                      </div>
                      <div className="expose-dept-line" title={student.department}>
                        <Building2 size={11} className="text-muted" />
                        <span>{student.department}</span>
                      </div>
                    </div>
                  </div>

                  {/* Skills Mini-Pills */}
                  <div className="expose-skills-box">
                    <div className="expose-skills-label">
                      <Code2 size={11} className="text-muted" />
                      <span>TECH STACK ({student.skills?.length || 0})</span>
                    </div>
                    <div className="expose-skills-pills">
                      {student.skills?.slice(0, 4).map((sk) => (
                        <span key={sk} className="expose-skill-pill">
                          {sk}
                        </span>
                      ))}
                      {(student.skills?.length || 0) > 4 && (
                        <span className="expose-skill-more">
                          +{(student.skills?.length || 0) - 4}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Completeness Bar */}
                  <div className="expose-completeness-row">
                    <div className="expose-bar-track">
                      <div
                        className="expose-bar-fill"
                        style={{ width: `${completeness}%` }}
                      />
                    </div>
                    <span className="expose-bar-label">{completeness}%</span>
                  </div>

                  {/* Quick Select Trigger */}
                  <div className="expose-card-footer">
                    <span className="expose-open-prompt">
                      {isSelected ? 'Currently Loaded in Stack' : 'Click to Stack & Inspect →'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
