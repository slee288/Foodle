var User = require("../models/user");
var Place = require("../models/place");

//ALL THE MIDDLEWARE GOES HERE
var middleObj = {};

// Checks if the user already has the place
// saved in the user's database
middleObj.checkPlaceOwnership = function(req, res, next) {
    if(req.isAuthenticated()) {
        User.findById(res.locals.user.id, function(err, currentUser) {
            if(err) {
                throw err;
            }
            else {
                for(var i = 0; i < currentUser.savedPlaces.length; i++) {
                    if(currentUser.savedPlaces[i] == req.params.id) {
                        res.redirect("/");
                    }
                }
                next();
            }
        })
    } else {
        res.redirect("/");
    }
}


//checks login status
middleObj.ensureAuthenticated = function(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		req.flash('error_msg','You are not logged in');
		res.redirect('/login');
	}
}


module.exports = middleObj;
