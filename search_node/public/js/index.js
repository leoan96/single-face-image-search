import '@babel/polyfill';
import { login, logout } from './login';
import { signup } from './signup';
import axios from 'axios';
import { showAlert } from './alerts';

const queryForm = document.getElementById('queryForm');
const queryImg = document.getElementById('queryImg');
const container = document.querySelector('.mainContainer');
const loginForm = document.querySelector('.form--login');
const signupForm = document.querySelector('.form--signup');
const logoutBtn = document.querySelector('.nav__el--logout');

if (loginForm) {
	loginForm.addEventListener('submit', (e) => {
		e.preventDefault();
		const email = document.getElementById('email').value;
		const password = document.getElementById('password').value;

		login(email, password);
	});
}

if (signupForm) {
	signupForm.addEventListener('submit', (e) => {
		e.preventDefault();
		const firstName = document.getElementById('signupFirstName').value;
		const lastName = document.getElementById('signupLastName').value;
		const email = document.getElementById('signupEmail').value;
		const password = document.getElementById('signupPassword').value;
		const passwordConfirm = document.getElementById('signupPasswordConfirm')
			.value;

		signup(firstName, lastName, email, password, passwordConfirm);
	});
}

if (queryImg) {
	queryImg.addEventListener('change', (e) => {
		e.preventDefault();
		if (e.srcElement.files.length === 1) {
			const image_preview = document.querySelector('.image-preview');
			const image_preview__image = document.querySelector(
				'.image-preview__image'
			);

			const file = e.srcElement.files[0];
			const reader = new FileReader();

			reader.onload = (e) => {
				image_preview__image.src = e.target.result;
				image_preview.style.display = 'flex';
			};

			if (file) {
				reader.readAsDataURL(file);
			}
		}
	});
}

if (queryForm) {
	queryForm.addEventListener('submit', async (e) => {
		e.preventDefault();

		if (!loggedIn) {
			showAlert(
				'error',
				'User need to be logged in to perform search! Please log in!'
			);
		}

		if (loggedIn) {
			const file = queryImg.files[0];
			const form = new FormData();

			form.append('query', file);

			// https://loading.io/asset/353008
			const spinner = `<img src='/img/spinner.svg' class='spinner'>`;
			container.insertAdjacentHTML('beforebegin', spinner);
			try {
				const result = await axios({
					method: 'POST',
					url: '/api/v1/search/upload',
					data: form,
				});
				console.log(`Results : ${result.data}`);

				let imgNames = [];
				result.data.results.forEach((url) => {
					imgNames.push(url.split('/')[url.split('/').length - 1]);
				});

				if (result.data.status === 'success') {
					window.setTimeout(() => {
						location.assign(
							// `/api/v1/search/results?similarImgs=${JSON.stringify(imgNames)}`
							`/api/v1/search/results?similarImgs=${imgNames}`
						);
					}, 400);
				}
			} catch (err) {
				// console.log(`Search error 💥 : ${err}`);
				throw err;
			}
		}
	});
}

if (logoutBtn) {
	logoutBtn.addEventListener('click', logout);
}

// https://github.com/sefyudem/Responsive-Login-Form

const inputs = document.querySelectorAll('.input');

if (inputs) {
	function addcl() {
		let parent = this.parentNode.parentNode;
		parent.classList.add('focus');
	}

	function remcl() {
		let parent = this.parentNode.parentNode;
		if (this.value == '') {
			parent.classList.remove('focus');
		}
	}

	inputs.forEach((input) => {
		input.addEventListener('focus', addcl);
		input.addEventListener('blur', remcl);
	});
}
