





import React, { createContext, useState, useCallback, useMemo, useContext } from 'react';
import { Submission, DepartmentStaffing, SubmissionStatus, Department, Faculty, Announcement } from '../types';
import { INITIAL_SUBMISSIONS, INITIAL_DEPARTMENTS, INITIAL_FACULTIES, MOCK_ANNOUNCEMENTS } from '../constants';

interface DataContextType {
  submissions: Submission[];
  departments: Department[];
  faculties: Faculty[];
  announcements: Announcement[];
  getSubmissionForDepartment: (departmentId: number) => Submission | undefined;
  updateSubmission: (departmentId: number, data: DepartmentStaffing, status: SubmissionStatus, notes?: string) => void;
  updateSubmissionStatus: (departmentId: number, status: SubmissionStatus, notes?: string) => void;
  addDepartment: (name: string, facultyId: number) => { success: boolean; message: string };
  addFaculty: (name: string) => { success: boolean; message: string };
  deleteFaculty: (facultyId: number) => void;
  restoreFaculty: (facultyId: number) => void;
  deleteDepartment: (departmentId: number) => void;
  restoreDepartment: (departmentId: number) => void;
  addAnnouncement: (title: string, content: string, authorName: string) => void;
  deleteAnnouncement: (announcementId: number) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [submissions, setSubmissions] = useState<Submission[]>(INITIAL_SUBMISSIONS);
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [faculties, setFaculties] = useState<Faculty[]>(INITIAL_FACULTIES);
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);

  const getSubmissionForDepartment = useCallback((departmentId: number) => {
    return submissions
      .filter(s => s.departmentId === departmentId)
      .sort((a,b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())[0];
  }, [submissions]);

  const updateSubmission = useCallback((departmentId: number, data: DepartmentStaffing, status: SubmissionStatus, notes?: string) => {
    setSubmissions(prev => {
      const existingIndex = prev.findIndex(s => s.departmentId === departmentId);
      const existingSubmission = prev.find(s => s.departmentId === departmentId);

      const newSubmission: Submission = {
        departmentId,
        data,
        status: status,
        lastUpdated: new Date().toISOString(),
        academicYear: existingSubmission ? existingSubmission.academicYear : '2024-2025',
        notes: notes,
      };

      if (existingIndex > -1) {
        const updatedSubmissions = [...prev];
        const oldSubmission = updatedSubmissions[existingIndex];
        
        updatedSubmissions[existingIndex] = {
            ...oldSubmission,
            data: newSubmission.data,
            status: newSubmission.status,
            lastUpdated: newSubmission.lastUpdated,
            notes: newSubmission.notes !== undefined ? newSubmission.notes : oldSubmission.notes,
        };
        return updatedSubmissions;
      }
      return [...prev, newSubmission];
    });
  }, []);

  const updateSubmissionStatus = useCallback((departmentId: number, status: SubmissionStatus, notes?: string) => {
    setSubmissions(prev => {
        const existingIndex = prev.findIndex(s => s.departmentId === departmentId);
        if (existingIndex > -1) {
            const updatedSubmissions = [...prev];
            const submissionToUpdate = { ...updatedSubmissions[existingIndex] };
            submissionToUpdate.status = status;
            submissionToUpdate.lastUpdated = new Date().toISOString();
            if (notes !== undefined) {
              submissionToUpdate.notes = notes;
            }
            updatedSubmissions[existingIndex] = submissionToUpdate;
            return updatedSubmissions;
        }
        return prev;
    });
  }, []);

  const addFaculty = useCallback((name: string) => {
    if (!name.trim()) {
        return { success: false, message: 'Faculty name cannot be empty.' };
    }
    if (faculties.some(f => f.name.toLowerCase() === name.trim().toLowerCase() && !f.isDeleted)) {
      return { success: false, message: 'A faculty with this name already exists.' };
    }

    const newFaculty: Faculty = {
      id: Math.max(0, ...faculties.map(f => f.id)) + 1,
      name: name.trim(),
      isDeleted: false,
    };
    setFaculties(prev => [...prev, newFaculty]);
    return { success: true, message: 'Faculty added successfully!' };
  }, [faculties]);

  const addDepartment = useCallback((name: string, facultyId: number) => {
    if (!name.trim()) {
        return { success: false, message: 'Department name cannot be empty.' };
    }
    if (departments.some(d => d.name.toLowerCase() === name.trim().toLowerCase() && d.facultyId === facultyId && !d.isDeleted)) {
      return { success: false, message: 'A department with this name already exists in this faculty.' };
    }

    const newDepartment: Department = {
      id: Math.max(0, ...departments.map(d => d.id)) + 1,
      name: name.trim(),
      facultyId,
      isDeleted: false,
    };
    setDepartments(prev => [...prev, newDepartment]);
    return { success: true, message: 'Department added successfully!' };
  }, [departments]);
  
  const deleteFaculty = useCallback((facultyId: number) => {
    setFaculties(prev => prev.map(f => f.id === facultyId ? { ...f, isDeleted: true } : f));
    setDepartments(prev => prev.map(d => d.facultyId === facultyId ? { ...d, isDeleted: true } : d));
  }, []);
  
  const restoreFaculty = useCallback((facultyId: number) => {
    setFaculties(prev => prev.map(f => f.id === facultyId ? { ...f, isDeleted: false } : f));
    // Users might want to restore departments selectively, so we only restore the faculty itself.
    // Let's change this to restore departments as well for a better UX.
    setDepartments(prev => prev.map(d => d.facultyId === facultyId ? { ...d, isDeleted: false } : d));
  }, []);

  const deleteDepartment = useCallback((departmentId: number) => {
    setDepartments(prev => prev.map(d => d.id === departmentId ? { ...d, isDeleted: true } : d));
  }, []);

  const restoreDepartment = useCallback((departmentId: number) => {
    setDepartments(prev => prev.map(d => d.id === departmentId ? { ...d, isDeleted: false } : d));
  }, []);

  const addAnnouncement = useCallback((title: string, content: string, authorName: string) => {
    const newAnnouncement: Announcement = {
        id: Math.max(0, ...announcements.map(a => a.id)) + 1,
        title,
        content,
        authorName,
        timestamp: new Date().toISOString()
    };
    setAnnouncements(prev => [newAnnouncement, ...prev]);
  }, [announcements]);

  const deleteAnnouncement = useCallback((announcementId: number) => {
      setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
  }, []);

  const value = useMemo(() => ({
    submissions,
    departments,
    faculties,
    announcements,
    getSubmissionForDepartment,
    updateSubmission,
    updateSubmissionStatus,
    addDepartment,
    addFaculty,
    deleteFaculty,
    restoreFaculty,
    deleteDepartment,
    restoreDepartment,
    addAnnouncement,
    deleteAnnouncement,
  }), [submissions, departments, faculties, announcements, getSubmissionForDepartment, updateSubmission, updateSubmissionStatus, addDepartment, addFaculty, deleteFaculty, restoreFaculty, deleteDepartment, restoreDepartment, addAnnouncement, deleteAnnouncement]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};