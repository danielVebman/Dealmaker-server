const getCongresspersonsRoutes = require('./get_congresspersons_routes');

module.exports = (app, collection) => {
	getCongresspersonsRoutes(app, collection);
};
