// Data Store - manages all application state and business logic
class DataStore {
  constructor() {
    this.courses = [];
    this.assessments = {};
    this.currentCourseId = null;
    this.initializeData();
  }

  // Initialize with mock data
  initializeData() {
    this.courses = [
      {
        id: 'SOEN287',
        code: 'SOEN 287',
        name: 'Web Programming',
        instructor: 'Dr. John Smith',
        term: 'Winter 2026',
        description: 'Introduction to web development with HTML, CSS, and JavaScript',
        credits: 3,
        createdAt: new Date('2026-01-15'),
      },
      {
        id: 'COMP249',
        code: 'COMP 249',
        name: 'Object-Oriented Programming II',
        instructor: 'Dr. Jane Doe',
        term: 'Winter 2026',
        description: 'Advanced OOP concepts including design patterns and SOLID principles',
        credits: 3,
        createdAt: new Date('2026-01-15'),
      },
      {
        id: 'MATH203',
        code: 'MATH 203',
        name: 'Linear Algebra',
        instructor: 'Prof. Robert Wilson',
        term: 'Winter 2026',
        description: 'Matrices, vectors, eigenvalues, and applications',
        credits: 4,
        createdAt: new Date('2026-01-15'),
      },
    ];

    this.assessments = {
      'SOEN287': [
        {
          id: 'soen287-assign1',
          courseId: 'SOEN287',
          type: 'Assignment',
          title: 'HTML & CSS Basics',
          description: 'Create a personal portfolio website',
          dueDate: new Date('2026-02-20'),
          weight: 10,
          earnedMarks: 18,
          totalMarks: 20,
          status: 'completed',
          createdAt: new Date('2026-01-20'),
        },
        {
          id: 'soen287-assign2',
          courseId: 'SOEN287',
          type: 'Assignment',
          title: 'JavaScript Interactivity',
          description: 'Add dynamic functionality to your portfolio',
          dueDate: new Date('2026-03-10'),
          weight: 15,
          earnedMarks: null,
          totalMarks: 25,
          status: 'pending',
          createdAt: new Date('2026-02-01'),
        },
        {
          id: 'soen287-quiz1',
          courseId: 'SOEN287',
          type: 'Quiz',
          title: 'HTML/CSS Fundamentals Quiz',
          description: 'Online quiz covering HTML tags and CSS selectors',
          dueDate: new Date('2026-02-15'),
          weight: 5,
          earnedMarks: 9,
          totalMarks: 10,
          status: 'completed',
          createdAt: new Date('2026-02-01'),
        },
        {
          id: 'soen287-midterm',
          courseId: 'SOEN287',
          type: 'Exam',
          title: 'Midterm Exam',
          description: 'Comprehensive exam covering first half of course',
          dueDate: new Date('2026-03-15'),
          weight: 25,
          earnedMarks: null,
          totalMarks: 100,
          status: 'pending',
          createdAt: new Date('2026-02-01'),
        },
        {
          id: 'soen287-final',
          courseId: 'SOEN287',
          type: 'Exam',
          title: 'Final Exam',
          description: 'Final comprehensive examination',
          dueDate: new Date('2026-04-20'),
          weight: 25,
          earnedMarks: null,
          totalMarks: 100,
          status: 'pending',
          createdAt: new Date('2026-02-01'),
        },
        {
          id: 'soen287-project',
          courseId: 'SOEN287',
          type: 'Project',
          title: 'Smart Course Companion Project',
          description: 'Build a full-stack web application',
          dueDate: new Date('2026-03-27'),
          weight: 20,
          earnedMarks: null,
          totalMarks: 100,
          status: 'pending',
          createdAt: new Date('2026-01-30'),
        },
      ],
      'COMP249': [
        {
          id: 'comp249-assign1',
          courseId: 'COMP249',
          type: 'Assignment',
          title: 'Design Patterns Implementation',
          description: 'Implement 3 design patterns',
          dueDate: new Date('2026-02-25'),
          weight: 15,
          earnedMarks: 27,
          totalMarks: 30,
          status: 'completed',
          createdAt: new Date('2026-02-01'),
        },
        {
          id: 'comp249-lab1',
          courseId: 'COMP249',
          type: 'Lab',
          title: 'Lab 1: Inheritance & Polymorphism',
          description: 'Practice inheritance and polymorphic behavior',
          dueDate: new Date('2026-02-18'),
          weight: 10,
          earnedMarks: 9,
          totalMarks: 10,
          status: 'completed',
          createdAt: new Date('2026-02-01'),
        },
        {
          id: 'comp249-midterm',
          courseId: 'COMP249',
          type: 'Exam',
          title: 'Midterm Exam',
          description: 'Midterm covering OOP fundamentals',
          dueDate: new Date('2026-03-05'),
          weight: 35,
          earnedMarks: null,
          totalMarks: 100,
          status: 'pending',
          createdAt: new Date('2026-02-01'),
        },
        {
          id: 'comp249-final',
          courseId: 'COMP249',
          type: 'Exam',
          title: 'Final Exam',
          description: 'Final comprehensive examination',
          dueDate: new Date('2026-04-15'),
          weight: 40,
          earnedMarks: null,
          totalMarks: 100,
          status: 'pending',
          createdAt: new Date('2026-02-01'),
        },
      ],
      'MATH203': [
        {
          id: 'math203-assign1',
          courseId: 'MATH203',
          type: 'Assignment',
          title: 'Matrix Operations',
          description: 'Solve matrix equations',
          dueDate: new Date('2026-02-14'),
          weight: 12,
          earnedMarks: 45,
          totalMarks: 50,
          status: 'completed',
          createdAt: new Date('2026-02-01'),
        },
        {
          id: 'math203-assign2',
          courseId: 'MATH203',
          type: 'Assignment',
          title: 'Eigenvalues & Eigenvectors',
          description: 'Find eigenvalues and eigenvectors',
          dueDate: new Date('2026-03-01'),
          weight: 13,
          earnedMarks: null,
          totalMarks: 50,
          status: 'pending',
          createdAt: new Date('2026-02-01'),
        },
        {
          id: 'math203-quiz1',
          courseId: 'MATH203',
          type: 'Quiz',
          title: 'Quiz 1: Vector Spaces',
          description: 'Online quiz on vector spaces',
          dueDate: new Date('2026-02-21'),
          weight: 10,
          earnedMarks: null,
          totalMarks: 20,
          status: 'pending',
          createdAt: new Date('2026-02-01'),
        },
        {
          id: 'math203-final',
          courseId: 'MATH203',
          type: 'Exam',
          title: 'Final Exam',
          description: 'Comprehensive final examination',
          dueDate: new Date('2026-04-25'),
          weight: 65,
          earnedMarks: null,
          totalMarks: 100,
          status: 'pending',
          createdAt: new Date('2026-02-01'),
        },
      ],
    };
  }

