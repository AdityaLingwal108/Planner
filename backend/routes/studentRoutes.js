const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');
const AssessmentCategory = require('../models/AssessmentCategory');

// All routes require JWT authentication
router.use(protect);

// ==================== COURSES ====================

// GET all courses for logged-in user
router.get('/courses', async (req, res) => {
    try {
        const courses = await Course.findAll({
            where: { UserId: req.user.id },
            include: [{ model: Assessment }, { model: AssessmentCategory }]
        });
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch courses.' });
    }
});

// GET single course by ID (only if owned by user)
router.get('/courses/:id', async (req, res) => {
    try {
        const course = await Course.findOne({
            where: { id: req.params.id, UserId: req.user.id },
            include: [{ model: Assessment }, { model: AssessmentCategory }]
        });
        if (!course) {
            return res.status(404).json({ error: 'Course not found.' });
        }
        res.json(course);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch course.' });
    }
});

// POST create new course
router.post('/courses', async (req, res) => {
    try {
        const { code, name, instructor, term, credits, description } = req.body;

        if (!code || !name || !instructor || !term) {
            return res.status(400).json({ error: 'Code, name, instructor, and term are required.' });
        }

        const course = await Course.create({
            code,
            name,
            instructor,
            term,
            credits: credits || 3,
            description: description || '',
            UserId: req.user.id
        });

        res.status(201).json(course);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create course.' });
    }
});

// PUT update course
router.put('/courses/:id', async (req, res) => {
    try {
        const course = await Course.findOne({
            where: { id: req.params.id, UserId: req.user.id }
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found.' });
        }

        const { code, name, instructor, term, credits, description, enabled } = req.body;
        await course.update({
            code: code !== undefined ? code : course.code,
            name: name !== undefined ? name : course.name,
            instructor: instructor !== undefined ? instructor : course.instructor,
            term: term !== undefined ? term : course.term,
            credits: credits !== undefined ? credits : course.credits,
            description: description !== undefined ? description : course.description,
            enabled: enabled !== undefined ? enabled : course.enabled
        });

        res.json(course);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update course.' });
    }
});

// DELETE course
router.delete('/courses/:id', async (req, res) => {
    try {
        const course = await Course.findOne({
            where: { id: req.params.id, UserId: req.user.id }
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found.' });
        }

        // Delete associated assessments and categories first
        await Assessment.destroy({ where: { CourseId: course.id } });
        await AssessmentCategory.destroy({ where: { CourseId: course.id } });
        await course.destroy();

        res.json({ message: 'Course deleted successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete course.' });
    }
});

// ==================== ASSESSMENTS ====================

// GET all assessments for a course
router.get('/courses/:courseId/assessments', async (req, res) => {
    try {
        const course = await Course.findOne({
            where: { id: req.params.courseId, UserId: req.user.id }
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found.' });
        }

        const assessments = await Assessment.findAll({
            where: { CourseId: req.params.courseId }
        });

        res.json(assessments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch assessments.' });
    }
});

// POST create assessment
router.post('/courses/:courseId/assessments', async (req, res) => {
    try {
        const course = await Course.findOne({
            where: { id: req.params.courseId, UserId: req.user.id }
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found.' });
        }

        const { title, type, description, dueDate, weight, totalMarks } = req.body;

        if (!title || !type || !dueDate || weight === undefined || !totalMarks) {
            return res.status(400).json({ error: 'Title, type, dueDate, weight, and totalMarks are required.' });
        }

        const assessment = await Assessment.create({
            title,
            type,
            description: description || '',
            dueDate,
            weight,
            totalMarks,
            CourseId: req.params.courseId
        });

        res.status(201).json(assessment);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create assessment.' });
    }
});

// PUT update assessment
router.put('/assessments/:id', async (req, res) => {
    try {
        const assessment = await Assessment.findByPk(req.params.id, {
            include: [{ model: Course }]
        });

        if (!assessment || assessment.Course.UserId !== req.user.id) {
            return res.status(404).json({ error: 'Assessment not found.' });
        }

        const { title, type, description, dueDate, weight, earnedMarks, totalMarks, status } = req.body;
        await assessment.update({
            title: title !== undefined ? title : assessment.title,
            type: type !== undefined ? type : assessment.type,
            description: description !== undefined ? description : assessment.description,
            dueDate: dueDate !== undefined ? dueDate : assessment.dueDate,
            weight: weight !== undefined ? weight : assessment.weight,
            earnedMarks: earnedMarks !== undefined ? earnedMarks : assessment.earnedMarks,
            totalMarks: totalMarks !== undefined ? totalMarks : assessment.totalMarks,
            status: status !== undefined ? status : assessment.status
        });

        res.json(assessment);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update assessment.' });
    }
});

// DELETE assessment
router.delete('/assessments/:id', async (req, res) => {
    try {
        const assessment = await Assessment.findByPk(req.params.id, {
            include: [{ model: Course }]
        });

        if (!assessment || assessment.Course.UserId !== req.user.id) {
            return res.status(404).json({ error: 'Assessment not found.' });
        }

        await assessment.destroy();
        res.json({ message: 'Assessment deleted successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete assessment.' });
    }
});

// ==================== ASSESSMENT CATEGORIES ====================

// GET all categories for a course
router.get('/courses/:courseId/categories', async (req, res) => {
    try {
        const course = await Course.findOne({
            where: { id: req.params.courseId, UserId: req.user.id }
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found.' });
        }

        const categories = await AssessmentCategory.findAll({
            where: { CourseId: req.params.courseId }
        });

        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories.' });
    }
});

// POST create category
router.post('/courses/:courseId/categories', async (req, res) => {
    try {
        const course = await Course.findOne({
            where: { id: req.params.courseId, UserId: req.user.id }
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found.' });
        }

        const { name, weight } = req.body;

        if (!name || weight === undefined) {
            return res.status(400).json({ error: 'Name and weight are required.' });
        }

        const category = await AssessmentCategory.create({
            name,
            weight,
            CourseId: req.params.courseId
        });

        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create category.' });
    }
});

// PUT update category
router.put('/categories/:id', async (req, res) => {
    try {
        const category = await AssessmentCategory.findByPk(req.params.id, {
            include: [{ model: Course }]
        });

        if (!category || category.Course.UserId !== req.user.id) {
            return res.status(404).json({ error: 'Category not found.' });
        }

        const { name, weight } = req.body;
        await category.update({
            name: name !== undefined ? name : category.name,
            weight: weight !== undefined ? weight : category.weight
        });

        res.json(category);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update category.' });
    }
});

// DELETE category
router.delete('/categories/:id', async (req, res) => {
    try {
        const category = await AssessmentCategory.findByPk(req.params.id, {
            include: [{ model: Course }]
        });

        if (!category || category.Course.UserId !== req.user.id) {
            return res.status(404).json({ error: 'Category not found.' });
        }

        await category.destroy();
        res.json({ message: 'Category deleted successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete category.' });
    }
});

module.exports = router;
