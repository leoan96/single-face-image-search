import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
	try {
		const result = await axios({
			method: 'POST',
			url: '/api/v1/users/login',
			data: {
				email,
				password
			}
		});

		console.log(result.data.status);
		if (result.data.status === 'success') {
			showAlert('success', 'Logged in successfully!');
			window.setTimeout(() => {
				location.assign('/');
			}, 400);
		}
	} catch (err) {
		showAlert('error', 'Incorrect email or password');
	}
};

export const logout = async () => {
	try {
		const result = await axios({
			method: 'GET',
			url: '/api/v1/users/logout'
		});
		if (result.data.status === 'success') location.reload(true);
	} catch (err) {
		showAlert('error', 'Error logging out! Please try again later!');
	}
};
