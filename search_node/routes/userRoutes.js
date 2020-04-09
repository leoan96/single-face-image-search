const express = require('express');
const authController = require('./../controller/authController');
const userController = require('./../controller/userController');

const router = express.Router();

router.route('/signup').post(authController.signup);
router.route('/login').post(authController.login);
router.route('/logout').get(authController.logout);

router
	.route('/')
	.get(
		authController.protect,
		authController.restrictTo('super-admin'),
		userController.getAllUsers
	);

module.exports = router;
