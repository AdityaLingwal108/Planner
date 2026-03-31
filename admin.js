function adminGetCourses() {
  return JSON.parse(localStorage.getItem('sharedCourses') || '[]');
}

function adminSaveCourses(courseList) {
  localStorage.setItem('sharedCourses', JSON.stringify(courseList));
  syncAdminCoursesToDataStore(courseList);
}


function syncAdminCoursesToDataStore(adminCourses) {
  if (typeof dataStore === 'undefined') return;


  dataStore.courses = adminCourses
    .filter(c => c.enabled)
    .map(c => ({
      id:          c._id,
      code:        c.code,
      name:        c.name,
      instructor:  c.instructor,
      term:        c.term,
      credits:     c.credits || 3,
      description: c.description || '',
      createdAt:   new Date(),
    }));


  dataStore.initializeData();
}

function adminGetStats() {
  if (typeof dataStore === 'undefined') return [];
  const stats = [];

  dataStore.getCourses().forEach(course => {
    const assessments = dataStore.getAssessmentsByCourse(course.id);

    assessments.forEach(a => {
      const isCompleted = a.status === 'completed';
      const hasMarks    = a.earnedMarks !== null && a.totalMarks > 0;
      const marksPct    = hasMarks ? Math.round((a.earnedMarks / a.totalMarks) * 100) : null;

      stats.push({
        courseCode:     course.code,
        courseName:     course.name,
        assessmentName: a.title,
        assessmentType: a.type,
        status:         a.status,
        weight:         a.weight,
        earnedMarks:    a.earnedMarks,
        totalMarks:     a.totalMarks,
        marksPct:       marksPct,
        completionPct:  marksPct !== null ? marksPct : (isCompleted ? 100 : 0),
      });
    });

    const total     = assessments.length;
    const completed = assessments.filter(x => x.status === 'completed').length;
    if (total > 0) {
      stats.push({
        courseCode:     course.code,
        courseName:     course.name,
        assessmentName: '📊 Overall Course Completion',
        assessmentType: 'summary',
        status:         completed === total ? 'completed' : 'pending',
        weight:         100,
        earnedMarks:    null,
        totalMarks:     null,
        marksPct:       null,
        completionPct:  Math.round((completed / total) * 100),
      });
    }
  });

  return stats;
}


