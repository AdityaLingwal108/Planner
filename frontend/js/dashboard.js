// dashboard.js — Deliverable 2
// Uses window.fetchWithAuth() from Person 1's auth.js (auto-attaches JWT token)
// Falls back to dataStore mock data if no token or API fails

async function renderDashboard() {
    const courseGrid = document.querySelector('#dashboardPage .course-grid');
    const assessmentList = document.querySelector('#dashboardPage .assessment-list');
    if (!courseGrid || !assessmentList) return;

    // Person 1 stores the token under 'jwt_token'
    const token = localStorage.getItem('jwt_token');

    if (!token) {
        // No real login yet — use mock data so UI still works
        renderDashboardFromStore(courseGrid, assessmentList);
        return;
    }

    courseGrid.innerHTML = '<div class="empty-state"><p>Loading courses...</p></div>';
    assessmentList.innerHTML = '<li class="assessment-item"><div><h4>Loading...</h4></div></li>';

    try {
        // window.fetchWithAuth is defined by Person 1 in auth.js
        const response = await window.fetchWithAuth('/api/dashboard');

        if (!response.ok) {
            renderDashboardFromStore(courseGrid, assessmentList);
            return;
        }

        const data = await response.json();
        renderDashboardCourses(courseGrid, data.courses);
        renderUpcomingAssessments(assessmentList, data.upcoming);

    } catch (error) {
        console.warn('Dashboard API unavailable, using mock data:', error.message);
        renderDashboardFromStore(courseGrid, assessmentList);
    }
}


// ── Fallback: original D1 dataStore behaviour ─────────────────────────────────
function renderDashboardFromStore(courseGrid, assessmentList) {
    const courses = dataStore.getCourses();

    if (courses.length === 0) {
        courseGrid.innerHTML = '<div class="empty-state"><p>No courses added yet.</p></div>';
    } else {
        courseGrid.innerHTML = courses.map(course => {
            const avg = dataStore.calculateCourseAverage(course.id);
            const completed = dataStore.getCompletedAssessments(course.id);
            const total = dataStore.getTotalAssessments(course.id);

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

    const upcoming = dataStore.getUpcomingAssessments(30);

    if (upcoming.length === 0) {
        assessmentList.innerHTML = `
            <li class="assessment-item">
                <div>
                    <h4>No upcoming assessments</h4>
                    <p class="assessment-meta">You are all caught up!</p>
                </div>
            </li>`;
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


// ── API-powered renderers (active once real login works) ──────────────────────
function renderDashboardCourses(courseGrid, courses) {
    if (courses.length === 0) {
        courseGrid.innerHTML = '<div class="empty-state"><p>No courses added yet.</p></div>';
        return;
    }

    courseGrid.innerHTML = courses.map(course => {
        const avg = course.average;

        let badgeClass = 'badge-good';
        let badgeText = 'On track';
        if (course.total === 0) {
            badgeClass = '';
            badgeText = 'No assessments';
        } else if (avg < 60) {
            badgeClass = 'badge-warn';
            badgeText = 'Needs Attention';
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
                        <span class="value">${course.completed} / ${course.total}</span>
                    </div>
                </div>
                <div class="progress">
                    <div class="progress-bar" style="width: ${Math.min(avg, 100)}%;"></div>
                </div>
                <p class="progress-text">Progress: ${avg}%</p>
            </article>
        `;
    }).join('');
}

function renderUpcomingAssessments(assessmentList, upcoming) {
    if (upcoming.length === 0) {
        assessmentList.innerHTML = `
            <li class="assessment-item">
                <div>
                    <h4>No upcoming assessments</h4>
                    <p class="assessment-meta">You are all caught up!</p>
                </div>
            </li>`;
        return;
    }

    assessmentList.innerHTML = upcoming.map(item => {
        const dueDate = new Date(item.dueDate).toLocaleDateString();
        return `
            <li class="assessment-item">
                <div>
                    <h4>${item.title}</h4>
                    <p class="assessment-meta">${item.courseCode} • Due: ${dueDate}</p>
                </div>
                <span class="status pending">Pending</span>
            </li>
        `;
    }).join('');
}