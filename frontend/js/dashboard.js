// Dashboard Logic

function renderDashboard() {
    const courseGrid = document.querySelector('#dashboardPage .course-grid');
    const assessmentList = document.querySelector('#dashboardPage .assessment-list');

    if (!courseGrid || !assessmentList) return;

    // 1. Render Dynamic Courses
    const courses = dataStore.getCourses();

    if (courses.length === 0) {
        courseGrid.innerHTML = '<div class="empty-state"><p>No courses added yet.</p></div>';
    } else {
        courseGrid.innerHTML = courses.map(course => {
            const avg = dataStore.calculateCourseAverage(course.id);
            const completed = dataStore.getCompletedAssessments(course.id);
            const total = dataStore.getTotalAssessments(course.id);

            // Determine badge status
            let badgeClass = 'badge-good';
            let badgeText = 'On track';
            if (avg < 60 && total > 0) {
                badgeClass = 'badge-warn';
                badgeText = 'Needs Attention';
            } else if (total === 0) {
                badgeClass = '';
                badgeText = 'No assessments';
            }

            return `
                <article class="course-card">
                    <div class="course-top">
                        <div>
                            <h4>${course.code} — ${course.name}</h4>
                            <p class="course-meta">${course.term} • ${course.instructor}</p>
                        </div>
                        <span class="badge ${badgeClass}">${badgeText}</span>
                    </div>

                    <div class="course-stats">
                        <div class="stat">
                            <span class="label">Current average</span>
                            <span class="value">${avg}%</span>
                        </div>
                        <div class="stat">
                            <span class="label">Completed</span>
                            <span class="value">${completed} / ${total}</span>
                        </div>
                    </div>

                    <div class="progress">
                        <div class="progress-bar" style="width: ${avg}%;"></div>
                    </div>
                    <p class="progress-text">Progress: ${avg}%</p>
                </article>
            `;
        }).join('');
    }

    // 2. Render Dynamic Upcoming Assessments (Next 30 days)
    const upcoming = dataStore.getUpcomingAssessments(30);

    if (upcoming.length === 0) {
        assessmentList.innerHTML = '<li class="assessment-item"><div><h4>No upcoming assessments</h4><p class="assessment-meta">You are all caught up!</p></div></li>';
    } else {
        assessmentList.innerHTML = upcoming.map(item => {
            const course = dataStore.getCourseById(item.courseId);
            const dueDate = new Date(item.dueDate).toLocaleDateString();

            return `
                <li class="assessment-item">
                    <div>
                        <h4>${item.title}</h4>
                        <p class="assessment-meta">${course ? course.code : item.courseId} • Due: ${dueDate}</p>
                    </div>
                    <span class="status pending">Pending</span>
                </li>
            `;
        }).join('');
    }
}