const mongoose = require('mongoose');
const keys = require('../keys.json');
console.info(`Using ${keys.mongo}`);
console.log("mongoose....");
mongoose.set('debug', true);
mongoose.connect(keys.mongo, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: true
});
