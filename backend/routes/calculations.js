const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');
const { protect } = require('../middleware/authMiddleware');

// ─── Helper: weighted average ─────────────────────────────────────────────────
function computeWeightedAverage(assessments) {
    let totalWeight = 0, weightedSum = 0;
    for (const a of assessments) {
        if (a.earnedMarks !== null && a.totalMarks > 0) {
            weightedSum += (a.earnedMarks / a.totalMarks) * 100 * a.weight;
            totalWeight += a.weight;
        }
    }
    return totalWeight === 0 ? 0 : Math.round((weightedSum / totalWeight) * 100) / 100;
}

// ─── Helper: letter grade ─────────────────────────────────────────────────────
function percentageToGrade(avg) {
    if (avg >= 90) return { letter: 'A+', points: 4.3 };
    if (avg >= 85) return { letter: 'A',  points: 4.0 };
    if (avg >= 80) return { letter: 'A-', points: 3.7 };
    if (avg >= 77) return { letter: 'B+', points: 3.3 };
    if (avg >= 73) return { letter: 'B',  points: 3.0 };
    if (avg >= 70) return { letter: 'B-', points: 2.7 };
    if (avg >= 67) return { letter: 'C+', points: 2.3 };
    if (avg >= 63) return { letter: 'C',  points: 2.0 };
    if (avg >= 60) return { letter: 'C-', points: 1.7 };
    if (avg >= 57) return { letter: 'D+', points: 1.3 };
    if (avg >= 53) return { letter: 'D',  points: 1.0 };
    if (avg >= 50) return { letter: 'D-', points: 0.7 };
    return { letter: 'F', points: 0.0 };
}

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT COURSE CRUD
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/courses — all enabled courses (admin creates, students view)
router.get('/courses', protect, async (req, res) => {
    try {
        const courses = await Course.findAll({ where: { enabled: true } });
        res.json(courses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching courses.' });
    }
});

// POST /api/courses — create a course
router.post('/courses', protect, async (req, res) => {
    try {
        const { code, name, instructor, term, credits, description } = req.body;
        if (!code || !name || !instructor) {
            return res.status(400).json({ error: 'Code, name and instructor are required.' });
        }
        const course = await Course.create({
            code, name, instructor,
            term:        term || 'Winter 2026',
            credits:     credits || 3,
            description: description || '',
            enabled:     true,
            UserId:      req.user.id,
        });
        res.status(201).json(course);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error creating course.' });
    }
});

// PUT /api/courses/:id — update a course
router.put('/courses/:id', protect, async (req, res) => {
    try {
        const course = await Course.findOne({ where: { id: req.params.id, UserId: req.user.id } });
        if (!course) return res.status(404).json({ error: 'Course not found.' });

        const { code, name, instructor, term, credits, description } = req.body;
        await course.update({ code, name, instructor, term, credits, description });
        res.json(course);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error updating course.' });
    }
});

// DELETE /api/courses/:id — delete a course and its assessments
router.delete('/courses/:id', protect, async (req, res) => {
    try {
        const course = await Course.findOne({ where: { id: req.params.id, UserId: req.user.id } });
        if (!course) return res.status(404).json({ error: 'Course not found.' });

        await Assessment.destroy({ where: { CourseId: course.id } });
        await course.destroy();
        res.json({ message: 'Course deleted.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error deleting course.' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT ASSESSMENT CRUD
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/courses/:id/assessments — all assessments for a course
router.get('/courses/:id/assessments', protect, async (req, res) => {
    try {
        const course = await Course.findOne({ where: { id: req.params.id, enabled: true } });
        if (!course) return res.status(404).json({ error: 'Course not found.' });

        const assessments = await Assessment.findAll({ where: { CourseId: course.id } });
        res.json(assessments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching assessments.' });
    }
});

// POST /api/courses/:id/assessments — add an assessment
router.post('/courses/:id/assessments', protect, async (req, res) => {
    try {
        const course = await Course.findOne({ where: { id: req.params.id, enabled: true } });
        if (!course) return res.status(404).json({ error: 'Course not found.' });

        const { title, type, description, dueDate, weight, totalMarks, status, earnedMarks } = req.body;
        if (!title || !type || !dueDate || weight === undefined || !totalMarks) {
            return res.status(400).json({ error: 'title, type, dueDate, weight, and totalMarks are required.' });
        }

        const assessment = await Assessment.create({
            title, type,
            description: description || '',
            dueDate,
            weight,
            totalMarks,
            earnedMarks: earnedMarks ?? null,
            status:      status || 'pending',
            CourseId:    course.id,
        });
        res.status(201).json(assessment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error creating assessment.' });
    }
});

// PUT /api/courses/:id/assessments/:aid — update an assessment (including entering marks)
router.put('/courses/:id/assessments/:aid', protect, async (req, res) => {
    try {
        const course = await Course.findOne({ where: { id: req.params.id, enabled: true } });
        if (!course) return res.status(404).json({ error: 'Course not found.' });

        const assessment = await Assessment.findOne({ where: { id: req.params.aid, CourseId: course.id } });
        if (!assessment) return res.status(404).json({ error: 'Assessment not found.' });

        const { title, type, description, dueDate, weight, totalMarks, earnedMarks, status } = req.body;
        await assessment.update({
            ...(title       !== undefined && { title }),
            ...(type        !== undefined && { type }),
            ...(description !== undefined && { description }),
            ...(dueDate     !== undefined && { dueDate }),
            ...(weight      !== undefined && { weight }),
            ...(totalMarks  !== undefined && { totalMarks }),
            ...(earnedMarks !== undefined && { earnedMarks }),
            ...(status      !== undefined && { status }),
        });
        res.json(assessment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error updating assessment.' });
    }
});

// DELETE /api/courses/:id/assessments/:aid — delete an assessment
router.delete('/courses/:id/assessments/:aid', protect, async (req, res) => {
    try {
        const course = await Course.findOne({ where: { id: req.params.id, enabled: true } });
        if (!course) return res.status(404).json({ error: 'Course not found.' });

        const assessment = await Assessment.findOne({ where: { id: req.params.aid, CourseId: course.id } });
        if (!assessment) return res.status(404).json({ error: 'Assessment not found.' });

        await assessment.destroy();
        res.json({ message: 'Assessment deleted.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error deleting assessment.' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STATS & CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/courses/:id/average
router.get('/courses/:id/average', protect, async (req, res) => {
    try {
        const course = await Course.findOne({ where: { id: req.params.id } });
        if (!course) return res.status(404).json({ error: 'Course not found.' });

        const assessments = await Assessment.findAll({ where: { CourseId: req.params.id } });
        const average = computeWeightedAverage(assessments);

        res.json({
            courseId: req.params.id,
            average,
            gradedAssessments: assessments.filter(a => a.earnedMarks !== null).length,
            totalAssessments:  assessments.length,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error calculating average.' });
    }
});

// GET /api/courses/:id/stats
router.get('/courses/:id/stats', protect, async (req, res) => {
    try {
        const course = await Course.findOne({ where: { id: req.params.id, UserId: req.user.id } });
        if (!course) return res.status(404).json({ error: 'Course not found.' });

        const assessments = await Assessment.findAll({ where: { CourseId: req.params.id } });
        const average   = computeWeightedAverage(assessments);
        const completed = assessments.filter(a => a.status === 'completed').length;
        const { letter } = percentageToGrade(average);

        res.json({ courseId: req.params.id, average, completed, total: assessments.length, gradeLetter: letter });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching stats.' });
    }
});

// GET /api/dashboard
router.get('/dashboard', protect, async (req, res) => {
    try {
        // Students see ALL enabled courses (admin-created), plus their own
        const courses = await Course.findAll({ where: { enabled: true } });
        if (courses.length === 0) return res.json({ courses: [], upcoming: [] });

        const courseIds = courses.map(c => c.id);
        const allAssessments = await Assessment.findAll({ where: { CourseId: courseIds } });

        const byCourse = {};
        for (const a of allAssessments) {
            if (!byCourse[a.CourseId]) byCourse[a.CourseId] = [];
            byCourse[a.CourseId].push(a);
        }

        const coursesWithStats = courses.map(course => {
            const ca = byCourse[course.id] || [];
            const average   = computeWeightedAverage(ca);
            const completed = ca.filter(a => a.status === 'completed').length;
            const { letter } = percentageToGrade(average);
            return {
                id: course.id, code: course.code, name: course.name,
                instructor: course.instructor, term: course.term,
                credits: course.credits, description: course.description,
                average, completed, total: ca.length, gradeLetter: letter,
            };
        });

        const now = new Date();
        const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const courseMap = {};
        for (const c of courses) courseMap[c.id] = { code: c.code, name: c.name };

        const upcomingAssessments = await Assessment.findAll({
            where: { CourseId: courseIds, status: 'pending', dueDate: { [Op.between]: [now, thirtyDaysLater] } },
            order: [['dueDate', 'ASC']],
        });

        const upcoming = upcomingAssessments.map(a => ({
            id: a.id, title: a.title, type: a.type, dueDate: a.dueDate,
            weight: a.weight, status: a.status, courseId: a.CourseId,
            courseCode: courseMap[a.CourseId]?.code || '',
            courseName: courseMap[a.CourseId]?.name || '',
        }));

        res.json({ courses: coursesWithStats, upcoming });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error loading dashboard.' });
    }
});

// GET /api/gpa
router.get('/gpa', protect, async (req, res) => {
    try {
        const courses = await Course.findAll({ where: { enabled: true } });
        if (courses.length === 0) return res.json({ gpa: 0, courses: [] });

        const courseIds = courses.map(c => c.id);
        const allAssessments = await Assessment.findAll({ where: { CourseId: courseIds } });

        const byCourse = {};
        for (const a of allAssessments) {
            if (!byCourse[a.CourseId]) byCourse[a.CourseId] = [];
            byCourse[a.CourseId].push(a);
        }

        let totalCreditPoints = 0, totalCredits = 0;
        const courseBreakdown = [];

        for (const course of courses) {
            const ca = byCourse[course.id] || [];
            if (ca.filter(a => a.earnedMarks !== null).length === 0) continue;
            const average = computeWeightedAverage(ca);
            const { letter, points } = percentageToGrade(average);
            totalCreditPoints += points * course.credits;
            totalCredits += course.credits;
            courseBreakdown.push({ courseId: course.id, code: course.code, name: course.name, credits: course.credits, average, gradeLetter: letter, gradePoints: points });
        }

        res.json({ gpa: totalCredits > 0 ? Math.round((totalCreditPoints / totalCredits) * 100) / 100 : 0, courses: courseBreakdown });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error calculating GPA.' });
    }
});

module.exports = router;
