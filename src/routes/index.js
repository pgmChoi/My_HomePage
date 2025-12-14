const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Login page
router.get('/', (req, res) => {
    res.render('login');
});

// Signup page
router.get('/signup', (req, res) => {
    res.render('signup');
});

// Handle login
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
    db.query(query, [email, password], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            const user = results[0];
            req.session.user = user; // Store user info in session
            
            res.redirect('/home');
        } else {
            res.render('login', { error: 'Invalid email or password' });
        }
    });
});


router.get('/home', (req, res) => {
    if (!req.session.user) return res.redirect('/');

    const sql = `
        SELECT p.*, d.tech_stack 
        FROM posts p 
        LEFT JOIN project_details d ON p.post_id = d.post_id 
        WHERE p.type = 'project' 
        ORDER BY p.created_at DESC 
        LIMIT 4`; 
    
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.render('home', { 
            title: 'Home', 
            user: req.session.user,
            projects: results
        });
    });
});

// Handle signup
router.post('/signup', (req, res) => {
    const { username, email, password } = req.body;
    const query = 'INSERT INTO users (user_name, email, password) VALUES (?, ?, ?)';
    db.query(query, [username, email, password], (err, results) => {
        if (err) {
            // Basic error handling for duplicate email
            if (err.code === 'ER_DUP_ENTRY') {
                return res.render('signup', { error: 'This email is already registered.' });
            }
            throw err;
        }
        res.redirect('/');
    });
});

// Handle logout
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/board'); // Or handle error appropriately
        }
        res.clearCookie('connect.sid'); // Cookie name may vary
        res.redirect('/');
    });
});

module.exports = router;
