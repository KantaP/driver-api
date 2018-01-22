import Router from 'express'
import Config from '../../../config'
import jwt from 'jsonwebtoken'
import moment from 'moment'
import vehiclecheck from './vehiclecheck'
import * as Util from '../Util'
import * as _sign from './_sign'
import * as _search from './_search'


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
const vehicle = Router()
vehicle.use(tokenKey)

vehicle.use('/check', vehiclecheck)

vehicle.route('/signin')
    .post(async(req, res) => {
        var driver_id = req.decoded.id
        var vehicle_id = req.body.vehicle_id
        var company_code = req.decoded.company_code
        var lat = req.body.lat
        var lng = req.body.lng
        var now = moment().format('h:mm')

        var pool = await Util.initConnection(company_code)
        var locationName = await _sign.getLocationName(lat, lng)
        try {
            var result = await _sign.signin(driver_id, vehicle_id, lat, lng, locationName, pool)
        } catch (error) {
            res.send({ code: 0, text: 'Cannot connect to server.', result: error })
            return
        }
        res.send({ code: 2, text: 'SIGNED IN TO VEHICLE ', result: result })
    })

vehicle.route('/signout')
    .post(async(req, res) => {
        var driver_id = req.decoded.id
        var vehicle_id = req.body.vehicle_id
        var start_id = req.body.start_id
        var company_code = req.decoded.company_code
        var lat = req.body.lat
        var lng = req.body.lng
        var now = moment().format('h:mm')

        var pool = await Util.initConnection(company_code)
        var locationName = await _sign.getLocationName(lat, lng)
        try {
            var result = await _sign.signout(driver_id, lat, lng, locationName, start_id, pool)
            var veh_name = await _sign.getVehicleName(vehicle_id, pool)
        } catch (error) {
            res.send({ code: 0, text: 'Cannot connect to server.', result: error })
            return
        }

        res.send({ code: 2, text: 'You are signed out of vehicle: ' + veh_name, result: result })

    })

vehicle.route('/list/:type/:querydata')
    .get(async(req, res) => {
        var driver_id = req.decoded.id
        var company_code = req.decoded.company_code
        var type = req.params.type
        var querydata = req.params.querydata

        if (querydata == 'all') {
            querydata = ''
        }

        var pool = await Util.initConnection(company_code)
        try {

            var result = []

            if (type == "id") {
                result = await _search.getVehicleByID(querydata, pool)
            } else {
                result = await _search.getVehicleByName(querydata, pool)
            }

        } catch (error) {
            res.send({ code: 0, text: 'Cannot connect to server.', result: error })
            return
        }

        res.send({ code: 2, text: 'success', result: result })

    })

module.exports = vehicle