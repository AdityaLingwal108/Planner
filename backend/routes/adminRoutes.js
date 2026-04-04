const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/adminMiddleware');
const User = require('../models/User');

// All admin routes require a valid JWT AND admin role
router.use(protect, adminOnly);

// In-memory store (replace with a DB model if you add a Course model later)
// For now we use a module-level array so data persists while server is running
let courses = [];
let nextId = 1;

// ── GET /api/admin/stats ─────────────────────────────────────────────────────
// Returns anonymized completion stats for every course/assessment
router.get('/stats', (req, res) => {
    const stats = [];

    courses.forEach(course => {
        const assessments = course.categories || [];
        const total = assessments.length;
        const completed = assessments.filter(a => a.status === 'completed').length;

        assessments.forEach(a => {
            stats.push({
                courseCode:     course.code,
                courseName:     course.name,
                assessmentName: a.title || a.name,
                assessmentType: a.type,
                status:         a.status,
                weight:         a.weight,
                totalMarks:     a.totalMarks,
                completionPct:  a.status === 'completed' ? 100 : 0,
            });
        });

        if (total > 0) {
            stats.push({
                courseCode:     course.code,
                courseName:     course.name,
                assessmentName: '📊 Overall Course Completion',
                assessmentType: 'summary',
                status:         completed === total ? 'completed' : 'pending',
                completionPct:  Math.round((completed / total) * 100),
            });
        }
    });

    res.json(stats);
});

// ── GET /api/admin/courses ───────────────────────────────────────────────────
router.get('/courses', (req, res) => {
    res.json(courses);
});

// ── POST /api/admin/courses ──────────────────────────────────────────────────
router.post('/courses', (req, res) => {
    const { code, name, instructor, term, credits, description, categories } = req.body;

    if (!code || !name || !instructor) {
        return res.status(400).json({ error: 'Code, name and instructor are required.' });
    }

    const newCourse = {
        _id:         String(nextId++),
        code,
        name,
        instructor,
        term:        term || 'Winter 2026',
        credits:     credits || 3,
        description: description || '',
        enabled:     true,
        categories:  categories || [],
    };

    courses.push(newCourse);
    res.status(201).json(newCourse);
});

// ── PUT /api/admin/courses/:id ───────────────────────────────────────────────
router.put('/courses/:id', (req, res) => {
    const course = courses.find(c => c._id === req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found.' });

    const { code, name, instructor, term, credits, description } = req.body;
    if (code)        course.code        = code;
    if (name)        course.name        = name;
    if (instructor)  course.instructor  = instructor;
    if (term)        course.term        = term;
    if (credits)     course.credits     = credits;
    if (description !== undefined) course.description = description;

    res.json(course);
});

// ── DELETE /api/admin/courses/:id ────────────────────────────────────────────
router.delete('/courses/:id', (req, res) => {
    const index = courses.findIndex(c => c._id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Course not found.' });

    courses.splice(index, 1);
    res.json({ message: 'Course deleted.' });
});

// ── PATCH /api/admin/courses/:id/toggle ─────────────────────────────────────
// Flip a course's enabled field true/false
router.patch('/courses/:id/toggle', (req, res) => {
    const course = courses.find(c => c._id === req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found.' });

    course.enabled = !course.enabled;
    res.json({ _id: course._id, enabled: course.enabled });
});

// ── POST /api/admin/courses/:id/categories ───────────────────────────────────
// Add an assessment category (e.g. Assignments 30%, Exams 50%)
router.post('/courses/:id/categories', (req, res) => {
    const course = courses.find(c => c._id === req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found.' });

    const { title, name, type, description, dueDate, weight, totalMarks, status } = req.body;
    const displayName = title || name;

    if (!displayName) return res.status(400).json({ error: 'Assessment title is required.' });
    if (weight === undefined) return res.status(400).json({ error: 'Weight is required.' });

    const totalSoFar = course.categories.reduce((sum, c) => sum + (c.weight || 0), 0);
    if (totalSoFar + weight > 100) {
        return res.status(400).json({ error: `Total weight would exceed 100% (currently ${totalSoFar}%).` });
    }

    const newCategory = {
        _id:         `${course._id}-cat-${Date.now()}`,
        title:       displayName,
        name:        displayName,
        type:        type || 'Assignment',
        description: description || '',
        dueDate:     dueDate || null,
        weight:      weight,
        totalMarks:  totalMarks || 100,
        status:      status || 'pending',
    };

    course.categories.push(newCategory);
    res.status(201).json(newCategory);
});

// ── DELETE /api/admin/courses/:id/categories/:catId ──────────────────────────
router.delete('/courses/:id/categories/:catId', (req, res) => {
    const course = courses.find(c => c._id === req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found.' });

    const index = course.categories.findIndex(a => a._id === req.params.catId);
    if (index === -1) return res.status(404).json({ error: 'Assessment not found.' });

    course.categories.splice(index, 1);
    res.json({ message: 'Assessment deleted.' });
});

module.exports = router;
