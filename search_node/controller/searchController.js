const fs = require('fs').promises;
const path = require('path');
const mkdirp = require('mkdirp');
const AppError = require('./../utils/appError');

// Libraries for RabbitMQ
const amqp = require('amqplib/callback_api');
const uuid = require('uuid');

// Libraries for file upload
const multer = require('multer');

const multerStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'userQueries');
	},
	filename: (req, file, cb) => {
		const ext = file.mimetype.split('/')[1];
		cb(null, `${uuid.v4()}.${ext}`);
	},
});

const multerFilter = (req, file, cb) => {
	if (file.mimetype.startsWith('image')) {
		cb(null, true);
	} else {
		cb(new AppError('Not an image! Please upload only images!', 400), false);
	}
};

const upload = multer({
	storage: multerStorage,
	fileFilter: multerFilter,
});

exports.uploadUserQueryImg = upload.single('query');

exports.searchImg = async (req, res) => {
	// https://stackoverflow.com/questions/46867517/how-to-read-file-with-async-await-properly
	const queryImg = await fs.readFile(req.file.path);

	// Send Remote Procedure Call(RPC) call to python server(search functionality) to retrieve similar images
	// 'amqp://rabbit'
	const connectionString = process.env.RABBITMQ_HOST;
	amqp.connect(connectionString, (err1, connection) => {
		if (err1) throw err1;
		connection.createChannel((err2, channel) => {
			if (err2) throw err2;

			let correlationId;
			channel.assertQueue('', { exclusive: true }, (err3, q) => {
				if (err3) throw err3;
				correlationId = uuid.v4();

				console.log('Processing query image!');

				channel.consume(
					q.queue,
					(msg) => {
						if (msg.properties.correlationId === correlationId) {
							// console.log(` [x] Got message: ${msg.content.toString()}`);
							const results = msg.content.toString().split(',');
							// console.log(results);

							setTimeout(() => {
								connection.close();

								res.status(200).json({
									status: 'success',
									results: msg.content.toString().split(','),
								});
							}, 300);
						}
					},
					{ noAck: true }
				);

				channel.sendToQueue('rpc_queue', queryImg, {
					correlationId: correlationId,
					replyTo: q.queue,
				});
			});
		});
	});
};

exports.renderResults = (req, res) => {
	// https://stackoverflow.com/questions/22080770/i-need-to-create-url-for-get-which-is-going-to-accept-array-how-in-node-js-expr
	let similarImgs = req.query.similarImgs;
	similarImgs = similarImgs.replace(/'/g, '');
	similarImgs = similarImgs.replace(/\[/g, '');
	similarImgs = similarImgs.replace(/\]/g, '');
	similarImgs = similarImgs.split(',');

	similarImgs.forEach((imgPath, index) => {
		similarImgs[index] = path.join('/imgs', imgPath);
	});
	// console.log(similarImgs);

	res.status(200).render('results', {
		similarImgs,
	});
};
