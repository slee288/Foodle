var express = require('express');
var router = express.Router({mergeParams: true});
var Place = require('../models/place');
var User = require('../models/user');
var Rate = require('../models/rate');
var middleware = require("../middleware/middleware");
var NodeGeocoder = require("node-geocoder");

var options = {
		provider: 'google',
		httpAdapter: 'https',
		apiKey: process.env.GEOCODER_API_KEY,
		formatter: null
};

var geocoder = NodeGeocoder(options);

// Get Homepage
router.get('/', function(req, res){
	Place.findById(req.params.id, function(err, foundPlace) {
		if(err) throw err;
		else {
				Rate.find({}, function(err, allRatings) {
						// console.log(allRatings);
						if(err) throw err;
						else {
								var avg = 0;
								var placeRatings = foundPlace.ratings;
								var currentPlaceRatings = [];
								for(var i = 0; i < placeRatings.length; i++) {
										for(var j = 0; j < allRatings.length; j++) {
												if(placeRatings[i] == allRatings[j].id) {
														avg += allRatings[j].rate;
														currentPlaceRatings.push(allRatings[j]);
												}
										}
								}
								avg /= placeRatings.length;
								res.render('places/place', { currentUser: res.locals.user,
																						allRatings: currentPlaceRatings,
																						foundPlace: foundPlace,
																						rateAvg: avg,
																						googleKey: process.env.GEOCODER_API_KEY
								});
						}
				});
		}
	})
});

router.post('/', middleware.checkPlaceOwnership, function(req, res) {
		User.findById(res.locals.user.id, function(err, foundUser) {
				if(err) throw err;
				else {
						//console.log(req);
						Place.findById(req.params.id, function(err, place) {
								if(err) throw err;
								else {
										var saves = place.saved + 1;
										var newValue = {$set: {saved: saves}};
										Place.findByIdAndUpdate(place._id, newValue, function(err) {
												if(err) throw err;
										});

										foundUser.savedPlaces.push(place);
										foundUser.save();
										res.redirect("back");
								}
						});
				}
		})
});


// remove restaurant from favorites
router.post("/delete", middleware.ensureAuthenticated, function(req, res) {
		User.findById(res.locals.user.id, function(err, currentUser) {
				if(err) throw err;
				else {
						var places = currentUser.savedPlaces;
						for(var i = 0; i < places.length; i++) {
								if(places[i] == req.params.id) {
										places.splice(i, 1);
										break;
								}
						}

						Place.findById(req.params.id, function(err, place) {
								if(err) throw err;
								else {
										var saves = place.saved - 1;
										var newValue = {$set: {saved: saves}};
										Place.findByIdAndUpdate(place._id, newValue, function(err) {
												if(err) throw err;
										});

										// currentUser.savedPlaces.push(places);
										currentUser.save();
										res.redirect("back");
								}
						});
				}
		})
});


// Rating system
router.post("/rate", middleware.ensureAuthenticated, function(req, res) {
		Place.findById(req.params.id, function(err, place) {
				if(err) {
						throw err;
						res.redirect("back");
				} else {
							Rate.create(req.body.rate, function(err, newRate) {
									if(err) throw err;
									else {

											newRate.byUser = res.locals.user.id;
											newRate.save();

											place.ratings.push(newRate);
											place.save();
											res.redirect("back");
									}
							});
				}
		});
});



module.exports = router;
