const User = require('./../models/userModel');

exports.getAllUsers = async (req, res) => {
	try {
		const users = await User.find().sort('-createdAt');

		res.status(200).json({
			status: 'success',
			data: {
				users
			}
		});
	} catch (err) {
		console.log(`Get All Users error 💥 : ${err}`);
	}
};
