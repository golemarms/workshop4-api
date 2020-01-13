const express = require('express');
const auth = require('../middleware/auth');
const City = require('../models/City');
const cacheControl = require('express-cache-controller');
const preconditions = require('express-preconditions');
const range = require('express-range');
const uuidv1 = require('uuid/v1')
const compression = require('compression');

const API_URL = '/api';

const router = express.Router()

// TODO GET /api/states
router.get(`${API_URL}/states`, auth,
    cacheControl({ maxAge: 30, private: false }),
    compression(),
    (req, resp) => {
        console.log(" states .....")
        resp.type('application/json')
        City.find().then((result)=>{
            return resp.status(200).json(result);
        }).catch(error=> {
            return resp.status(400).json({ error: error });
        });
    }
)


// TODO GET /api/state/:state

// etag that returns tags as <state abbrevation><number of cities in state>
// ignoring the Range header
const precondOptions = {
    stateAsync: (req) => 
        City.count({state: req.params.state}, (result)=>{
            console.log("Count >" + result)
            const state = req.params.state.toLowerCase()
            return ({
                etag: `"${state}${result}"`,
            })
        })
}

router.get('/api/state/:state',auth,
    //Ignore the Range header
    preconditions(precondOptions),
    range({ accept: 'items', limit: 20 }),
    compression(),
    (req, resp) => {

        const offset = req.range.first;
        const limit = (req.range.last - req.range.first) + 1
        const state = req.params.state;

        resp.type('application/json')

        Promise.all([ 
                City.find({state: state}, result=>{
                    return (result)
                }).skip(offset).limit(limit),
                City.count({state: req.params.state}, result=>{
                    return (result)
                })
            ])
            .then(results => {
                console.log(results);
                resp.status(206)
                resp.set('Accept-Ranges', 'items')
                resp.set('ETag', `"${state.toLowerCase()}${results[1]}"`)
                resp.range({
                    first: req.range.first,
                    last: req.range.last,
                    length: results[1]
                })
                return resp.json(results[0])
            })
            .catch(error => {
                return resp.status(400).json({ error: error });
            })
    }
    
);


// TODO GET /api/city/:cityId
router.get('/api/city/:cityId',auth,(req, resp) => {
    resp.type('application/json');
    City.find({city_id: req.params.cityId})
    .then((result)=>{
        if(result.length > 0){
            return resp.status(200).json(result);
        }
        return resp.status(400).json({error: `City ${req.params.cityId} not found`});
    }).catch(error =>{
        console.log(error);
        return resp.status(400).json({error:error});
    })
})


// TODO POST /api/city
router.post('/api/city', auth,
    (req, resp) => {
    
    const params = {
        city_id: uuidv1().substring(0, 8),
        city: req.body.city,
        loc: req.body.loc.map(v => parseFloat(v)),
        pop: parseInt(req.body.pop),
        state: req.body.state
    }

    resp.type('application/json')

    City.create(params)
        .then((result) => {
            return resp.status(201).json(result);
        })
        .catch(error => {
            console.error(error);
            return resp.status(400).json({ error: error });
        })
});

// Optional workshop
// TODO HEAD /api/state/:state
// IMPORTANT: HEAD must be place before GET for the
// same resource. Otherwise the GET handler will be invoked
router.head('/api/state/:state', auth, (req, resp) => {
    return resp.type('application/json')
        .set('Accept-Ranges', 'items')
        .set('Accept-Encoding', 'gzip')
        .end()
})

// TODO GET /state/:state/count
router.get('/api/state/:state/count', auth, (req, resp) => {
    resp.type('application/json')
    City.count({state: req.params.state}, result=>{
        return resp.status(200)
                .json({
                    state: req.params.state.toUpperCase(),
                    cities: result
                })
    })
})

// TODO GET /city/:name
router.get('/api/city/:name', auth, (req, resp) => {
    resp.type('application/json')
    City.find({city :req.params.name})
        .then(result => {
            return resp.status(200)
                .json(result)
        })
        .catch(error => {
            return resp.status(400).json({ error: error });
        })
})

module.exports = router