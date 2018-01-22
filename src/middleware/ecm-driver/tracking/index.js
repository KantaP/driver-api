import Router from 'express'
import express from 'express'
import Config from '../../../config'
import jwt from 'jsonwebtoken'
import * as Util from '../Util'
import { locale } from 'moment';
// import async from 'async'


const tokenKey = (req, res, next) => {
    let key = req.headers['x-access-token']
    if (key) {
        jwt.verify(key, Config.ecmdriver.ecmKey, (err, decoded) => {
            if (err) {
                return res.json({ code: 0, text: 'Failed to authenticate token.', result: [] })
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded
                next()
            }
        })
    } else {
        res.send({ code: 1, text: 'Not found key', result: [] })
    }
}

const tracking = Router()

tracking.use(tokenKey)

tracking.route('/')
    .post(async(req, res) => {
        var { quote_id, movement_id, lat, lng, status, speed, time_log, journey_id, timestamp, duration } = req.body
        var driver_id = req.decoded.id
        var company_code = req.decoded.company_code
        var pool = await Util.initConnection(company_code)
        let place = await Util.getLocationName(lat, lng)

        // var moment = require('moment')
        // var UKtime = moment().utc().format()

        /*var UKtime = time_log*/

        let sql = `INSERT INTO tb_tracking SET j_id = ?, quote_id = ?, movement_id = ? , driver_id = ?,lat = ?, lng = ?, speed = ?,progress = ?, timestamp = ?, duration = ?,location = ?`

        console.log(sql)
        console.log("-----")
        pool.getConnection((err, connection) => {
            if (err) console.log(err)

            connection.query(sql, [journey_id, quote_id, movement_id, driver_id, lat, lng, speed, status, timestamp, duration, place], (err, rows, field) => {
                connection.destroy()
                if (err) {
                    //throw err
                    console.log(err)
                    return res.json({ code: 0, text: 'Cannot connect to server.', result: [err] })
                }
                if (rows.affectedRows > 0) {
                    console.log("Your tracking has been sent.")
                    return res.json({ code: 2, text: 'Your tracking has been sent.', result: [sql] })
                } else {
                    console.log(rows)
                    return res.json({ code: 0, text: 'Failed to send tracking .', result: [] })
                }
            })

        })

    })

module.exports = tracking