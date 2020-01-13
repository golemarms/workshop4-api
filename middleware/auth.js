const jwt = require('jsonwebtoken')
const User = require('../models/User')
const keys = require('../keys.json');
const auth = async(req, res, next) => {
    console.log("auth ...");
    if(typeof(req.header('Authorization')) === 'undefined'){
        return res.status(401).send({ error: 'Not authorized to access this resource' });
    }
   
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const data = jwt.verify(token, keys.jwt_secret)
        const user = await User.findOne({ _id: data._id, 'tokens.token': token })
        if (!user) {
            return res.status(401).send({ error: 'Not authorized to access this resource' })
        }
        req.user = user
        req.token = token
        next()
    } catch (error) {
        console.log("error!");
        return res.status(401).send({ error: 'Not authorized to access this resource' })
    }

}
module.exports = auth