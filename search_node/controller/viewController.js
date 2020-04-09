exports.getHomePage = (req, res) => {
	res.status(200).render('base', {
		title: 'Search'
	});
};

exports.getLoginForm = (req, res) => {
	res.status(200).render('login', {
		title: 'Log In'
	});
};

exports.getSignupForm = (req, res) => {
	res.status(200).render('signup', {
		title: 'Sign Up'
	});
};
