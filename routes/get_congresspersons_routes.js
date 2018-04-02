module.exports = (app, collection) => {
	app.get('/congresspersons/', (req, res) => {
		// can specify strength level from [0...9(, 10)] in weightLevel; shouldn't ever get 5 or else no data will return
		// can filter by: chamber/type, party, state/abbrev, (committee?)
		// can indicate topics
		
		try {
			if ('filters' in req.query) var filters = JSON.parse(req.query.filters)
			else var filters = {}
			
			if ('topics' in req.query) var topics = JSON.parse(req.query.topics)
			else var topics = []
			
			if ('weightDecatile' in req.query) var decatile = parseInt(req.query.weightDecatile)
			else var decatile = -1
			
			collection.find(filters).toArray((err, items) => {
				var allWeights = [];
				let people = [];
				
				// Sum relationships and remove unnecessary data
				for (i in items) {
					items[i].relationships = sumRelationships(items[i], topics);
					allWeights = allWeights.concat(Object.values(items[i].relationships));
					delete items[i].committees;
					delete items[i]._id;
					delete items[i].coordinate;
					people.push(items[i]);
				}
			
			
				// Send only connections within decatile
				const sortedAllWeights = allWeights.sort((a, b) => (a - b));
				if (decatile < 10 && decatile >= 0) {
					var lowerThreshold = sortedAllWeights[Math.floor(decatile / 10 * (allWeights.length - 1))];
					var upperThreshold = sortedAllWeights[Math.floor((decatile + 1) / 10 * (allWeights.length - 1))];
				} else if (decatile == -1) {
					var lowerThreshold = 0;
					var upperThreshold = Number.MAX_VALUE;
				} else {
					res.send([]);
					return;
				}
				
				var filteredWeights = [];
				for (i in people) {
					let person = people[i];
					for (relationship in person.relationships) {
						const weight = person.relationships[relationship];
						
						if (weight < lowerThreshold || weight > upperThreshold) delete people[i].relationships[relationship]
						else filteredWeights.push(weight)
					}
				}
				
				// Calculate metadata
				const sortedFilteredWeights = filteredWeights.sort((a, b) => (a - b))
				people.push({
					metadata: {
						minWeight: sortedFilteredWeights[0],
						maxWeight: sortedFilteredWeights[sortedFilteredWeights.length - 1]
					}
				});
				
				// Add all coordinates of congresspersons with type
				collection.find().toArray((err, items) => {
					let coords = {};
					console.log(items);
					for (i in items) {
						const item = items[i];
						coords[item.id] = item.coordinate;
					}
					
					people.push({
						"coordinates": coords
					});

					res.send(people.map(x => JSON.stringify(x)).join('\n'));
				});
			});
		} catch(error) {
			res.send({ 'error': 'Invalid JSON' });
		}
	});
	
	sumRelationships = function(person, topics) {
		let summedRelationships = {};
		let relationships = person.relationships;

		for (topic in relationships) {
			if (topics.length == 0 || topics.includes(topic)) {
				let people = relationships[topic];
				for (person in people) {
					if (person in summedRelationships) summedRelationships[person] += people[person]
					else summedRelationships[person] = people[person]
				}
			}
		}
		return summedRelationships;
	}
	
	app.get('/congresspersons/info/', (req, res) => {
		if ('filters' in req.query) var filters = JSON.parse(req.query.filters)
		else var filters = {}
		
		collection.find(filters).toArray((err, items) => {
			var people = [];
			for (i in items) {
				items[i].relationships = sumRelationships(items[i], []);
				delete items[i].relationships;
				delete items[i]._id;
				people.push(items[i]);
			}
			res.send(people.map(x => JSON.stringify(x)).join('\n'));
		});
	});
}