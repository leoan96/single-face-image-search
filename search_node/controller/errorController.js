const clone = require('clone');
const AppError = require('./../utils/appError');

const handleCastErrorDB = err => {
	const message = `Invalid ${err.path}: ${err.value}`;
	return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
	const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
	const message = `Duplicate field value: ${value}. Please use another value`;
	return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
	const errors = Object.values(err.errors).map(el => el.message);
	const message = `Invalid input data! ${errors.join('. ')}`;
	return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
	// res.status(err.statusCode).json({
	// 	status: err.status,
	// 	error: err,
	// 	message: err.message,
	// 	stack: err.stack
	// });

	// B. RENDERED WEBSITE
	console.error('Error Development: ', err);
	return res.status(err.statusCode).render('error', {
		title: 'Something went wrong!',
		msg: err.message
	});
};

const sendErrorProd = (err, req, res) => {
	if (err.isOperational) {
		return res.status(err.statusCode).json({
			status: err.status,
			message: err.message
		});
	}

	console.log(`Error 💥 : ${err}`);

	res.status(500).json({
		error: 'error',
		message: 'Something went wrong! Please try again later!'
	});
};

module.exports = (err, req, res, next) => {
	err.statusCode = err.statusCode || 500;
	err.status = err.status || 'error';

	// Error handling during development stage
	if (process.env.NODE_ENV === 'development') {
		sendErrorDev(err, req, res);
	}

	// Error handling during production stage
	if (process.env.NODE_ENV === 'production') {
		let error = clone(err);

		if (error.name === 'CastError') error = handleCastErrorDB(error);
		if (error.code === 11000) error = handleDuplicateFieldsDB(err);
		if (error.name === 'ValidationError') error = handleValidationErrorDB(err);

		sendErrorProd(error, req, res);
	}
};
