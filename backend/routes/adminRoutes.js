const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/adminMiddleware');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');
const { Op } = require('sequelize');

// All admin routes require a valid JWT AND admin role
router.use(protect, adminOnly);

// ── GET /api/admin/stats ─────────────────────────────────────────────────────
// Returns completion stats across ALL courses and assessments in the DB
router.get('/stats', async (req, res) => {
    try {
        const courses = await Course.findAll();
        const stats = [];

        for (const course of courses) {
            const assessments = await Assessment.findAll({ where: { CourseId: course.id } });
            const total     = assessments.length;
            const completed = assessments.filter(a => a.status === 'completed').length;

            assessments.forEach(a => {
                const hasMarks = a.earnedMarks !== null && a.totalMarks > 0;
                const marksPct = hasMarks ? Math.round((a.earnedMarks / a.totalMarks) * 100) : null;
                stats.push({
                    courseCode:     course.code,
                    courseName:     course.name,
                    assessmentName: a.title,
                    assessmentType: a.type,
                    status:         a.status,
                    weight:         a.weight,
                    earnedMarks:    a.earnedMarks,
                    totalMarks:     a.totalMarks,
                    marksPct,
                    completionPct:  marksPct !== null ? marksPct : (a.status === 'completed' ? 100 : 0),
                });
            });

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
        }

        res.json(stats);
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Server error fetching stats.' });
    }
});

// ── GET /api/admin/courses ───────────────────────────────────────────────────
// Returns ALL courses in the DB (admin sees everyone's)
router.get('/courses', async (req, res) => {
    try {
        const courses = await Course.findAll({
            include: [{ model: Assessment, as: 'Assessments' }]
        });
        // Shape to match what admin.js expects (_id, categories)
        const shaped = courses.map(c => ({
            _id:         String(c.id),
            code:        c.code,
            name:        c.name,
            instructor:  c.instructor,
            term:        c.term,
            credits:     c.credits,
            description: c.description,
            enabled:     c.enabled,
            categories:  (c.Assessments || []).map(a => ({
                _id:        String(a.id),
                title:      a.title,
                name:       a.title,
                type:       a.type,
                description:a.description,
                dueDate:    a.dueDate,
                weight:     a.weight,
                totalMarks: a.totalMarks,
                status:     a.status,
            })),
        }));
        res.json(shaped);
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({ error: 'Server error fetching courses.' });
    }
});

// ── POST /api/admin/courses ──────────────────────────────────────────────────
router.post('/courses', async (req, res) => {
    try {
        const { code, name, instructor, term, credits, description, categories } = req.body;

        if (!code || !name || !instructor) {
            return res.status(400).json({ error: 'Code, name and instructor are required.' });
        }

        // Admin-created courses are assigned to a shared admin user id (0)
        // or we use the admin's own id — either way students won't own these
        const course = await Course.create({
            code,
            name,
            instructor,
            term:        term || 'Winter 2026',
            credits:     credits || 3,
            description: description || '',
            enabled:     true,
            UserId:      req.user.id,
        });

        // Create any pre-set assessment categories
        if (Array.isArray(categories) && categories.length > 0) {
            for (const cat of categories) {
                await Assessment.create({
                    title:      cat.name || cat.title || 'Assessment',
                    type:       cat.type || 'Assignment',
                    description:'',
                    dueDate:    cat.dueDate || new Date(),
                    weight:     cat.weight || 0,
                    totalMarks: cat.totalMarks || 100,
                    status:     'pending',
                    CourseId:   course.id,
                });
            }
        }

        res.status(201).json({ ...course.toJSON(), _id: String(course.id), categories: [] });
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({ error: 'Server error creating course.' });
    }
});

// ── PUT /api/admin/courses/:id ───────────────────────────────────────────────
router.put('/courses/:id', async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) return res.status(404).json({ error: 'Course not found.' });

        const { code, name, instructor, term, credits, description } = req.body;
        await course.update({
            ...(code        && { code }),
            ...(name        && { name }),
            ...(instructor  && { instructor }),
            ...(term        && { term }),
            ...(credits     && { credits }),
            ...(description !== undefined && { description }),
        });

        res.json({ ...course.toJSON(), _id: String(course.id) });
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({ error: 'Server error updating course.' });
    }
});

// ── DELETE /api/admin/courses/:id ────────────────────────────────────────────
router.delete('/courses/:id', async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) return res.status(404).json({ error: 'Course not found.' });

        await Assessment.destroy({ where: { CourseId: course.id } });
        await course.destroy();

        res.json({ message: 'Course deleted.' });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({ error: 'Server error deleting course.' });
    }
});

// ── PATCH /api/admin/courses/:id/toggle ─────────────────────────────────────
router.patch('/courses/:id/toggle', async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) return res.status(404).json({ error: 'Course not found.' });

        await course.update({ enabled: !course.enabled });
        res.json({ _id: String(course.id), enabled: course.enabled });
    } catch (error) {
        console.error('Toggle course error:', error);
        res.status(500).json({ error: 'Server error toggling course.' });
    }
});

// ── POST /api/admin/courses/:id/categories ───────────────────────────────────
router.post('/courses/:id/categories', async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) return res.status(404).json({ error: 'Course not found.' });

        const { title, name, type, description, dueDate, weight, totalMarks, status } = req.body;
        const displayName = title || name;

        if (!displayName) return res.status(400).json({ error: 'Assessment title is required.' });
        if (weight === undefined) return res.status(400).json({ error: 'Weight is required.' });

        // Check total weight won't exceed 100%
        const existing = await Assessment.findAll({ where: { CourseId: course.id } });
        const totalSoFar = existing.reduce((sum, a) => sum + (a.weight || 0), 0);
        if (totalSoFar + weight > 100) {
            return res.status(400).json({ error: `Total weight would exceed 100% (currently ${totalSoFar}%).` });
        }

        const assessment = await Assessment.create({
            title:      displayName,
            type:       type || 'Assignment',
            description:description || '',
            dueDate:    dueDate || new Date(),
            weight,
            totalMarks: totalMarks || 100,
            status:     status || 'pending',
            CourseId:   course.id,
        });

        res.status(201).json({
            _id:        String(assessment.id),
            title:      assessment.title,
            name:       assessment.title,
            type:       assessment.type,
            description:assessment.description,
            dueDate:    assessment.dueDate,
            weight:     assessment.weight,
            totalMarks: assessment.totalMarks,
            status:     assessment.status,
        });
    } catch (error) {
        console.error('Add assessment error:', error);
        res.status(500).json({ error: 'Server error adding assessment.' });
    }
});

// ── DELETE /api/admin/courses/:id/categories/:catId ──────────────────────────
router.delete('/courses/:id/categories/:catId', async (req, res) => {
    try {
        const assessment = await Assessment.findOne({
            where: { id: req.params.catId, CourseId: req.params.id }
        });
        if (!assessment) return res.status(404).json({ error: 'Assessment not found.' });

        await assessment.destroy();
        res.json({ message: 'Assessment deleted.' });
    } catch (error) {
        console.error('Delete assessment error:', error);
        res.status(500).json({ error: 'Server error deleting assessment.' });
    }
});

module.exports = router;
