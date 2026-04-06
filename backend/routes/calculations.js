const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');
const { protect } = require('../middleware/authMiddleware');


// ─── Helper: compute weighted average from an array of assessments ────────────
function computeWeightedAverage(assessments) {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const a of assessments) {
        if (a.earnedMarks !== null && a.totalMarks > 0) {
            const percentage = (a.earnedMarks / a.totalMarks) * 100;
            weightedSum += percentage * a.weight;
            totalWeight += a.weight;
        }
    }

    if (totalWeight === 0) return 0;
    return Math.round((weightedSum / totalWeight) * 100) / 100;
}


// ─── Helper: convert percentage to letter grade and GPA points ────────────────
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


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/courses/:id/average
// Returns the server-calculated weighted average for one course
// ─────────────────────────────────────────────────────────────────────────────
router.get('/courses/:id/average', protect, async (req, res) => {
    try {
        const course = await Course.findOne({
            where: { id: req.params.id, UserId: req.user.id }
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const assessments = await Assessment.findAll({
            where: { CourseId: req.params.id }
        });

        const average = computeWeightedAverage(assessments);
        const gradedAssessments = assessments.filter(a => a.earnedMarks !== null).length;

        res.json({
            courseId: req.params.id,
            average,
            gradedAssessments,
            totalAssessments: assessments.length
        });

    } catch (error) {
        console.error('Error calculating average:', error.message);
        res.status(500).json({ error: 'Server error while calculating average' });
    }
});


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/courses/:id/stats
// Returns average + completed + total for rendering a course card
// Replaces: dataStore.calculateCourseAverage(), getCompletedAssessments(), getTotalAssessments()
// ─────────────────────────────────────────────────────────────────────────────
router.get('/courses/:id/stats', protect, async (req, res) => {
    try {
        const course = await Course.findOne({
            where: { id: req.params.id, UserId: req.user.id }
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const assessments = await Assessment.findAll({
            where: { CourseId: req.params.id }
        });

        const average = computeWeightedAverage(assessments);
        const completed = assessments.filter(a => a.status === 'completed').length;
        const { letter } = percentageToGrade(average);

        res.json({
            courseId: req.params.id,
            average,
            completed,
            total: assessments.length,
            gradeLetter: letter
        });

    } catch (error) {
        console.error('Error fetching course stats:', error.message);
        res.status(500).json({ error: 'Server error while fetching stats' });
    }
});


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/dashboard
// Returns all courses with stats + upcoming assessments in one request
// Called by dashboard.js using window.fetchWithAuth('/api/dashboard')
// ─────────────────────────────────────────────────────────────────────────────
router.get('/dashboard', protect, async (req, res) => {
    try {
        const courses = await Course.findAll({
            where: { UserId: req.user.id }
        });

        if (courses.length === 0) {
            return res.json({ courses: [], upcoming: [] });
        }

        const courseIds = courses.map(c => c.id);

        // Fetch all assessments for all the student's courses in one query
        const allAssessments = await Assessment.findAll({
            where: { CourseId: courseIds }
        });

        // Group assessments by CourseId for fast lookup
        const assessmentsByCourse = {};
        for (const a of allAssessments) {
            if (!assessmentsByCourse[a.CourseId]) {
                assessmentsByCourse[a.CourseId] = [];
            }
            assessmentsByCourse[a.CourseId].push(a);
        }

        // Build course objects enriched with server-computed stats
        const coursesWithStats = courses.map(course => {
            const courseAssessments = assessmentsByCourse[course.id] || [];
            const average = computeWeightedAverage(courseAssessments);
            const completed = courseAssessments.filter(a => a.status === 'completed').length;
            const { letter } = percentageToGrade(average);

            return {
                id: course.id,
                code: course.code,
                name: course.name,
                instructor: course.instructor,
                term: course.term,
                credits: course.credits,
                description: course.description,
                average,
                completed,
                total: courseAssessments.length,
                gradeLetter: letter
            };
        });

        // Upcoming = pending assessments due in the next 30 days
        const now = new Date();
        const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const courseMap = {};
        for (const c of courses) {
            courseMap[c.id] = { code: c.code, name: c.name };
        }

        const upcomingAssessments = await Assessment.findAll({
            where: {
                CourseId: courseIds,
                status: 'pending',
                dueDate: { [Op.between]: [now, thirtyDaysLater] }
            },
            order: [['dueDate', 'ASC']]
        });

        const upcoming = upcomingAssessments.map(a => ({
            id: a.id,
            title: a.title,
            type: a.type,
            dueDate: a.dueDate,
            weight: a.weight,
            status: a.status,
            courseId: a.CourseId,
            courseCode: courseMap[a.CourseId]?.code || '',
            courseName: courseMap[a.CourseId]?.name || ''
        }));

        res.json({ courses: coursesWithStats, upcoming });

    } catch (error) {
        console.error('Error loading dashboard:', error.message);
        res.status(500).json({ error: 'Server error while loading dashboard' });
    }
});


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/gpa  (BONUS — worth extra marks)
// Estimates GPA across all courses using a 4.3-point scale
// Only includes courses that have at least one graded assessment
// ─────────────────────────────────────────────────────────────────────────────
router.get('/gpa', protect, async (req, res) => {
    try {
        const courses = await Course.findAll({
            where: { UserId: req.user.id }
        });

        if (courses.length === 0) {
            return res.json({ gpa: 0, courses: [] });
        }

        const courseIds = courses.map(c => c.id);
        const allAssessments = await Assessment.findAll({
            where: { CourseId: courseIds }
        });

        const assessmentsByCourse = {};
        for (const a of allAssessments) {
            if (!assessmentsByCourse[a.CourseId]) {
                assessmentsByCourse[a.CourseId] = [];
            }
            assessmentsByCourse[a.CourseId].push(a);
        }

        let totalCreditPoints = 0;
        let totalCredits = 0;
        const courseBreakdown = [];

        for (const course of courses) {
            const courseAssessments = assessmentsByCourse[course.id] || [];
            const graded = courseAssessments.filter(a => a.earnedMarks !== null);

            if (graded.length === 0) continue; // skip courses with no marks yet

            const average = computeWeightedAverage(courseAssessments);
            const { letter, points } = percentageToGrade(average);

            totalCreditPoints += points * course.credits;
            totalCredits += course.credits;

            courseBreakdown.push({
                courseId: course.id,
                code: course.code,
                name: course.name,
                credits: course.credits,
                average,
                gradeLetter: letter,
                gradePoints: points
            });
        }

        const gpa = totalCredits > 0
            ? Math.round((totalCreditPoints / totalCredits) * 100) / 100
            : 0;

        res.json({ gpa, courses: courseBreakdown });

    } catch (error) {
        console.error('Error calculating GPA:', error.message);
        res.status(500).json({ error: 'Server error while calculating GPA' });
    }
});


module.exports = router;