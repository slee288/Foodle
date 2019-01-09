var express         = require("express");
var router          = express.Router();
var User            = require("../models/user");
var middleware      = require("../middleware/middleware");
var Place           = require("../models/place");

//show profile of the user
router.get("/",middleware.ensureAuthenticated, function(req, res){
    //find username with provided id
    User.findById(res.locals.user._id, function(err, foundUser){
        if(err){
            console.log(err);
        }
        else {
            var placeInList;
            var mukList = [];
            Place.find({}, function(err, allPlaces) {
                if(err) throw err;
                else {
                    for(var i = 0; i < foundUser.savedPlaces.length; i++) {
                        allPlaces.forEach(function(place) {
                            if(foundUser.savedPlaces[i] == place.id) {
                                mukList.push(place);
                            }
                        });
                    }

                    //render show tamplate with that user id
                    //with foundUser as user parameter
                    res.render("profiles/profile", {currentUser: res.locals.user, favorites: mukList});
                }

            })
       }
   });

});





module.exports = router;
