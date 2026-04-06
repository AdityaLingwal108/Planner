const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/adminMiddleware');
const User = require('../models/User');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');
const AssessmentCategory = require('../models/AssessmentCategory');

// All admin routes require a valid JWT AND admin role
router.use(protect, adminOnly);

// Helper to format course for API response (maintains backward compatibility)
const formatCourse = (course) => ({
    _id: String(course.id),
    id: course.id,
    code: course.code,
    name: course.name,
    instructor: course.instructor,
    term: course.term,
    credits: course.credits,
    description: course.description,
    enabled: course.enabled,
    UserId: course.UserId,
    categories: (course.AssessmentCategories || []).map(cat => ({
        _id: String(cat.id),
        id: cat.id,
        title: cat.name,
        name: cat.name,
        weight: cat.weight,
        CourseId: cat.CourseId
    })),
    assessments: (course.Assessments || []).map(a => ({
        _id: String(a.id),
        id: a.id,
        title: a.title,
        type: a.type,
        description: a.description,
        dueDate: a.dueDate,
        weight: a.weight,
        earnedMarks: a.earnedMarks,
        totalMarks: a.totalMarks,
        status: a.status,
        CourseId: a.CourseId
    }))
});

// ── GET /api/admin/stats ─────────────────────────────────────────────────────
// Returns anonymized completion stats for every course/assessment
router.get('/stats', async (req, res) => {
    try {
        const courses = await Course.findAll({
            include: [{ model: Assessment }, { model: AssessmentCategory }]
        });

        const stats = [];

        courses.forEach(course => {
            const assessments = course.Assessments || [];
            const total = assessments.length;
            const completed = assessments.filter(a => a.status === 'completed').length;

            assessments.forEach(a => {
                stats.push({
                    courseCode:     course.code,
                    courseName:     course.name,
                    assessmentName: a.title,
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
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats.' });
    }
});

// ── GET /api/admin/courses ───────────────────────────────────────────────────
router.get('/courses', async (req, res) => {
    try {
        const courses = await Course.findAll({
            include: [{ model: Assessment }, { model: AssessmentCategory }]
        });
        res.json(courses.map(formatCourse));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch courses.' });
    }
});

// ── POST /api/admin/courses ──────────────────────────────────────────────────
router.post('/courses', async (req, res) => {
    try {
        const { code, name, instructor, term, credits, description } = req.body;

        if (!code || !name || !instructor) {
            return res.status(400).json({ error: 'Code, name and instructor are required.' });
        }

        const newCourse = await Course.create({
            code,
            name,
            instructor,
            term: term || 'Winter 2026',
            credits: credits || 3,
            description: description || '',
            enabled: true,
            UserId: req.user.id  // Admin who created it
        });

        // Fetch with associations for response
        const courseWithAssoc = await Course.findByPk(newCourse.id, {
            include: [{ model: Assessment }, { model: AssessmentCategory }]
        });

        res.status(201).json(formatCourse(courseWithAssoc));
    } catch (error) {
        res.status(500).json({ error: 'Failed to create course.' });
    }
});

// ── PUT /api/admin/courses/:id ───────────────────────────────────────────────
router.put('/courses/:id', async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) return res.status(404).json({ error: 'Course not found.' });

        const { code, name, instructor, term, credits, description } = req.body;
        await course.update({
            code: code !== undefined ? code : course.code,
            name: name !== undefined ? name : course.name,
            instructor: instructor !== undefined ? instructor : course.instructor,
            term: term !== undefined ? term : course.term,
            credits: credits !== undefined ? credits : course.credits,
            description: description !== undefined ? description : course.description
        });

        const courseWithAssoc = await Course.findByPk(course.id, {
            include: [{ model: Assessment }, { model: AssessmentCategory }]
        });

        res.json(formatCourse(courseWithAssoc));
    } catch (error) {
        res.status(500).json({ error: 'Failed to update course.' });
    }
});

// ── DELETE /api/admin/courses/:id ────────────────────────────────────────────
router.delete('/courses/:id', async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) return res.status(404).json({ error: 'Course not found.' });

        // Delete associated assessments and categories first
        await Assessment.destroy({ where: { CourseId: course.id } });
        await AssessmentCategory.destroy({ where: { CourseId: course.id } });
        await course.destroy();

        res.json({ message: 'Course deleted.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete course.' });
    }
});

// ── PATCH /api/admin/courses/:id/toggle ─────────────────────────────────────
// Flip a course's enabled field true/false
router.patch('/courses/:id/toggle', async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) return res.status(404).json({ error: 'Course not found.' });

        await course.update({ enabled: !course.enabled });
        res.json({ _id: String(course.id), id: course.id, enabled: course.enabled });
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle course.' });
    }
});

// ── POST /api/admin/courses/:id/categories ───────────────────────────────────
// Add an assessment category (e.g. Assignments 30%, Exams 50%)
router.post('/courses/:id/categories', async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id, {
            include: [{ model: AssessmentCategory }]
        });
        if (!course) return res.status(404).json({ error: 'Course not found.' });

        const { title, name, weight } = req.body;
        const displayName = title || name;

        if (!displayName) return res.status(400).json({ error: 'Category name is required.' });
        if (weight === undefined) return res.status(400).json({ error: 'Weight is required.' });

        const totalSoFar = (course.AssessmentCategories || []).reduce((sum, c) => sum + (c.weight || 0), 0);
        if (totalSoFar + weight > 100) {
            return res.status(400).json({ error: `Total weight would exceed 100% (currently ${totalSoFar}%).` });
        }

        const newCategory = await AssessmentCategory.create({
            name: displayName,
            weight,
            CourseId: course.id
        });

        res.status(201).json({
            _id: String(newCategory.id),
            id: newCategory.id,
            title: newCategory.name,
            name: newCategory.name,
            weight: newCategory.weight,
            CourseId: newCategory.CourseId
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create category.' });
    }
});

// ── DELETE /api/admin/courses/:id/categories/:catId ──────────────────────────
router.delete('/courses/:id/categories/:catId', async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) return res.status(404).json({ error: 'Course not found.' });

        const category = await AssessmentCategory.findOne({
            where: { id: req.params.catId, CourseId: course.id }
        });
        if (!category) return res.status(404).json({ error: 'Category not found.' });

        await category.destroy();
        res.json({ message: 'Category deleted.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete category.' });
    }
});

module.exports = router;
