const express = require('express');
const searchController = require('./../controller/searchController');

const router = express.Router();

router
	.route('/upload')
	.post(searchController.uploadUserQueryImg, searchController.searchImg);

router.route('/results').get(searchController.renderResults);

module.exports = router;
