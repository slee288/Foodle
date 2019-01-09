var express = require('express');
var router = express.Router();
var Place = require('../models/place');

// Get Homepage
router.get('/', function(req, res){
	Place.find({type: "restaurant"}).sort({'saved': -1}).exec(function(err, allRestaurants) {
			if(err) throw err;
			else {
					Place.find({type: "cafe"}).sort({'saved': -1}).exec(function(err, allCafes) {
							if(err) throw err;
							else {
									Place.find({type: "bar"}).sort({'saved': -1}).exec(function(err, allBars) {
											if(err) throw err
											else {

													res.render('index', {
														currentUser: res.locals.user,
														restaurants: allRestaurants,
														cafes: allCafes,
														bars: allBars
													});
											}
									})
							}
					})
			}
	})
});


module.exports = router;
