import React, { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Users,
  Filter,
  Plus,
  RefreshCw,
} from 'lucide-react';
import type { Student, StudentCreateInput, StudentUpdateInput } from './features/students/studentTypes';
import { studentApi } from './features/students/studentApi';
import { Navbar } from './components/Navbar';
import { StudentCard } from './components/StudentCard';
import { StudentForm } from './components/StudentForm';
import { StudentManagementModal } from './components/StudentManagementModal';

export const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Status & loading flags
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);

  // Feedback alerts
  const [apiError, setApiError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filters
  const [deptFilter, setDeptFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const showToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  const checkHealth = useCallback(async () => {
    try {
      await studentApi.getHealth();
      setBackendHealthy(true);
    } catch {
      setBackendHealthy(false);
    }
  }, []);

  const loadStudents = useCallback(async (preferredId?: number) => {
    try {
      setApiError(null);
      const filters: { department?: string; year?: number } = {};
      if (deptFilter) filters.department = deptFilter;
      if (yearFilter) filters.year = Number(yearFilter);

      const list = await studentApi.list(filters);
      setStudents(list);

      if (list.length > 0) {
        if (preferredId && list.some((s) => s.id === preferredId)) {
          setSelectedStudentId(preferredId);
        } else if (!selectedStudentId || !list.some((s) => s.id === selectedStudentId)) {
          setSelectedStudentId(list[0].id);
        }
      } else {
        setSelectedStudentId(null);
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'detail' in err
          ? (err as { detail: string }).detail
          : 'Failed to load students from server. Please verify backend is running.';
      setApiError(msg);
    }
  }, [deptFilter, yearFilter, selectedStudentId]);

  useEffect(() => {
    let isSubscribed = true;
    const runInit = async () => {
      await checkHealth();
      await loadStudents();
      if (isSubscribed) {
        setIsLoading(false);
      }
    };
    runInit();
    return () => {
      isSubscribed = false;
    };
  }, [checkHealth, loadStudents]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await checkHealth();
    await loadStudents(selectedStudentId || undefined);
    setIsRefreshing(false);
    showToast('Records refreshed successfully');
  };

  const handleSelectStudent = (id: number) => {
    setSelectedStudentId(id);
    setIsEditMode(false);
    setApiError(null);
  };

  const handleSaveStudent = async (data: StudentUpdateInput) => {
    if (!selectedStudentId) return;
    setIsSaving(true);
    setApiError(null);
    try {
      const updated = await studentApi.update(selectedStudentId, data);
      setStudents((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
      setIsEditMode(false);
      showToast(`Student profile '${updated.name}' updated successfully!`);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'detail' in err
          ? (err as { detail: string }).detail
          : 'Failed to save student profile.';
      setApiError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudentId) return;
    const current = students.find((s) => s.id === selectedStudentId);
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${current?.name || 'this student'}? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    setApiError(null);
    try {
      await studentApi.delete(selectedStudentId);
      showToast('Student deleted successfully.');
      const remaining = students.filter((s) => s.id !== selectedStudentId);
      setStudents(remaining);
      setSelectedStudentId(remaining.length > 0 ? remaining[0].id : null);
      setIsEditMode(false);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'detail' in err
          ? (err as { detail: string }).detail
          : 'Failed to delete student.';
      setApiError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateStudent = async (data: StudentCreateInput) => {
    setIsCreating(true);
    setApiError(null);
    try {
      const created = await studentApi.create(data);
      setStudents([created, ...students]);
      setSelectedStudentId(created.id);
      setIsCreateModalOpen(false);
      setIsEditMode(false);
      showToast(`New student '${created.name}' created successfully!`);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'detail' in err
          ? (err as { detail: string }).detail
          : 'Failed to create student.';
      setApiError(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const currentStudent = students.find((s) => s.id === selectedStudentId) || null;

  return (
    <div className="nexus-app-layout">
      {/* Navbar */}
      <Navbar
        backendHealthy={backendHealthy}
        onRefresh={handleRefresh}
        onOpenCreateModal={() => {
          setApiError(null);
          setIsCreateModalOpen(true);
        }}
        isRefreshing={isRefreshing}
      />

      {/* Toast Notification */}
      {successToast && (
        <div className="toast-notification success-toast" role="status">
          <CheckCircle2 size={16} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="main-content-container">
        {/* API Failure Global Alert */}
        {apiError && !isEditMode && (
          <div className="global-error-banner" role="alert">
            <AlertCircle size={20} className="error-icon" />
            <div className="error-body">
              <strong>Connection or Validation Error</strong>
              <p className="text-sm">{apiError}</p>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="btn btn-secondary btn-sm retry-btn"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Toolbar: Student Switcher and Filtering */}
        <div className="nexus-toolbar">
          <div className="toolbar-left">
            <div className="students-selector-group">
              <Users size={16} className="text-muted" />
              <label htmlFor="student-selector" className="sr-only">
                Select Active Student
              </label>
              <select
                id="student-selector"
                className="student-select-dropdown"
                value={selectedStudentId || ''}
                onChange={(e) => handleSelectStudent(Number(e.target.value))}
                disabled={students.length === 0}
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.roll_number}) — {s.department}
                  </option>
                ))}
                {students.length === 0 && <option value="">No students available</option>}
              </select>
            </div>

            <span className="student-count-pill text-xs">
              {students.length} {students.length === 1 ? 'Record' : 'Records'}
            </span>
          </div>

          <div className="toolbar-right">
            <div className="filter-group">
              <Filter size={14} className="text-muted" />
              <input
                type="text"
                placeholder="Filter department..."
                className="filter-input text-xs"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              />
              <select
                className="filter-select text-xs"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option value="">All Years</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
                <option value="5">Year 5</option>
              </select>
            </div>
          </div>
        </div>

        {/* View / Edit Mode Rendering */}
        <div className="content-viewport">
          {isLoading ? (
            <div className="loading-state-box" aria-live="polite">
              <Loader2 size={36} className="animate-spin text-primary" />
              <p className="loading-text">Loading student identity records from FORSEE Nexus...</p>
            </div>
          ) : currentStudent ? (
            isEditMode ? (
              <StudentForm
                initialStudent={currentStudent}
                onSave={handleSaveStudent}
                onCancel={() => {
                  setIsEditMode(false);
                  setApiError(null);
                }}
                isSaving={isSaving}
                apiError={apiError}
              />
            ) : (
              <StudentCard
                student={currentStudent}
                onEdit={() => {
                  setApiError(null);
                  setIsEditMode(true);
                }}
                onDelete={handleDeleteStudent}
                isDeleting={isDeleting}
              />
            )
          ) : (
            <div className="empty-state-box">
              <Users size={48} className="empty-icon text-muted" />
              <h2 className="empty-title">No Student Records Found</h2>
              <p className="empty-desc text-muted">
                {deptFilter || yearFilter
                  ? 'No records match your filter criteria. Try clearing filters.'
                  : 'Get started by creating your first student profile for the FORESE recruitment submission.'}
              </p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="btn btn-primary mt-4"
              >
                <Plus size={16} />
                <span>Create First Student</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Student Creation Modal */}
      <StudentManagementModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateStudent}
        isCreating={isCreating}
        apiError={apiError}
      />
    </div>
  );
};

export default App;