function showToast(msg, type = 'success') {
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:9999;
    padding:12px 20px;border-radius:8px;font-size:14px;
    color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.3);
    background:${type === 'success' ? '#22c55e' : '#ef4444'};
    transition:opacity 0.4s;
  `;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 3000);
}

function logoutAdmin() {
  localStorage.removeItem('isLoggedIn');
  window.location.href = 'index.html';
}


function initTheme() {
  const saved = localStorage.getItem('theme') || 'light';

  // Use global function from utils.js
  if (typeof applyTheme === 'function') {
    applyTheme(saved);
  }

  const btn = document.getElementById('themeToggleBtn');
  if (btn) {
    btn.onclick = () => {
      if (typeof toggleTheme === 'function') {
        toggleTheme();
      }
    };
  }
}



let courses = [];

function loadCourses() {
  let stored = adminGetCourses();

  if (stored.length === 0 && typeof dataStore !== 'undefined') {
    stored = dataStore.getCourses().map(c => ({
      _id:        c.id,
      code:       c.code,
      name:       c.name,
      instructor: c.instructor,
      term:       c.term,
      enabled:    true,
      categories: [],
    }));
    adminSaveCourses(stored);
  }

  courses = stored;
  renderCourseGrid();
  populateCourseSelects();
}

function renderCourseGrid() {
  const grid = document.querySelector('.courseGrid');
  if (!grid) return;
  grid.innerHTML = '';

  if (courses.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-muted,#888)">No courses yet.</p>';
    return;
  }

  courses.forEach(course => {
    const box = document.createElement('div');
    box.className = `courseBox ${course.enabled ? 'activeBox' : 'disabledCourseBox'}`;
    box.dataset.id = course._id;
    box.innerHTML = `
      <div class="courseTitle">${course.code} — ${course.name}</div>
      <div class="courseTerm">${course.term}</div>
      <div class="courseProf">${course.instructor}</div>
      <div class="courseButtons">
        <button class="editButton"   onclick="openEditCourse('${course._id}')">Edit</button>
        <button class="deleteButton" onclick="deleteCourse('${course._id}')">Delete</button>
        <button class="${course.enabled ? 'disableButton' : 'enableButton'}"
                onclick="toggleCourse('${course._id}')">
          ${course.enabled ? 'Disable' : 'Enable'}
        </button>
      </div>
    `;
    grid.appendChild(box);
  });
}

function populateCourseSelects() {
  const sel = document.getElementById('courseSelect');
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option value="">-- Courses --</option>';
  courses.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c._id;
    opt.textContent = c.enabled
      ? `${c.code} — ${c.name}`
      : `🚫 ${c.code} — ${c.name} (Disabled)`;
    opt.disabled = !c.enabled;
    opt.style.color = c.enabled ? '' : '#9ca3af';
    sel.appendChild(opt);
  });
  if (current) {
    const stillEnabled = courses.find(c => c._id === current && c.enabled);
    sel.value = stillEnabled ? current : '';
    if (!stillEnabled) { renderAssessmentList([]); currentAssessments = []; }
  }
}


function initAddCourseForm() {
  const btn      = document.querySelector('.addCourseFormButton');
  const clearBtn = document.getElementById('clearCourseFormBtn');
  if (!btn) return;

  const clearForm = () => {
    ['courseCodeInput','courseNameInput','instructorInput','descriptionInput'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    const c = document.getElementById('creditsInput');     if (c) c.value = '3';
    const t = document.getElementById('templateSelect');   if (t) t.value = '';
    const r = document.getElementById('termInput');        if (r) r.selectedIndex = 0;
  };

  if (clearBtn) clearBtn.addEventListener('click', clearForm);

  btn.addEventListener('click', () => {
    const code        = (document.getElementById('courseCodeInput')?.value  || '').trim();
    const name        = (document.getElementById('courseNameInput')?.value  || '').trim();
    const instructor  = (document.getElementById('instructorInput')?.value  || '').trim();
    const term        = document.getElementById('termInput')?.value         || 'Winter 2026';
    const credits     = parseInt(document.getElementById('creditsInput')?.value) || 3;
    const description = (document.getElementById('descriptionInput')?.value || '').trim();
    const template    = document.getElementById('templateSelect')?.value    || '';

    if (!code || !name || !instructor) {
      showToast('Please fill in Code, Name and Instructor.', 'error');
      return;
    }

    let categories = [];
    if (template === 'standard') {
      categories = [{ name: 'Midterm', weight: 30 }, { name: 'Final', weight: 70 }];
    } else if (template === 'projectHeavy') {
      categories = [{ name: 'Project', weight: 40 }, { name: 'Final', weight: 60 }];
    }

    const newCourse = {
      _id: Date.now().toString(),
      code, name, instructor, term, credits, description,
      enabled: true,
      categories,
    };

    courses.push(newCourse);
    adminSaveCourses(courses);
    showToast('Course added! Students can now see it.');
    clearForm();
    renderCourseGrid();
    populateCourseSelects();
  });
}


function openEditCourse(id) {
  const course = courses.find(c => c._id === id);
  if (!course) return;

  const existing = document.getElementById('editModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'editModal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.55);
    display:flex;align-items:center;justify-content:center;z-index:999;
  `;
  modal.innerHTML = `
    <div style="background:var(--card-bg,#fff);padding:32px;border-radius:12px;
                min-width:340px;max-width:500px;display:flex;flex-direction:column;gap:12px;
                box-shadow:0 8px 32px rgba(0,0,0,.3);">
      <h3 style="margin:0 0 8px">Edit Course</h3>
      <label style="font-size:13px;font-weight:600">Course Code</label>
      <input id="editCode"  value="${course.code}"        placeholder="Course Code">
      <label style="font-size:13px;font-weight:600">Course Name</label>
      <input id="editName"  value="${course.name}"        placeholder="Course Name">
      <label style="font-size:13px;font-weight:600">Instructor</label>
      <input id="editInstr" value="${course.instructor}"  placeholder="Instructor">
      <label style="font-size:13px;font-weight:600">Term</label>
      <select id="editTerm" style="padding:8px;border-radius:6px;border:1px solid #ccc;">
        <option ${course.term==='Winter 2026'?'selected':''}>Winter 2026</option>
        <option ${course.term==='Summer 2026'?'selected':''}>Summer 2026</option>
        <option ${course.term==='Fall 2026'  ?'selected':''}>Fall 2026</option>
        <option ${course.term==='Winter 2027'?'selected':''}>Winter 2027</option>
        <option ${course.term==='Summer 2027'?'selected':''}>Summer 2027</option>
        <option ${course.term==='Fall 2027'  ?'selected':''}>Fall 2027</option>
      </select>
      <label style="font-size:13px;font-weight:600">Credits</label>
      <input id="editCredits" type="number" min="1" max="6" value="${course.credits || 3}" placeholder="Credits">
      <label style="font-size:13px;font-weight:600">Description</label>
      <textarea id="editDesc" style="padding:8px;border-radius:6px;border:1px solid #ccc;min-height:70px;resize:vertical;"
        placeholder="Course description (optional)">${course.description || ''}</textarea>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button id="editSaveBtn"   class="addCourseFormButton" style="flex:1">Save</button>
        <button id="editCancelBtn" class="deleteButton"        style="flex:1">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('#editCancelBtn').onclick = () => modal.remove();
  modal.querySelector('#editSaveBtn').onclick = () => {
    course.code        = modal.querySelector('#editCode').value.trim();
    course.name        = modal.querySelector('#editName').value.trim();
    course.instructor  = modal.querySelector('#editInstr').value.trim();
    course.term        = modal.querySelector('#editTerm').value;
    course.credits     = parseInt(modal.querySelector('#editCredits').value) || 3;
    course.description = modal.querySelector('#editDesc').value.trim();

    adminSaveCourses(courses);
    showToast('Course updated!');
    modal.remove();
    renderCourseGrid();
    populateCourseSelects();
  };
}


function deleteCourse(id) {
  if (!confirm('Delete this course? This cannot be undone.')) return;
  courses = courses.filter(c => c._id !== id);
  adminSaveCourses(courses);
  showToast('Course deleted.');
  renderCourseGrid();
  populateCourseSelects();
}


function toggleCourse(id) {
  const course = courses.find(c => c._id === id);
  if (!course) return;
  course.enabled = !course.enabled;
  adminSaveCourses(courses); // disabled courses are filtered out in syncAdminCoursesToDataStore
  showToast(`Course ${course.enabled ? 'enabled — now visible to students' : 'disabled — hidden from students'}.`);
  renderCourseGrid();
}

let currentAssessments = [];

function getStudentAssessments(courseId) {
  const all = JSON.parse(localStorage.getItem('studentAssessments') || '{}');
  return all[courseId] || [];
}

function setStudentAssessments(courseId, list) {
  const all = JSON.parse(localStorage.getItem('studentAssessments') || '{}');
  all[courseId] = list;
  localStorage.setItem('studentAssessments', JSON.stringify(all));
}

function loadAssessments(courseId) {
  if (!courseId) { renderAssessmentList([]); return; }

  const course = courses.find(c => c._id === courseId);

  if (course && !course.enabled) {
    const container = document.querySelector('.assessmentList');
    if (container) {
      container.innerHTML = '<p style="color:#b45309;font-weight:600;">⚠️ This course is disabled. Re-enable it to view or edit its assessments.</p>';
    }
    currentAssessments = [];
    return;
  }

  const adminCats = (course?.categories || []).map((cat, i) => ({
    ...cat,
    _id:      `${courseId}-admin-${i}`,
    _source:  'admin',
    title:    cat.name || cat.title || '',
  }));

  const studentItems = getStudentAssessments(courseId).map(a => ({
    ...a,
    _id:     a.id || a._id,
    _source: 'student',
    name:    a.title || a.name || '', 
    title:   a.title || a.name || '',
  }));

  const adminIds = new Set(adminCats.map(a => a._id));
  const studentOnly = studentItems.filter(a => !adminIds.has(a._id));

  currentAssessments = [...adminCats, ...studentOnly];
  renderAssessmentList(currentAssessments);
}

function renderAssessmentList(list) {
  const container = document.querySelector('.assessmentList');
  if (!container) return;
  container.innerHTML = '';

  if (list.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted,#888)">No assessments for this course.</p>';
    return;
  }

  list.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'assessmentItem';
    const dueFmt = item.dueDate
      ? new Date(item.dueDate).toLocaleDateString('en-US', {year:'numeric',month:'short',day:'numeric'})
      : '—';
    const displayName = item.title || item.name || '(unnamed)';
    const source = item._source === 'student'
      ? '<span style="background:#dcfce7;color:#166534;border-radius:4px;padding:1px 7px;font-size:11px;margin-left:6px;">Student</span>'
      : '<span style="background:#e0edff;color:#1d4ed8;border-radius:4px;padding:1px 7px;font-size:11px;margin-left:6px;">Admin</span>';
    const typeBadge = item.type
      ? `<span style="background:#f3f4f6;color:#374151;border-radius:4px;padding:1px 7px;font-size:11px;margin-left:4px;">${item.type}</span>`
      : '';

    div.innerHTML = `
      <p><strong>${displayName}</strong>${typeBadge}${source}</p>
      ${item.description ? `<p class="assessmentMeta">📝 ${item.description}</p>` : ''}
      <p class="assessmentMeta">⚖️ Weight: <span class="assessmentWeight">${item.weight}%</span> &nbsp;|&nbsp; 🎯 Total Marks: ${item.totalMarks || '—'} &nbsp;|&nbsp; 📅 Due: ${dueFmt}</p>
      <p class="assessmentMeta">Status: <span style="color:${item.status === 'completed' ? '#16a34a' : '#b45309'};font-weight:600;">${item.status === 'completed' ? '✅ Completed' : '⏳ Pending'}</span></p>
      <button class="deleteAssessmentButton">Delete</button>
    `;
    div.querySelector('.deleteAssessmentButton').onclick = () => deleteAssessment(idx);
    container.appendChild(div);
  });
}

function deleteAssessment(idx) {
  const courseId = document.getElementById('courseSelect')?.value;
  if (!courseId) return;

  const item = currentAssessments[idx];
  if (!item) return;

  currentAssessments.splice(idx, 1);

  if (item._source === 'admin') {
    const course = courses.find(c => c._id === courseId);
    if (course) {
      course.categories = currentAssessments
        .filter(a => a._source === 'admin')
        .map(a => ({
          name:        a.title || a.name,
          type:        a.type,
          description: a.description,
          dueDate:     a.dueDate,
          weight:      a.weight,
          totalMarks:  a.totalMarks,
          status:      a.status,
        }));
      adminSaveCourses(courses);
    }
  } else {
    // Remove from student localStorage
    const remaining = getStudentAssessments(courseId).filter(
      a => (a.id || a._id) !== (item._id || item.id)
    );
    setStudentAssessments(courseId, remaining);
  }

  showToast('Assessment deleted.');
  renderAssessmentList(currentAssessments);
}

function saveAssessments(courseId) {
  const course = courses.find(c => c._id === courseId);
  if (!course) return;

  course.categories = currentAssessments
    .filter(a => a._source === 'admin')
    .map(a => ({
      name:        a.title || a.name,
      type:        a.type,
      description: a.description,
      dueDate:     a.dueDate,
      weight:      a.weight,
      totalMarks:  a.totalMarks,
      status:      a.status,
    }));

  adminSaveCourses(courses);
  showToast('Assessment added!');
  renderAssessmentList(currentAssessments);
}


function clearAssessmentForm() {
  const defaults = { assessmentWeight: '10', assessmentTotalMarks: '100', assessmentStatus: 'pending' };
  ['assessmentType','assessmentTitle','assessmentDescription','assessmentDueDate',
   'assessmentWeight','assessmentTotalMarks','assessmentStatus'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = defaults[id] || '';
  });
}

function initAssessmentSection() {
  const courseSelect = document.getElementById('courseSelect');
  const addBtn       = document.querySelector('.addAssessmentButton');
  const clearBtn     = document.getElementById('clearAssessmentFormBtn');
  if (!courseSelect || !addBtn) return;

  courseSelect.addEventListener('change', () => loadAssessments(courseSelect.value));
  if (clearBtn) clearBtn.addEventListener('click', clearAssessmentForm);

  addBtn.addEventListener('click', () => {
    const courseId = courseSelect.value;
    if (!courseId) { showToast('Select a course first.', 'error'); return; }

    const form         = document.querySelector('.addAssessmentForm');
    const inputs       = form ? form.querySelectorAll('input') : [];

    const type       = document.getElementById('assessmentType')?.value || 'Assignment';
    const name       = (document.getElementById('assessmentTitle')?.value || inputs[0]?.value || '').trim();
    const desc       = document.getElementById('assessmentDescription')?.value?.trim() || '';
    const dueDate    = document.getElementById('assessmentDueDate')?.value || '';
    const rawWeight  = document.getElementById('assessmentWeight')?.value ?? inputs[1]?.value ?? '';
    const weight     = parseFloat(rawWeight);
    const totalMarks = parseFloat(document.getElementById('assessmentTotalMarks')?.value) || 100;
    const status     = document.getElementById('assessmentStatus')?.value || 'pending';

    if (!name)    { showToast('Enter a title / assessment name.', 'error'); return; }
    if (rawWeight === '' || isNaN(weight) || weight < 0 || weight > 100) {
      showToast('Enter a valid weight between 0 and 100.', 'error'); return;
    }

    const totalSoFar = currentAssessments.reduce((s, a) => s + a.weight, 0);
    if (totalSoFar + weight > 100) {
      showToast('Total weight would exceed 100% (currently ' + totalSoFar + '%).', 'error'); return;
    }

    currentAssessments.push({
      _source:     'admin',
      _id:         `${courseId}-admin-${Date.now()}`,
      name,
      title:       name,
      type,
      description: desc,
      dueDate,
      weight,
      totalMarks,
      status,
    });
    saveAssessments(courseId);
    clearAssessmentForm();

    inputs.forEach(i => { i.value = ''; });
  });
}


let statsCache = [];

function loadStats() {
  statsCache = adminGetStats();
  populateStatsSelect();
}

function populateStatsSelect() {
  const sel = document.getElementById('assessmentProgressSelect');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Assessments --</option>';
  statsCache.forEach((item, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = `${item.courseCode} — ${item.assessmentName}`;
    sel.appendChild(opt);
  });
}

function initStatsSection() {
  const sel     = document.getElementById('assessmentProgressSelect');
  const fill    = document.getElementById('progressFill');
  const pctText = document.getElementById('progressPercentText');
  const barWrap = document.querySelector('.progressBar');
  if (!sel || !fill || !pctText) return;

  if (barWrap) {
    barWrap.style.cssText += `
      width:100%;background:#e5e7eb;border-radius:999px;
      height:18px;overflow:hidden;margin:12px 0 4px;
    `;
  }
  fill.style.cssText = `height:100%;width:0%;border-radius:999px;transition:width 0.5s ease;`;

  let detailCard = document.getElementById('statsDetailCard');
  if (!detailCard) {
    detailCard = document.createElement('div');
    detailCard.id = 'statsDetailCard';
    detailCard.style.cssText = `
      margin-top:16px;padding:16px;border-radius:10px;
      background:var(--card-inner-bg,#f3f4f6);
      display:none;font-size:14px;line-height:1.8;
    `;
    (pctText.parentNode || barWrap?.parentNode)?.appendChild(detailCard);
  }

  sel.addEventListener('change', () => {
    if (sel.value === '') {
      fill.style.width = '0%';
      fill.style.background = '#6b7280';
      pctText.textContent = '0%';
      detailCard.style.display = 'none';
      return;
    }

    const item = statsCache[parseInt(sel.value)];
    if (!item) return;

    const pct    = Math.min(100, Math.max(0, item.completionPct ?? 0));
    const colour = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : pct >= 40 ? '#f97316' : '#ef4444';

    fill.style.width      = pct + '%';
    fill.style.background = colour;
    pctText.textContent   = pct + '%';
    pctText.style.color   = colour;
    pctText.style.fontWeight = 'bold';

    const statusEmoji = item.status === 'completed' ? '✅' : '⏳';
    let lines = `<strong>${item.courseCode} — ${item.assessmentName}</strong><br>${statusEmoji} Status: <b>${item.status}</b>`;

    if (item.assessmentType !== 'summary') {
      lines += `<br>📌 Type: ${item.assessmentType}`;
      lines += `<br>⚖️ Weight: ${item.weight}%`;
      lines += item.earnedMarks !== null
        ? `<br>🎯 Marks: ${item.earnedMarks} / ${item.totalMarks} (${item.marksPct}%)`
        : `<br>🎯 Marks: Not graded yet`;
    } else {
      lines += `<br>📈 ${pct}% of assessments completed`;
    }

    detailCard.innerHTML = lines;
    detailCard.style.display = 'block';
  });
}



document.addEventListener('DOMContentLoaded', () => {
  initTheme();

  const btn = document.getElementById('themeToggleBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      if (typeof toggleTheme === 'function') {
        toggleTheme();
      } else {
        console.error('toggleTheme not found');
      }
    });
  }

  initAddCourseForm();
  initAssessmentSection();
  initStatsSection();
  loadCourses();
  loadStats();
});
