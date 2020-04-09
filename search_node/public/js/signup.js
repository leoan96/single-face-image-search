import axios from 'axios';
import { showAlert } from './alerts';

export const signup = async (
	firstName,
	lastName,
	email,
	password,
	passwordConfirm
) => {
	try {
		const result = await axios({
			method: 'POST',
			url: '/api/v1/users/signup',
			data: {
				firstName,
				lastName,
				email,
				password,
				passwordConfirm
			}
		});

		console.log(result.data.status);
		if (result.data.status === 'success') {
			showAlert('success', 'Signed up successfully!');
			window.setTimeout(() => {
				location.assign('/');
			}, 400);
		}
	} catch (err) {
		showAlert('error', 'Sign up failed!');
	}
};
