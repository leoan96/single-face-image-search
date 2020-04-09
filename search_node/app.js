// Import required libraries
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// Import global error handling
const globalAppError = require('./controller/errorController');

// Configure environment variables
const root = path.join(__dirname);
const env_path = path.join(root, '.env');
const dotenv = require('dotenv').config({ path: env_path });

// Import routes
const userRoutes = require('./routes/userRoutes');
const viewRoutes = require('./routes/viewRoutes');
const searchRoutes = require('./routes/searchRoutes');

// Initialized express app
const app = express();

// Enable CORS
app.use(cors());

// Configure view engine and views path
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.set('trust proxy', true);

// Configure body parser and cookie parser
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Enable image file upload

// Set up routes for app
app.use('/', viewRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/search', searchRoutes);

// Set global error handler
app.use(globalAppError);

module.exports = app;
