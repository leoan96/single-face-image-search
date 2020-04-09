const express = require('express');
const viewController = require('./../controller/viewController');
const authController = require('./../controller/authController');

const router = express.Router();

router.route('/').get(authController.isLoggedIn, viewController.getHomePage);
router.get('/login', viewController.getLoginForm);
router.get('/signup', viewController.getSignupForm);

module.exports = router;
