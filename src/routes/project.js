const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 관리자 권한 체크
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.email === 'admin@example.com') {
        next();
    } else {
        res.send('<script>alert("관리자만 접근 가능합니다."); location.href="/home";</script>');
    }
};

// 1. 프로젝트 목록
router.get('/', (req, res) => {
    const query = `
        SELECT p.*, d.github_url, d.tech_stack 
        FROM posts p 
        LEFT JOIN project_details d ON p.post_id = d.post_id 
        WHERE p.type = 'project' 
        ORDER BY p.created_at DESC`;
        
    db.query(query, (err, results) => {
        if (err) throw err;
        // [변경] 뷰 경로를 'project/list'로 명확히 지정
        res.render('project/list', { 
            title: '전체 프로젝트',
            posts: results,
            user: req.session.user || null,
            search: req.query.search || '', 
            type: 'project',
            currentPage: 1,
            totalPages: 1 
        });
    });
});

// 2. 프로젝트 상세 보기
router.get('/view/:id', (req, res) => {
    const { id } = req.params;

    // [추가] 유효성 검사: id가 숫자가 아니면 경고창 띄우고 목록으로 보냄
    if (isNaN(id)) {
        return res.send('<script>alert("올바르지 않은 접근입니다."); location.href="/project";</script>');
    }

    // 조회수 증가
    db.query('UPDATE posts SET views = views + 1 WHERE post_id = ?', [id], (err) => {
        // 만약 여기서 에러가 나더라도 서버가 죽지 않도록 예외 처리
        if (err) { //
            console.error(err);
            return res.send('<script>alert("데이터베이스 오류가 발생했습니다."); location.href="/project";</script>');
        } 

        // 상세 정보 조회
        const query = `
            SELECT p.*, d.github_url, d.demo_url, d.tech_stack
            FROM posts p
            LEFT JOIN project_details d ON p.post_id = d.post_id
            WHERE p.post_id = ?`;

        db.query(query, [id], (err, results) => {
            if (err) throw err;
            if (results.length === 0) return res.redirect('/project');

            res.render('project/view', { 
                title: results[0].title,
                project: results[0],
                user: req.session.user
            });
        });
    });
});

// 3. 글쓰기 폼
router.get('/write', isAdmin, (req, res) => {
    res.render('project/write', { 
        title: '새 프로젝트 등록',
        project: null 
    });
});

// 4. 글쓰기 처리
router.post('/write', isAdmin, (req, res) => {
    const { title, content, github_url, demo_url, tech_stack } = req.body;
    const { user_id, user_name } = req.session.user;

    const postSql = 'INSERT INTO posts (user_id, type, title, content, author) VALUES (?, "project", ?, ?, ?)';
    db.query(postSql, [user_id, title, content, user_name], (err, result) => {
        if (err) throw err;

        const newPostId = result.insertId;
        const detailSql = 'INSERT INTO project_details (post_id, github_url, demo_url, tech_stack) VALUES (?, ?, ?, ?)';
        
        db.query(detailSql, [newPostId, github_url, demo_url, tech_stack], (err) => {
            if (err) throw err;
            res.redirect('/project');
        });
    });
});

// 5. 수정 폼
router.get('/edit/:id', isAdmin, (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT p.*, d.github_url, d.demo_url, d.tech_stack 
        FROM posts p 
        LEFT JOIN project_details d ON p.post_id = d.post_id 
        WHERE p.post_id = ?`;
        
    db.query(query, [id], (err, results) => {
        if (err) throw err;
        res.render('project/write', { 
            title: '프로젝트 수정',
            project: results[0] 
        });
    });
});

// 6. 수정 처리
router.post('/edit/:id', isAdmin, (req, res) => {
    const { id } = req.params;
    const { title, content, github_url, demo_url, tech_stack } = req.body;

    db.query('UPDATE posts SET title = ?, content = ? WHERE post_id = ?', [title, content, id], (err) => {
        if (err) throw err;

        const detailSql = `
            INSERT INTO project_details (post_id, github_url, demo_url, tech_stack) 
            VALUES (?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE 
            github_url = VALUES(github_url), 
            demo_url = VALUES(demo_url), 
            tech_stack = VALUES(tech_stack)`;

        db.query(detailSql, [id, github_url, demo_url, tech_stack], (err) => {
            if (err) throw err;
            res.redirect(`/project/view/${id}`);
        });
    });
});

// 7. 삭제 (Foreign Key CASCADE 덕분에 posts만 지워도 details가 자동 삭제됨)
router.get('/delete/:id', isAdmin, (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM posts WHERE post_id = ?', [id], (err) => {
        if (err) throw err;
        res.redirect('/project');
    });
});

module.exports = router;