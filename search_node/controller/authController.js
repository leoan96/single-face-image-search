const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');

const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const signToken = id => {
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN
	});
};

const createSendToken = (user, statusCode, res) => {
	const token = signToken(user.id);
	const cookieOptions = {
		expires: new Date(
			Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
		),
		httpOnly: true
	};

	if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

	res.cookie('jwt', token, cookieOptions);

	user.password = undefined;

	res.status(statusCode).json({
		status: 'success',
		token,
		data: {
			user
		}
	});
};

exports.protect = catchAsync(async (req, res, next) => {
	// 1. Check if token exists and is valid
	let token;
	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith('Bearer')
	) {
		token = req.headers.authorization.split(' ')[1];
	} else if (req.cookies.jwt) {
		token = req.cookies.jwt;
	}

	if (!token) {
		return next(
			new AppError('You are not logged in! Please log in to access!', 401)
		);
	}

	// 2. Decode the token
	const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

	// 3. Check if user still exists after token is issued
	const currentUser = await User.findById(decoded.id);
	console.log('current user : ', currentUser);

	if (!currentUser) {
		return next(
			new AppError('The user belonging to this account no longer exists!', 404)
		);
	}

	// 4. Check if user have changed the password after token is issued
	if (currentUser.changedPasswordAfter(decoded.iat)) {
		return next(
			new AppError('User recently changed password! Please log in again!', 401)
		);
	}

	// Grant access to protected route
	req.user = currentUser;
	res.locals.user = currentUser;
	next();
});

exports.restrictTo = (...roles) => {
	return (req, res, next) => {
		if (!roles.includes(req.user.role)) {
			return next(
				new AppError('You do not have permission to perform this action!', 403)
			);
		}
		next();
	};
};

// Only for rendered pages, there will be no errors!
exports.isLoggedIn = async (req, res, next) => {
	if (req.cookies.jwt) {
		try {
			// 1. Verifies token
			const decoded = await promisify(jwt.verify)(
				req.cookies.jwt,
				process.env.JWT_SECRET
			);

			// 2. Check if user still exists
			const currentUser = await User.findById(decoded.id);
			if (!currentUser) {
				return next();
			}

			// 3. Check if user changed password after the JWT token was issued
			if (currentUser.changedPasswordAfter(decoded.iat)) {
				return next();
			}

			// THERE IS A LOGGED IN USER
			res.locals.user = currentUser;
			return next();
		} catch (err) {
			return next();
		}
	}
	next();
};

exports.signup = catchAsync(async (req, res, next) => {
	const newUser = await User.create({
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		email: req.body.email,
		photo: req.body.photo,
		password: req.body.password,
		passwordConfirm: req.body.passwordConfirm,
		ipAddress: req.ip
	});

	createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return next(new AppError('Please provide email and password!', 400));
	}

	const user = await User.findOne({ email }).select('+password');

	if (!user || !(await user.correctPassword(password, user.password))) {
		return next(new AppError('Incorrect email or password!', 401));
	}

	createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
	res.cookie('jwt', 'loggedout', {
		expires: new Date(Date.now() + 10 * 10000),
		httpOnly: true
	});

	res.status(200).json({ status: 'success' });
};
