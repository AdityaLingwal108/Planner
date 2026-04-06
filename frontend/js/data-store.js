// Data Store - API-backed application state management
// Uses JWT authentication via window.fetchWithAuth()

// Helper function to safely parse JSON response
async function parseJsonResponse(response) {
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Server returned invalid response. Please try again.');
  }
  return response.json();
}

class DataStore {
  constructor() {
    this.courses = [];
    this.assessments = {};
    this.currentCourseId = null;
    this._initialized = false;
  }

  // ===== INITIALIZATION =====
  async initialize() {
    if (this._initialized) return;
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      // No token - use empty state (user not logged in)
      this.courses = [];
      this.assessments = {};
      this._initialized = true;
      return;
    }
    await this.fetchCoursesFromAPI();
    this._initialized = true;
  }

  // ===== API METHODS =====
  async fetchCoursesFromAPI() {
    try {
      const response = await window.fetchWithAuth('/api/student/courses');
      if (!response.ok) {
        console.warn(`Failed to fetch courses from API: ${response.status} ${response.statusText}`);
        return;
      }
      const data = await parseJsonResponse(response);
      this.courses = data.map(c => ({
        id: String(c.id),
        code: c.code,
        name: c.name,
        instructor: c.instructor,
        term: c.term,
        description: c.description || '',
        credits: c.credits,
        enabled: c.enabled,
        createdAt: c.createdAt
      }));
      
      // Build assessments map
      this.assessments = {};
      data.forEach(course => {
        const courseId = String(course.id);
        this.assessments[courseId] = (course.Assessments || []).map(a => ({
          id: String(a.id),
          courseId: courseId,
          type: a.type,
          title: a.title,
          description: a.description || '',
          dueDate: new Date(a.dueDate),
          weight: a.weight,
          earnedMarks: a.earnedMarks,
          totalMarks: a.totalMarks,
          status: a.status,
          createdAt: a.createdAt
        }));
      });
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  }

  // ===== COURSE METHODS =====
  getCourses() {
    return this.courses;
  }

  getCourseById(courseId) {
    return this.courses.find(c => c.id === String(courseId));
  }

  async addCourse(courseData) {
    try {
      const response = await window.fetchWithAuth('/api/student/courses', {
        method: 'POST',
        body: JSON.stringify(courseData)
      });
      
      if (!response.ok) {
        const err = await parseJsonResponse(response);
        throw new Error(err.error || 'Failed to create course');
      }
      
      const newCourse = await parseJsonResponse(response);
      const formattedCourse = {
        id: String(newCourse.id),
        code: newCourse.code,
        name: newCourse.name,
        instructor: newCourse.instructor,
        term: newCourse.term,
        description: newCourse.description || '',
        credits: newCourse.credits,
        createdAt: new Date()
      };
      
      this.courses.push(formattedCourse);
      this.assessments[formattedCourse.id] = [];
      return formattedCourse;
    } catch (error) {
      console.error('Error adding course:', error);
      throw error;
    }
  }

  async updateCourse(courseId, courseData) {
    try {
      const response = await window.fetchWithAuth(`/api/student/courses/${courseId}`, {
        method: 'PUT',
        body: JSON.stringify(courseData)
      });
      
      if (!response.ok) {
        const err = await parseJsonResponse(response);
        throw new Error(err.error || 'Failed to update course');
      }
      
      const updatedCourse = await parseJsonResponse(response);
      const course = this.getCourseById(courseId);
      if (course) {
        Object.assign(course, {
          code: updatedCourse.code,
          name: updatedCourse.name,
          instructor: updatedCourse.instructor,
          term: updatedCourse.term,
          description: updatedCourse.description || '',
          credits: updatedCourse.credits
        });
      }
      return course;
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  }

  async deleteCourse(courseId) {
    try {
      const response = await window.fetchWithAuth(`/api/student/courses/${courseId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const err = await parseJsonResponse(response);
        throw new Error(err.error || 'Failed to delete course');
      }
      
      const index = this.courses.findIndex(c => c.id === String(courseId));
      if (index > -1) {
        this.courses.splice(index, 1);
        delete this.assessments[String(courseId)];
      }
      return true;
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  }

  // ===== ASSESSMENT METHODS =====
  getAssessmentsByCourse(courseId) {
    return this.assessments[String(courseId)] || [];
  }

  getAssessmentById(courseId, assessmentId) {
    const assessments = this.getAssessmentsByCourse(courseId);
    return assessments.find(a => a.id === String(assessmentId));
  }

  async addAssessment(courseId, assessmentData) {
    try {
      const response = await window.fetchWithAuth(`/api/student/courses/${courseId}/assessments`, {
        method: 'POST',
        body: JSON.stringify(assessmentData)
      });
      
      if (!response.ok) {
        const err = await parseJsonResponse(response);
        throw new Error(err.error || 'Failed to create assessment');
      }
      
      const newAssessment = await parseJsonResponse(response);
      const formatted = {
        id: String(newAssessment.id),
        courseId: String(courseId),
        type: newAssessment.type,
        title: newAssessment.title,
        description: newAssessment.description || '',
        dueDate: new Date(newAssessment.dueDate),
        weight: newAssessment.weight,
        earnedMarks: newAssessment.earnedMarks,
        totalMarks: newAssessment.totalMarks,
        status: newAssessment.status,
        createdAt: new Date()
      };
      
      if (!this.assessments[String(courseId)]) {
        this.assessments[String(courseId)] = [];
      }
      this.assessments[String(courseId)].push(formatted);
      return formatted;
    } catch (error) {
      console.error('Error adding assessment:', error);
      throw error;
    }
  }

  async updateAssessment(courseId, assessmentId, assessmentData) {
    try {
      const response = await window.fetchWithAuth(`/api/student/assessments/${assessmentId}`, {
        method: 'PUT',
        body: JSON.stringify(assessmentData)
      });
      
      if (!response.ok) {
        const err = await parseJsonResponse(response);
        throw new Error(err.error || 'Failed to update assessment');
      }
      
      const updated = await parseJsonResponse(response);
      const assessment = this.getAssessmentById(courseId, assessmentId);
      if (assessment) {
        Object.assign(assessment, {
          earnedMarks: updated.earnedMarks,
          status: updated.status,
          title: updated.title,
          type: updated.type,
          description: updated.description,
          dueDate: new Date(updated.dueDate),
          weight: updated.weight,
          totalMarks: updated.totalMarks
        });
      }
      return assessment;
    } catch (error) {
      console.error('Error updating assessment:', error);
      throw error;
    }
  }

  async deleteAssessment(courseId, assessmentId) {
    try {
      const response = await window.fetchWithAuth(`/api/student/assessments/${assessmentId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const err = await parseJsonResponse(response);
        throw new Error(err.error || 'Failed to delete assessment');
      }
      
      const assessments = this.assessments[String(courseId)];
      if (assessments) {
        const index = assessments.findIndex(a => a.id === String(assessmentId));
        if (index > -1) {
          assessments.splice(index, 1);
        }
      }
      return true;
    } catch (error) {
      console.error('Error deleting assessment:', error);
      throw error;
    }
  }

  // ===== CALCULATION METHODS (local computation for speed) =====
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

  // Reset for logout
  reset() {
    this.courses = [];
    this.assessments = {};
    this.currentCourseId = null;
    this._initialized = false;
  }
}

// Create global data store instance
const dataStore = new DataStore();