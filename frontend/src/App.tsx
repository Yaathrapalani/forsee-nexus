import React, { useState, useEffect, useCallback, useTransition } from 'react';
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Users,
  Plus,
  RefreshCw,
} from 'lucide-react';
import type {
  Student,
  StudentCreateInput,
  StudentUpdateInput,
  StudentListFilters,
} from './features/students/studentTypes';
import { studentApi } from './features/students/studentApi';
import { Navbar } from './components/Navbar';

import { StudentForm } from './components/StudentForm';
import { StudentManagementModal } from './components/StudentManagementModal';
import { DirectoryBar } from './components/DirectoryBar';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { WireframeChamber } from './components/WireframeChamber';
import { StudentBookStack } from './components/StudentBookStack';

export const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Status flags
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);

  // Feedback notifications
  const [apiError, setApiError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Directory Filters & Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deleteTargetStudent, setDeleteTargetStudent] = useState<Student | null>(null);

  const [, startTransition] = useTransition();

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
      const filters: StudentListFilters = {};
      if (selectedDepartment) filters.department = selectedDepartment;
      if (selectedYear) filters.year = Number(selectedYear);
      if (searchQuery.trim()) filters.q = searchQuery.trim();

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
          : 'Unable to reach FORSEE student records server. Please verify backend is running.';
      setApiError(msg);
    }
  }, [selectedDepartment, selectedYear, searchQuery, selectedStudentId]);

  // Initial load
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
    showToast('Student directory refreshed');
  };

  const handleSelectStudent = (id: number) => {
    setSelectedStudentId(id);
    setIsEditMode(false);
    setApiError(null);
  };

  const handleSearchChange = (q: string) => {
    startTransition(() => {
      setSearchQuery(q);
    });
  };

  const handleDepartmentChange = (dept: string) => {
    setSelectedDepartment(dept);
    setIsEditMode(false);
  };

  const handleYearChange = (yr: string) => {
    setSelectedYear(yr);
    setIsEditMode(false);
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
      showToast(`Student profile '${updated.name}' updated successfully`);
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

  const handleInitiateDelete = () => {
    const current = students.find((s) => s.id === selectedStudentId);
    if (!current) return;
    setDeleteTargetStudent(current);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetStudent) return;
    setIsDeleting(true);
    setApiError(null);
    try {
      await studentApi.delete(deleteTargetStudent.id);
      showToast(`Student record '${deleteTargetStudent.name}' deleted.`);
      const remaining = students.filter((s) => s.id !== deleteTargetStudent.id);
      setStudents(remaining);
      setSelectedStudentId(remaining.length > 0 ? remaining[0].id : null);
      setIsDeleteModalOpen(false);
      setDeleteTargetStudent(null);
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
      showToast(`Student '${created.name}' registered successfully`);
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
      {/* Core Architectural 3D Perspective Wireframe Chamber */}
      <WireframeChamber interactive={true} />

      {/* Navigation Header */}
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
          <CheckCircle2 size={15} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main Application Container */}
      <main className="main-content-container">
        {/* Global Connection / Validation Error Banner */}
        {apiError && !isEditMode && (
          <div className="global-error-banner" role="alert">
            <AlertCircle size={18} className="error-icon" />
            <div className="error-body">
              <strong>Server Communication Notice</strong>
              <p className="text-sm">{apiError}</p>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="btn btn-secondary btn-sm retry-btn"
            >
              <RefreshCw size={13} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Curated College Student Directory Controls */}
        <DirectoryBar
          students={students}
          selectedStudentId={selectedStudentId}
          onSelectStudent={handleSelectStudent}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          selectedDepartment={selectedDepartment}
          onDepartmentChange={handleDepartmentChange}
          selectedYear={selectedYear}
          onYearChange={handleYearChange}
        />

        {/* Active Profile & Book Stack Viewport */}
        <div className="content-viewport">
          {isLoading ? (
            <div className="loading-state-box" aria-live="polite">
              <Loader2 size={32} className="animate-spin text-primary" />
              <p className="loading-text mt-2 text-sm text-muted">
                Loading student records from database...
              </p>
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
              <StudentBookStack
                students={students}
                selectedStudentId={selectedStudentId}
                onSelectStudent={handleSelectStudent}
                onEdit={() => {
                  setApiError(null);
                  setIsEditMode(true);
                }}
                onDelete={handleInitiateDelete}
                isDeleting={isDeleting}
              />
            )
          ) : (
            <div className="empty-state-box">
              <Users size={40} className="empty-icon text-muted" />
              <h2 className="empty-title">No Matching Student Records</h2>
              <p className="empty-desc text-muted">
                {searchQuery || selectedDepartment || selectedYear
                  ? 'No students found matching your search and filter criteria. Try clearing filters.'
                  : 'Get started by creating your first student profile.'}
              </p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="btn btn-primary mt-4"
              >
                <Plus size={15} />
                <span>Add Student Record</span>
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

      {/* Safe Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        student={deleteTargetStudent}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteTargetStudent(null);
        }}
      />
    </div>
  );
};

export default App;
