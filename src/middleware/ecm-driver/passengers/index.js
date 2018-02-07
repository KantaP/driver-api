import Router from 'express'
import Config from '../../../config'
import jwt from 'jsonwebtoken'
import * as Util from '../Util'
import * as action from './actions'
const path = require('path')
const tokenKey = (req, res, next) => {
    let key = req.headers['x-access-token']
    if (key) {
        jwt.verify(key, Config.ecmdriver.ecmKey, function(err, decoded) {
            if (err) {
                return res.json({ code: 0, text: 'Failed to authenticate token.', result: [] })
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded
                next()
            }
        });
    } else {
        res.send({ code: 1, text: 'Not found key', result: [] })
    }
}
const passengers = Router()
passengers.use(tokenKey)

passengers.get('/passengersInRoute/:movement_id', async(req, res) => {
    var movement_id = req.params.movement_id
    var company_code = req.decoded.company_code
    var pathFile = path.resolve('config_env/' + company_code + '.json');
    var companyData = await Util.readConfigFile(pathFile)
    var pool = await Util.initConnection(company_code)
    try {
        var passengers = await action.getPassengersByMovement(movement_id, pool)
        if (passengers.length > 0) {
            passengers = passengers.map((item) => {
                if (item.photo != "") item.photo = companyData.website + 'uploads/passengers/' + item.photo
                return item
            })
        }
        res.send({
            status: true,
            results: passengers,
            err: null
        })
    } catch (err) {
        res.send({
            status: false,
            results: [],
            err: err.message
        })
    }
})

passengers.get('/allPassengerInJob/:quote_id', async(req, res) => {
    var quote_id = req.params.quote_id
    var company_code = req.decoded.company_code
    var pathFile = path.resolve('config_env/' + company_code + '.json');
    var companyData = await Util.readConfigFile(pathFile)
    var pool = await Util.initConnection(company_code)
    try {
        var passengers = await action.getAllPassengerInJob(quote_id, pool)
        if (passengers.length > 0) {
            passengers = passengers.map((item) => {
                if (item.photo != "") item.photo = companyData.website + 'uploads/passengers/' + item.photo
                return item
            })
        }
        res.send({
            status: true,
            results: passengers,
            err: null
        })
    } catch (err) {
        res.send({
            status: false,
            results: [],
            err: err.message
        })
    }
})

passengers.get('/allPassengerInSystem', async(req, res) => {
    var company_code = req.decoded.company_code
    var pathFile = path.resolve('config_env/' + company_code + '.json');
    var companyData = await Util.readConfigFile(pathFile)
    var pool = await Util.initConnection(company_code)
    try {
        var passengers = await action.getAllPassengerInSystem(pool)
        if (passengers.length > 0) {
            passengers = passengers.map((item) => {
                if (item.photo != "") item.photo = companyData.website + 'uploads/passengers/' + item.photo
                return item
            })
        }
        res.send({
            status: true,
            results: passengers,
            err: null
        })
    } catch (err) {
        res.send({
            status: false,
            results: [],
            err: err.message
        })
    }
})

passengers.get('/searchPassenger/:quote_id/:query', async(req, res) => {
    var quote_id = req.params.quote_id
    var query = req.params.query
    var company_code = req.decoded.company_code
    var pathFile = path.resolve('config_env/' + company_code + '.json');
    var companyData = await Util.readConfigFile(pathFile)
    var pool = await Util.initConnection(company_code)
    try {
        var passengers = await action.searchPassenger(query, quote_id, pool)
        if (passengers.length > 0) {
            passengers = passengers.map((item) => {
                if (item.photo != "") item.photo = companyData.website + 'uploads/passengers/' + item.photo
                return item
            })
        }
        res.send({
            status: true,
            results: passengers,
            err: null
        })
    } catch (err) {
        res.send({
            status: false,
            results: [],
            err: err.message
        })
    }
})

passengers.post('/passengerUpdateStatus', async(req, res) => {
    var { passenger_id, status_new, force_login, pickup, action_point_id, timescan, quote_id } = req.body
    var company_code = req.decoded.company_code
    var pool = await Util.initConnection(company_code)
    try {
        var updateResult = await action.updatePassengerStatus(passenger_id, status_new, force_login, pickup, action_point_id, timescan, quote_id, pool)
        var cloneResult = await action.cloneToHistory(passenger_id, pickup, quote_id, pool)
        res.send({
            status: updateResult
        })
    } catch (err) {
        console.log(err)
        res.send({
            status: false
        })
    }
})

// passengers.get('/passengerForFirstMovement/:quote_id/:journey_id', async(req, res) => {
//     var { quote_id, journey_id } = req.params
//     var company_code = req.decoded.company_code
//     var companyData = await Util.getCompanyData(company_code)
//     var pool = await Util.initConnection(company_code)
//     try {
//         var passengers = await action.getPassengerForFirstMovement(quote_id, journey_id, pool)
//         if (passengers.length > 0) {
//             passengers = passengers.map((item) => {
//                 if (item.photo != "") item.photo = companyData.website + 'uploads/passengers/' + item.photo
//                 return item
//             })
//         }
//         res.send({
//             status: true,
//             results: passengers,
//             err: null
//         })
//     } catch (err) {
//         console.log(err)
//         res.send({
//             status: false
//         })
//     }
// })



passengers.get('/passengerQuestions', async(req, res) => {
    var company_code = req.decoded.company_code
    var pool = await Util.initConnection(company_code)
    try {
        var questions = await action.getPassengerQuestions(pool)
        res.send({
            status: true,
            results: questions,
            err: null
        })
    } catch (err) {
        console.log(err)
        res.send({
            status: false,
            results: [],
            err: err.message
        })
    }
})

passengers.post('/addPassengerNote', async(req, res) => {
    var company_code = req.decoded.company_code
    var { quote_id, passenger_id, note, timeAdd } = req.body
    var pool = await Util.initConnection(company_code)
    try {
        var addId = await action.addPassengerNote(quote_id, passenger_id, note, timeAdd, pool)
        res.send({
            status: true,
            results: addId,
            err: null
        })
    } catch (err) {
        console.log(err)
        res.send({
            status: false,
            results: [],
            err: err.message
        })
    }
})

passengers.post('/addPassengerAnswer', async(req, res) => {
    var company_code = req.decoded.company_code
    var { quote_id, passenger_id, answer, movement_id, qut_id } = req.body
    var pool = await Util.initConnection(company_code)
    try {
        var addId = await action.addPassengerAnswer(answer, qut_id, quote_id, movement_id, passenger_id, pool)
        res.send({
            status: true,
            results: addId,
            err: null
        })
    } catch (err) {
        console.log(err)
        res.send({
            status: false,
            results: [],
            err: err.message
        })
    }
})

module.exports = passengers