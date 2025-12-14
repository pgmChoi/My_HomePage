const express = require('express');
const bodyparser = require('body-parser');
const path = require('path');
const session = require('express-session');




const app = express();
const port = 3000;

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(bodyparser.urlencoded({ extended : false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

// Routes
const indexRouter = require('./routes/index');
const boardRouter = require('./routes/board');
const adminRouter = require('./routes/admin');
const projectRouter = require('./routes/project'); 

app.use((req, res, next) => {
    res.locals.user = req.session.user || null; 
    next();
});

app.use('/', indexRouter);
app.use('/board', boardRouter);
app.use('/admin', adminRouter);
app.use('/project', projectRouter);



app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});