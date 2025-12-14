const express = require('express');
const router = express.Router();
const db = require('../config/db');


// 로그인 체크
const userId = (req, res, next) => {
    if (!req.session.user) return res.redirect('/');
    next();
};

router.get('/', (req, res) => {
    res.redirect('/board/free');
});

// 게시글 목록
router.get('/:type', userId, (req, res) => {
    const { type } = req.params;
    
    // type이 이상한 값이면 자유게시판으로 보냄
    if(type !== 'notice' && type !== 'free') return res.redirect('/board/free');

    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || '';
    const limit = 10;
    const offset = (page - 1) * limit;

    let countSql = 'SELECT COUNT(*) AS count FROM posts WHERE type = ?';
    let listSql = 'SELECT * FROM posts WHERE type = ?';
    let params = [type];

    if (search) {
        countSql += ' AND title LIKE ?';
        listSql += ' AND title LIKE ?';
        params.push(`%${search}%`);
    }

    listSql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

    db.query(countSql, params, (err, countResult) => {
        if (err) throw err;
        const totalPosts = countResult[0].count;
        const totalPages = Math.ceil(totalPosts / limit);

        db.query(listSql, [...params, limit, offset], (err, posts) => {
            if (err) throw err;
            res.render('board/list', {
                title: type === 'notice' ? '공지사항' : '자유게시판',
                user: req.session.user,
                posts,
                currentPage: page,
                totalPages,
                search,
                type 
            });
        });
    });
});

// 글쓰기 폼
router.get('/:type/write', userId, (req, res) => {
    const { type } = req.params;
    const { email } = req.session.user;
    if (managerCheck(type, email, res)) return;

    res.render('board/write', { type, post: null, title: '글쓰기' });
});

// 글쓰기 처리 
router.post('/:type/write', userId, (req, res) => {
    const { type } = req.params;
    const { title, content } = req.body;
    const { user_id, user_name, email } = req.session.user;
    

    if (managerCheck(type, email, res)) return;

    const sql = 'INSERT INTO posts (user_id, type, title, content, author) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [user_id, type, title, content, user_name], (err) => {
        if (err) throw err;
        res.redirect(`/board/${type}`);
    });
});

// 상세 보기
router.get('/:type/view/:id', userId, (req, res) => {
    const { type, id } = req.params;

    db.query('UPDATE posts SET views = views + 1 WHERE post_id = ?', [id], (err) => {
        if (err) throw err;
        
        db.query('SELECT * FROM posts WHERE post_id = ?', [id], (err, results) => {
            if (err) throw err;
            if (results.length === 0) return res.redirect(`/board/${type}`);

            res.render('board/view', { 
                post: results[0], 
                type,
                title: results[0].title 
            });
        });
    });
});

// 수정 폼
router.get('/:type/edit/:id', userId, (req, res) => {
    const { type, id } = req.params;
    db.query('SELECT * FROM posts WHERE post_id = ?', [id], (err, results) => {
        if (err) throw err;
        
        // 권한 체크
        const { email } = req.session.user;

        if (managerCheck(type, email, res)) return;
        
        res.render('board/write', { type, post: results[0], title: '글 수정' });
    });
});

// 수정 처리
router.post('/:type/edit/:id', userId, (req, res) => {
    const { type, id } = req.params;
    const { title, content } = req.body;

    const { email } = req.session.user;

    if (managerCheck(type, email, res)) return;
    
    db.query('UPDATE posts SET title = ?, content = ? WHERE post_id = ?', 
    [title, content, id], (err) => {
        if (err) throw err;
        res.redirect(`/board/${type}/view/${id}`);
    });
});

// 삭제 처리 
router.get('/:type/delete/:id', userId, (req, res) => {
    const { type, id } = req.params;
    const { user_id, email } = req.session.user;

    if (managerCheck(type, email, res)) return;
    
    const isAdmin = (email === 'admin@example.com');

    let sql = 'DELETE FROM posts WHERE post_id = ?';
    let params = [id];

    if (!isAdmin) {
        sql += ' AND user_id = ?';
        params.push(user_id);
    }

    db.query(sql, params, (err) => {
        if (err) throw err;
        res.redirect(`/board/${type}`);
    });
});


// 공지사항 권한 체크 함수
function managerCheck(type, email, res) {
    if (type === 'notice' && email !== 'admin@example.com') {
        res.send('<script>alert("공지사항은 관리자만 이용할 수 있습니다."); location.href="/board/notice";</script>');
        return true; // 차단됨 (true 반환)
    }
    return false; // 통과됨 (false 반환)
}


module.exports = router;