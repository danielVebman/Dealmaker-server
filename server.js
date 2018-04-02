const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const db = require('./config/db');
const bodyParser = require('body-parser');

const app = express();

const port = 3000;

app.use(bodyParser.urlencoded({ extended: true}));

MongoClient.connect(db.url, (error, database) => {
	if (error) return console.log(error)
	const collection = database.db('dealmaker').collection('congresspersons');
	require('./routes')(app, collection);

	app.listen(port, () => {});
});
