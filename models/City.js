const mongoose = require('mongoose')
//const validator = require('validator')

/*
{ "city_id" : "01001", "city" : "AGAWAM", "loc" : [ -72.622739, 42.070206 ], "pop" : 15338, "state" : "MA" }*/

const citySchema = mongoose.Schema({
    city_id: {
        type: String,
        required: true,
        trim: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    loc: {
        type: [Number],
        required: true
    },
    pop: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    }
})

const City = mongoose.model('cities', citySchema)


module.exports = City