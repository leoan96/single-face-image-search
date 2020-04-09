// Import express app (Main application)
const app = require('./app');

// Import mongoose and configure database
const mongoose = require('mongoose');
const DB = process.env.DATABASE_USERNAME;

// Connect to MongoDB
mongoose
	.connect(DB, {
		useCreateIndex: true,
		useFindAndModify: false,
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(() => {
		console.log('Successfully connected to Database!');
	})
	.catch(err => {
		console.log(`Database connection error 💥 : ${err.message}`);
	});

// Handle errors after initial connection
mongoose.connection.on('error', err => {
	console.log(`Mongo connection error 💥 : ${err}`);
});

// Set port variable and listen to port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server listening to port ${PORT}...`);
});
