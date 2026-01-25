// Mock grades data for testing

export const mockGrades = [
  {
    id: "grade-1",
    student_id: "student-1",
    subject_id: "subject-1",
    class_id: "class-1",
    teacher_id: "teacher-1",
    school_id: "school-1",
    school_year_id: "year-1",
    school_semester_id: "semester-1",
    grade: 15.5,
    grade_type: "controle",
    coefficient: 1,
    comment: "Bon travail",
    is_modified: false,
    created_at: "2025-01-15T10:00:00Z",
    updated_at: "2025-01-15T10:00:00Z",
  },
  {
    id: "grade-2",
    student_id: "student-1",
    subject_id: "subject-1",
    class_id: "class-1",
    teacher_id: "teacher-1",
    school_id: "school-1",
    school_year_id: "year-1",
    school_semester_id: "semester-1",
    grade: 18,
    grade_type: "examen",
    coefficient: 2,
    comment: "Excellent",
    is_modified: false,
    created_at: "2025-01-20T14:00:00Z",
    updated_at: "2025-01-20T14:00:00Z",
  },
  {
    id: "grade-3",
    student_id: "student-2",
    subject_id: "subject-1",
    class_id: "class-1",
    teacher_id: "teacher-1",
    school_id: "school-1",
    school_year_id: "year-1",
    school_semester_id: "semester-1",
    grade: 12,
    grade_type: "controle",
    coefficient: 1,
    comment: null,
    is_modified: false,
    created_at: "2025-01-15T10:00:00Z",
    updated_at: "2025-01-15T10:00:00Z",
  },
];

export const mockSubjects = [
  {
    id: "subject-1",
    name: "Mathématiques",
    code: "MATH",
    coefficient: 4,
    school_id: "school-1",
  },
  {
    id: "subject-2",
    name: "Français",
    code: "FR",
    coefficient: 3,
    school_id: "school-1",
  },
];

export const mockClasses = [
  {
    id: "class-1",
    name: "Terminale S1",
    school_id: "school-1",
    school_year_id: "year-1",
    cycle_id: "cycle-1",
    year_level: 12,
  },
  {
    id: "class-2",
    name: "Première S2",
    school_id: "school-1",
    school_year_id: "year-1",
    cycle_id: "cycle-1",
    year_level: 11,
  },
];

export const mockStudents = [
  {
    id: "student-1",
    first_name: "Jean",
    last_name: "Dupont",
    email: "jean.dupont@school.com",
    school_id: "school-1",
  },
  {
    id: "student-2",
    first_name: "Marie",
    last_name: "Martin",
    email: "marie.martin@school.com",
    school_id: "school-1",
  },
];
