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
        const token = localStorage.getItem('jwt_token');
        const response = await fetch('/api/dashboard', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        });

        if (!response.ok) {
            console.warn('Dashboard API returned', response.status, '- falling back to dataStore');
            renderDashboardFromStore(courseGrid, assessmentList);
            return;
        }

        const data = await response.json();

        if (!data || !data.courses) {
            console.warn('Dashboard API returned bad data - falling back to dataStore');
            renderDashboardFromStore(courseGrid, assessmentList);
            return;
        }

        if (data.courses.length === 0) {
            renderDashboardFromStore(courseGrid, assessmentList);
            return;
        }

        renderDashboardCourses(courseGrid, data.courses);
        renderUpcomingAssessments(assessmentList, data.upcoming || []);

    } catch (error) {
        console.warn('Dashboard API unavailable, using mock data:', error.message);
        renderDashboardFromStore(courseGrid, assessmentList);
    }
}


// ── Fallback: original D1 dataStore behaviour ─────────────────────────────────
function renderDashboardFromStore(courseGrid, assessmentList) {
    const courses = dataStore.getCourses();

    if (courses.length === 0) {
        courseGrid.innerHTML = `
            <div class="empty-state">
                <h4>No courses yet</h4>
                <p>Add your first course in <strong>My Courses</strong> to see your dashboard summary.</p>
            </div>
        `;

        const chartSection = document.querySelector('#dashboardPage .chart-section');
        if (chartSection) {
            chartSection.style.display = 'none';
        }

        assessmentList.innerHTML = `
            <li class="assessment-item">
                <div>
                    <h4>No upcoming assessments</h4>
                    <p class="assessment-meta">Your dashboard will update once you add courses and assessments.</p>
                </div>
            </li>
        `;

        return;
    } else {
        const chartSection = document.querySelector('#dashboardPage .chart-section');
        if (chartSection) {
            chartSection.style.display = 'block';
        }

        courseGrid.innerHTML = courses.map(course => {
            const avg = dataStore.calculateCourseAverage(course.id);
            const completed = dataStore.getCompletedAssessments(course.id);
            const total = dataStore.getTotalAssessments(course.id);
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

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
                        <div class="progress-bar" style="width: ${progress}%;"></div>
                    </div>
                    <p class="progress-text">Progress: ${progress}%</p>
                </article>
            `;
        }).join('');
        renderChart(courses);
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
        const progress = course.total > 0 ? Math.round((course.completed / course.total) * 100) : 0;

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
                    <div class="progress-bar" style="width: ${progress}%;"></div>
                </div>
                <p class="progress-text">Progress: ${progress}%</p>
            </article>
        `;
    }).join('');

    renderChartFromApi(courses);
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

let coursesChartInstance = null;

function renderChart(courses) {
    const canvas = document.getElementById('coursesChart');
    if (!canvas) return;

    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#ffffff' : '#4a4a4a';
    const titleColor = isDarkMode ? '#ffffff' : '#8e1726';
    const gridColor = isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

    const parent = canvas.parentElement;
    if (parent) {
        parent.style.background = isDarkMode ? '#1e1e1e' : '#fafaf7';
    }

    const labels = courses.map(c => c.code);
    const data = courses.map(c => dataStore.calculateCourseAverage(c.id));

    if (coursesChartInstance) {
        coursesChartInstance.destroy();
    }

    coursesChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Course Averages (%)',
                data: data,
                backgroundColor: isDarkMode
                    ? ['#ff4d6d', '#ffd166', '#4cc9f0', '#80ed99', '#f72585']
                    : ['#8e1726', '#c8a951', '#3498db', '#27ae60', '#eb5e41'],
                hoverBackgroundColor: isDarkMode
                    ? ['#ff758f', '#ffe08a', '#72d6ff', '#a8f5bb', '#ff5cab']
                    : ['#a61b2d', '#d6b45f', '#4aa3d6', '#2ecc71', '#ff6b4a'],
                borderColor: '#4a4a4a',
                borderWidth: 1,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: textColor,
                        font: {
                            size: 13,
                            weight: 'bold'
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Average by Course',
                    color: titleColor,
                    font: {
                        size: 18,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    },
                    title: {
                        display: true,
                        text: 'Average (%)',
                        color: textColor
                    }
                },
                x: {
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                }
            }
        }
    });
}

function renderChartFromApi(courses) {
    const canvas = document.getElementById('coursesChart');
    if (!canvas) return;

    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#ffffff' : '#4a4a4a';
    const titleColor = isDarkMode ? '#ffffff' : '#8e1726';
    const gridColor = isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

    const parent = canvas.parentElement;
    if (parent) {
        parent.style.background = isDarkMode ? '#1e1e1e' : '#fafaf7';
    }

    const labels = courses.map(c => c.code);
    const data = courses.map(c => c.average);

    if (coursesChartInstance) {
        coursesChartInstance.destroy();
    }

    coursesChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Course Averages (%)',
                data: data,
                backgroundColor: isDarkMode
                    ? ['#ff4d6d', '#ffd166', '#4cc9f0', '#80ed99', '#f72585']
                    : ['#8e1726', '#c8a951', '#3498db', '#27ae60', '#eb5e41'],
                hoverBackgroundColor: isDarkMode
                    ? ['#ff758f', '#ffe08a', '#72d6ff', '#a8f5bb', '#ff5cab']
                    : ['#a61b2d', '#d6b45f', '#4aa3d6', '#2ecc71', '#ff6b4a'],
                borderColor: '#4a4a4a',
                borderWidth: 1,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: textColor,
                        font: {
                            size: 13,
                            weight: 'bold'
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Average by Course',
                    color: titleColor,
                    font: {
                        size: 18,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    },
                    title: {
                        display: true,
                        text: 'Average (%)',
                        color: textColor
                    }
                },
                x: {
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                }
            }
        }
    });
}