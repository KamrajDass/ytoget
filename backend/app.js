var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var videoRouter = require('./routes/video');

var app = express();

// Allow requests from local dev server and the deployed Firebase Hosting site.
// Update FIREBASE_HOSTING_URL env var on Render with your actual Firebase domain
// e.g. https://your-project-id.web.app
const allowedOrigins = [
  'http://localhost:1100',
  process.env.FIREBASE_HOSTING_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. curl, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS: origin not allowed'));
  },
  credentials: true,
}));
app.use(logger('dev'));
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
