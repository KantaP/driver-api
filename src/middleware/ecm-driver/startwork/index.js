import Router from 'express'
import Config from '../../../config'
import jwt from 'jsonwebtoken'
import moment from 'moment'
import * as Util from '../Util'
import * as action from './action'


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
const startWork = Router()
startWork.use(tokenKey)

startWork.route('/')
    .post(async(req, res) => {
        var driver_id = req.decoded.id
        var company_code = req.decoded.company_code
        var lat = req.body.lat
        var lng = req.body.lng
        var time = req.body.time

        var pool = await Util.initConnection(company_code)

        var locationName = await action.getLocationName(lat, lng)
        var result = await action.startWork(driver_id, lat, lng, locationName, time, pool)

        var now = moment().format('hh:mmA')
        res.send({ code: 2, text: 'Work Start Time Set: ' + now, result: result })

    })

module.exports = startWork