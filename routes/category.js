var express = require('express');
var router = express.Router({mergeParams: true});
var Place = require('../models/place');
var User = require('../models/user');
var nodemailer = require("nodemailer");
var middleware = require("../middleware/middleware");

//Main category page
router.get("/:type", function(req, res) {
    var catType = req.params.type.substring(0, req.params.type.length - 1);
    Place.find({type: catType}, function(err, allPlaces) {
        if(err) throw err;
        else {
              res.render('categories/category', {
                allPlaces: allPlaces,
                currentUser: res.locals.user
              });
        }
    });
});

router.post("/", middleware.ensureAuthenticated, function(req, res) {

    const output = `
      <p>You have a new location add request</p>
      <h3>Contact Details</h3>
      <ul>
        <li>Name: ${req.body.name}</li>
        <li>Type: ${req.body.restaurant}</li>
        <li>Type: ${req.body.address}</li>
      </ul>
      <h3>Message</h3>
      <p>${req.body.extra}</p>
    `;

      // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        secure: true,
        service: 'Gmail',
        auth: {
            user: "foodle307Pro@gmail.com", // generated ethereal user
            pass: process.env.NODEMAILER_PW  // generated ethereal password
        }
        // tls:{
        //   rejectUnauthorized:false
        // }
    });

    // setup email data with unicode symbols
    let mailOptions = {
        from: res.locals.user.email, // sender address
        to: 'sang.m.lee@mail.mcgill.ca', // list of receivers
        subject: 'Node Contact Request', // Subject line
        text: 'You have a new location request', // plain text body
        html: output // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(err) {
        if(err) {
            throw err;
            req.flash("error_msg", "Failed to send an email. Please try again");
        }
        req.flash("success_msg", "Email has been successfully sent");
        res.redirect("back");
  });
});



module.exports = router;
