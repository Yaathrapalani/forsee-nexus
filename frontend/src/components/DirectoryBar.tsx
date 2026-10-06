import React from 'react';
import { Search, Users, X } from 'lucide-react';
import type { Student } from '../features/students/studentTypes';

interface DirectoryBarProps {
  students: Student[];
  selectedStudentId: number | null;
  onSelectStudent: (id: number) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedDepartment: string;
  onDepartmentChange: (dept: string) => void;
  selectedYear: string;
  onYearChange: (yr: string) => void;
}

const DEPARTMENTS = [
  { label: 'All Depts', value: '' },
  { label: 'CSE', value: 'Computer Science & Engineering' },
  { label: 'IT', value: 'Information Technology' },
  { label: 'ECE', value: 'Electronics & Communication Engineering' },
  { label: 'EEE', value: 'Electrical & Electronics Engineering' },
  { label: 'MECH', value: 'Mechanical Engineering' },
  { label: 'Civil', value: 'Civil Engineering' },
  { label: 'AI & DS', value: 'Artificial Intelligence & Data Science' },
];

const YEARS = [
  { label: 'All Years', value: '' },
  { label: 'Year 1', value: '1' },
  { label: 'Year 2', value: '2' },
  { label: 'Year 3', value: '3' },
  { label: 'Year 4', value: '4' },
  { label: 'Year 5', value: '5' },
];

export const DirectoryBar: React.FC<DirectoryBarProps> = ({
  students,
  selectedStudentId,
  onSelectStudent,
  searchQuery,
  onSearchChange,
  selectedDepartment,
  onDepartmentChange,
  selectedYear,
  onYearChange,
}) => {
  return (
    <section className="directory-bar-container" aria-label="Student Directory Filters">
      <div className="directory-header-row">
        <div className="directory-title-group">
          <div className="directory-label">
            <Users size={14} className="text-muted" />
            <span>COLLEGE DIRECTORY</span>
          </div>
          <span className="directory-count-badge">
            {students.length} {students.length === 1 ? 'Record' : 'Records'}
          </span>
        </div>

        {/* Quick Search */}
        <div className="directory-search-wrapper">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            className="directory-search-input"
            placeholder="Search by student name or roll number..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search students by name or roll number"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="search-clear-btn"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="directory-filters-bar">
        {/* Department Chips */}
        <div className="filter-chips-row" role="group" aria-label="Department filters">
          <span className="filter-sublabel">Dept:</span>
          {DEPARTMENTS.map((dept) => {
            const isActive = selectedDepartment === dept.value;
            return (
              <button
                key={dept.label}
                type="button"
                onClick={() => onDepartmentChange(dept.value)}
                className={`filter-chip ${isActive ? 'active' : ''}`}
                aria-pressed={isActive}
              >
                {dept.label}
              </button>
            );
          })}
        </div>

        {/* Year Chips */}
        <div className="filter-chips-row" role="group" aria-label="Academic year filters">
          <span className="filter-sublabel">Year:</span>
          {YEARS.map((yr) => {
            const isActive = selectedYear === yr.value;
            return (
              <button
                key={yr.label}
                type="button"
                onClick={() => onYearChange(yr.value)}
                className={`filter-chip ${isActive ? 'active' : ''}`}
                aria-pressed={isActive}
              >
                {yr.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Direct Student Selector Dropdown */}
      <div className="directory-selector-row">
        <label htmlFor="student-index-select" className="sr-only">
          Select Active Student
        </label>
        <select
          id="student-index-select"
          className="directory-select-dropdown"
          value={selectedStudentId || ''}
          onChange={(e) => onSelectStudent(Number(e.target.value))}
          disabled={students.length === 0}
        >
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.roll_number}) — {s.department} (Y{s.year})
            </option>
          ))}
          {students.length === 0 && <option value="">No students matching filter</option>}
        </select>
      </div>
    </section>
  );
};
