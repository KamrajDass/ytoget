var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var videoRouter = require('./routes/video');

var app = express();



app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/video', videoRouter);

app.use(function (_req, res) {
	res.status(404).json({ message: 'Route not found' });
});

app.use(function (err, _req, res, _next) {
	console.error(err);
	res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

module.exports = app;
