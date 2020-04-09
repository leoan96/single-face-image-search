const mongoose = require('mongoose');
const validator = require('validator');
const brcypt = require('bcrypt');

const userSchema = new mongoose.Schema(
	{
		firstName: {
			type: String,
			required: [true, 'A user must have first name!'],
			lowercase: true,
			trim: true
		},
		lastName: {
			type: String,
			required: [true, 'A user must have last name!'],
			lowercase: true,
			trim: true
		},
		email: {
			type: String,
			required: [true, 'A user must have email!'],
			unique: true,
			lowercase: true,
			trim: true,
			validate: {
				validator: function(val) {
					return validator.isEmail(val);
				},
				message: 'Incorrect email format!'
			}
		},
		photo: {
			type: String,
			default: 'userDefault.jpg'
		},
		createdAt: {
			type: Date,
			default: Date.now()
		},
		password: {
			type: String,
			required: [true, 'A user must have a password!'],
			select: false
		},
		passwordConfirm: {
			type: String,
			required: [true, 'User must confirm password!'],
			validate: {
				validator: function(val) {
					return this.password === val;
				},
				message: 'Password confirm does not match password!'
			},
			select: false
		},
		active: {
			type: Boolean,
			default: true,
			select: false
		},
		ipAddress: {
			type: [String],
			select: false
		},
		role: {
			type: String,
			default: 'user',
			lowercase: true,
			enum: {
				values: ['user', 'admin', 'super-admin'],
				message: 'Invalid role values!'
			}
		},
		passwordChangeAt: Date,
		passwordChangeToken: Date
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true }
	}
);

// Pre-Hooks
userSchema.pre('save', async function(next) {
	if (!this.isModified('password')) return next();

	this.password = await brcypt.hash(this.password, 14);
	this.passwordConfirm = undefined;
	next();
});

// Static method
userSchema.methods.correctPassword = async (
	candidatePassword,
	userPassword
) => {
	return await brcypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimeStamp) {
	if (this.passwordChangeAt) {
		const changedTimeStamp = parseInt(
			this.passwordChangeAt.getTime() / 1000,
			10
		);
		return changedTimeStamp > JWTTimeStamp;
	}
	return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
