create database my_homepage DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
use my_homepage;
drop database my_homepage;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    post_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(10) NOT NULL COMMENT 'notice 또는 free',
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(50) NOT NULL,
    views INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE project_details (
    detail_id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    github_url VARCHAR(255) COMMENT '깃허브 리포지토리 주소',
    demo_url VARCHAR(255) COMMENT '배포된 데모 사이트 주소',
    tech_stack VARCHAR(255) COMMENT '사용 기술 (예: Node.js, MySQL)',
    
    -- posts 테이블의 글이 지워지면 이 상세 정보도 같이 지워짐 (CASCADE)
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE
);

INSERT INTO users (email, user_name, password) VALUES ('admin@example.com', 'Admin User', 'adminpass');
-- Insert regular users
INSERT INTO users (email, user_name, password) VALUES ('user1@example.com', 'Test User One', 'password');
INSERT INTO users (email, user_name, password) VALUES ('user2@example.com', 'Test User Two', 'password');

select * from users;
select * from posts;
select * from project_details;