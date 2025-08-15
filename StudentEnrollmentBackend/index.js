const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Mysql@123!',
    database: 'vidhyarthidb'
});

// Function to determine current semester
function getCurrentSemester() {
    const month = new Date().getMonth() + 1; // 1-12
    const year = new Date().getFullYear();
    if (month >= 1 && month <= 5) return `Spring ${year}`;
    if (month >= 8 && month <= 12) return `Fall ${year}`;
    return `Summer ${year}`;
}

// POST /enrollments
app.post('/enrollments', (req, res) => {
    const { student_id, course_id } = req.body;
    if (!student_id || !course_id) {
        return res.status(400).json({ message: 'Student ID and Course ID are required.' });
    }

    const semester = getCurrentSemester();

    const insertSql = 'INSERT INTO Enrollments (student_id, course_id, semester) VALUES (?, ?, ?)';
    db.query(insertSql, [student_id, course_id, semester], (err, result) => {
        if (err) return res.status(400).json({ message: err.sqlMessage || 'Database error' });

        // Fetch course name immediately after inserting
        const courseSql = 'SELECT course_name FROM Courses WHERE course_id = ?';
        db.query(courseSql, [course_id], (err, courseResult) => {
            if (err) return res.status(500).json({ message: 'Failed to fetch course name' });

            const courseName = courseResult.length > 0 ? courseResult[0].course_name : null;
            res.json({
                message: `Enrollment successful for ${semester}`,
                enrollment_id: result.insertId,
                course_name: courseName
            });
        });
    });
});


app.get('/courses', (req, res) => {
    const sql = 'SELECT course_id, course_name FROM Courses';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch courses' });
        res.json(results);
    });
});

// Optional: GET all enrollments
app.get('/enrollments', (req, res) => {
    const fetchQuery = `
        SELECT s.name AS student_name, c.course_name, e.semester
        FROM Enrollments e
        JOIN Students s ON e.student_id = s.student_id
        JOIN Courses c ON e.course_id = c.course_id
        ORDER BY e.enrollment_id
    `;
    db.query(fetchQuery, (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed fetching enrollments' });
        res.json(data);
    });
});

app.listen(3000, () => console.log('Server running on port 3000'));
