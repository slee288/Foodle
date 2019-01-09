var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var nodemailer		= require("nodemailer");
var bcrypt			= require("bcryptjs");
var crypto			= require("crypto");		//crypto is part of node
var async				= require("async");
// var flasher			=	require("flash");

var User = require('../models/user');

// Register
router.get('/register', function (req, res) {
	res.render('register');
});

// Login
router.get('/login', function (req, res) {
	res.render('login');
});

// Register User
router.post('/register', function (req, res) {
	var firstname = req.body.firstname;
	var lastname = req.body.lastname;
	var email = req.body.email;
	var password = req.body.password;
	var password = req.body.password2;

	var errors = req.validationErrors();

	if (errors) {
		res.render('register', {
			errors: errors
		});
	}
	else {
		//checking if email is already taken
			User.findOne({ email: {
				"$regex": "^" + email + "\\b", "$options": "i"
		}}, function (err, mail) {
				if(err) {
						req.flash("error", "Unknown error occured");
						res.redirect("back");
				}
				if (mail) {
					req.flash("error_msg", "Current email already exists, try with different one");
					res.redirect("back");
				}
				else {
					var newUser = new User({
						firstname: firstname,
						lastname: lastname,
						email: email,
						password: password
					});
					User.createUser(newUser, function (err, user) {
						if (err) throw err;
					});
         	req.flash('success_msg', 'You are registered and can now login');
					res.redirect('/');
				}
			});
	}
});

passport.use(new LocalStrategy(
	function (username, password, done) {
		User.getUserByUsername(username, function (err, user) {
			if (err) throw err;
			if (!user) {
				return done(null, false, { message: 'Invalid username or password' });
			}

			User.comparePassword(password, user.password, function (err, isMatch) {
				if (err) throw err;
				if (isMatch) {
					return done(null, user);
				} else {
					return done(null, false, { message: 'Invalid username or password' });
				}
			});
		});
	}));

passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	User.getUserById(id, function (err, user) {
		done(err, user);
	});
});

router.post('/login',
	passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login', failureFlash: true }),
	function (req, res) {
		res.redirect('/');
	});



// Route for password reset
router.get('/reset', function(req, res) {
		res.render("forget/passEmail");
})

// post method after email has been confirmed
router.post('/reset', function(req, res) {
		// email variable passed from the form
		var userMail = req.body.email;


		// execute series functions in order inside "async"
		async.waterfall([
				function(done) {
						crypto.randomBytes(20, function(err, buf) {
								var token = buf.toString('hex');	// token that will be passed to email
								done(err, token);
						});
				},
				function(token, done) {
						User.findOne({ email: userMail }, function(err, foundUser) {
								if(err) throw err;
								if(!foundUser) {
										req.flash("error", "No account with that email address exists.");
										return res.redirect('/reset');
								}

								// give token and also gives 1 hour to change the password
								foundUser.resetPasswordToken = token;
								foundUser.resetPasswordExpires = Date.now() + 3600000;		// 3600000ms = 1hr
								// save the changed data in User model
								foundUser.save(function(err) {
										done(err, token, foundUser);
								});
						});
				},
				function(token, user, done) {
						// create reusable transporter object using the default SMTP transport
						let transporter = nodemailer.createTransport({
								secure: true,
								service: 'Gmail',
								auth: {
										user: "foodle307Pro@gmail.com", // generated ethereal user
										pass: process.env.NODEMAILER_PW  // generated ethereal password
								}
						});
						// setup email data with unicode symbols
						let mailOptions = {
								from: "foodle307Pro@gmail.com", // sender address
								to: userMail, // list of receivers
								subject: 'Password Reset Request', // Subject line
								text: 'Reset your password from the link below', // plain text body
								html: '<p>Password Reset Form</p>' +
											'<h3>Click the link below to reset your password</h3>' +
											'<a href="http://' + req.headers.host + '/reset/password/' + token + '">reset your password</a>'
						};
						// send mail with defined transport object
						transporter.sendMail(mailOptions, function(err) {
								if(err) {
										req.flash("error_msg", "Failed to send an email; please try again")
								}
								req.flash("success_msg", "Password reset email successfully sent to " + user.email);
								res.redirect("/");
						});
				}
		], function(err) {
			if(err) return next(err);
			res.redirect('/reset');
		});
});


router.get('/reset/password/:token', function(req, res) {
		User.findOne({
			resetPasswordToken: req.params.token,
			// $gt means greater than i.e. data in user's db is greater than the time now
			resetPasswordExpires: { $gt: Date.now() }},
			function(err, foundUser) {
					if(err) throw err;
					if(!foundUser) {
							req.flash("error_msg", "Password reset token is invalid or has expired");
							return res.redirect("/reset");
					}
					res.render("forget/reset", { token: req.params.token });
		});
});

router.post('/reset/password/:token', function(req, res) {
		let passwordR = req.body.password;
		let passwordCR = req.body.password2;


		async.waterfall([
				function(done) {
						User.findOne({
								resetPasswordToken: req.params.token,
								resetPasswordExpires: { $gt: Date.now() }},
								function(err, foundUser) {
										if(err) throw err;
										if(!foundUser) {
												req.flash("error_msg", "Password reset token is invalid or has expired");
												return res.redirect("back");
										}
										if(passwordR === passwordCR) {
												bcrypt.genSalt(10, function(err, salt) {
														if(err) throw err;
														bcrypt.hash(passwordR, salt, function(err, hash) {
																if(err) throw err;
																foundUser.resetPasswordToken = undefined;
																foundUser.resetPasswordExpires = undefined;
																var passwordRefresh = {$set: {password: hash}};
																User.findByIdAndUpdate(foundUser._id, passwordRefresh, function(err) {
																		if(err) throw err;
																});
																req.flash("success_msg", "Password successfully changed and you can now login.");
																res.redirect("/");
														});
											 });
										}
						});
				}
		]);
});


router.get('/logout', function (req, res) {
	req.logout();

	req.flash('success_msg', 'You are logged out');

	res.redirect('/');
});

module.exports = router;