  // ===== COURSE METHODS =====
  getCourses() {
    return this.courses;
  }

  getCourseById(courseId) {
    return this.courses.find(c => c.id === courseId);
  }

  addCourse(courseData) {
    const newCourse = {
      id: courseData.code.replace(/\s+/g, ''),
      ...courseData,
      createdAt: new Date(),
    };
    this.courses.push(newCourse);
    this.assessments[newCourse.id] = [];
    return newCourse;
  }

  updateCourse(courseId, courseData) {
    const course = this.getCourseById(courseId);
    if (course) {
      Object.assign(course, courseData);
      return course;
    }
    return null;
  }

  deleteCourse(courseId) {
    const index = this.courses.findIndex(c => c.id === courseId);
    if (index > -1) {
      this.courses.splice(index, 1);
      delete this.assessments[courseId];
      return true;
    }
    return false;
  }

  // ===== ASSESSMENT METHODS =====
  getAssessmentsByCourse(courseId) {
    return this.assessments[courseId] || [];
  }

  getAssessmentById(courseId, assessmentId) {
    const assessments = this.getAssessmentsByCourse(courseId);
    return assessments.find(a => a.id === assessmentId);
  }

  addAssessment(courseId, assessmentData) {
    if (!this.assessments[courseId]) {
      this.assessments[courseId] = [];
    }
    const newAssessment = {
      id: `${courseId}-${Date.now()}`,
      courseId,
      ...assessmentData,
      earnedMarks: assessmentData.earnedMarks || null,
      createdAt: new Date(),
    };
    this.assessments[courseId].push(newAssessment);
    return newAssessment;
  }

  updateAssessment(courseId, assessmentId, assessmentData) {
    const assessment = this.getAssessmentById(courseId, assessmentId);
    if (assessment) {
      Object.assign(assessment, assessmentData);
      return assessment;
    }
    return null;
  }

  deleteAssessment(courseId, assessmentId) {
    const assessments = this.assessments[courseId];
    if (assessments) {
      const index = assessments.findIndex(a => a.id === assessmentId);
      if (index > -1) {
        assessments.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  // ===== CALCULATION METHODS =====
  calculateCourseAverage(courseId) {
    const assessments = this.getAssessmentsByCourse(courseId);
    let totalWeight = 0;
    let weightedSum = 0;

    assessments.forEach(assessment => {
      if (assessment.earnedMarks !== null && assessment.totalMarks > 0) {
        const percentage = (assessment.earnedMarks / assessment.totalMarks) * 100;
        weightedSum += percentage * assessment.weight;
        totalWeight += assessment.weight;
      }
    });

    return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 0;
  }

  getCompletedAssessments(courseId) {
    return this.getAssessmentsByCourse(courseId).filter(a => a.status === 'completed').length;
  }

  getTotalAssessments(courseId) {
    return this.getAssessmentsByCourse(courseId).length;
  }

  getUpcomingAssessments(daysFromNow = 30) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysFromNow * 24 * 60 * 60 * 1000);

    const upcoming = [];
    Object.keys(this.assessments).forEach(courseId => {
      this.assessments[courseId].forEach(assessment => {
        const dueDate = new Date(assessment.dueDate);
        if (dueDate >= now && dueDate <= futureDate && assessment.status === 'pending') {
          upcoming.push(assessment);
        }
      });
    });

    return upcoming.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }
}

// Create global data store instance
const dataStore = new DataStore();