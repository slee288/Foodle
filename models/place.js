var mongoose = require("mongoose");

//SCHEMA SETUP
var placeSchema = new mongoose.Schema({
    name: String,
    type: String,
    location: {
        type: String,
        unique: true,
        required: true
    },
    gps: String,
    description: String,
    saved: {
      type: Number
    },
    ratings: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Rate"
        }
    ],
    picurl1: String,
    picurl2: String,
    picurl3: String
});

//compile above into a model
module.exports = mongoose.model("Place", placeSchema);
