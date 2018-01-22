import Router from 'express'
import express from 'express'
import Config from '../../../config'
import jwt from 'jsonwebtoken'
import mysql from 'mysql'
import async from 'async'
import * as action from './action'
import request from 'request'
import * as Util from '../Util'
import moment from 'moment'

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

const messageRoute = Router()

messageRoute.use(tokenKey)

messageRoute.route('/')
    .get(async(req, res) => {

        var driver_id = req.decoded.id
        var company_code = req.decoded.company_code

        console.log("Driver_ID", driver_id)

        var pool = await Util.initConnection(company_code)

        async.waterfall([
                callback => {
                    pool.getConnection((err, connection) => {
                        console.log("pool connection error:", err)
                        connection.query(`SELECT * FROM tb_category_driver_canned_messages`, (err, rows, fields) => {
                            connection.destroy()
                            let canned_message_cate = rows
                            callback(null, canned_message_cate)
                        })
                    })
                }, // End 1st Function
                (canned_message_cate, callback) => {
                    pool.getConnection((err, connection) => {
                        console.log("pool connection error:", err)
                        connection.query(`SELECT * FROM tb_driver_canned_messages`, (err, rows, fields) => {
                            connection.destroy()
                            var message = rows
                            var data = {
                                "cate": canned_message_cate,
                                "message": message,

                            }

                            callback(null, data)
                        })
                    })
                }, // End 2nd Function
            ], // End all
            (err, result) => {
                var canned_message_data = []
                    /*  Create data has been Categorised    */
                for (var i = 0; i < result['cate'].length; i++) {
                    var cate_cateID = result['cate'][i].cate_id
                    canned_message_data[i] = {
                        "cate": result['cate'][i].title,
                        "message": []
                    }
                    for (var j = 0; j < result['message'].length; j++) {
                        var message_cateID = result['message'][j].cate_id
                        if (cate_cateID == message_cateID) {
                            canned_message_data[i].message.push(result['message'][j])
                        }
                    }
                }

                /*  Create data has been Uncategorised    */
                canned_message_data.push({
                    "cate": "Uncategorised",
                    "message": []
                })

                for (var i = 0; i < result['message'].length; i++) {
                    var message_cateID = result['message'][i].cate_id

                    if (message_cateID == 0) {
                        canned_message_data[canned_message_data.length - 1].message.push(result['message'][i])
                    }
                }

                if (err) {
                    res.send({ code: 0, text: 'not found message', result: [] })
                } else {
                    res.send({ code: 2, text: 'found message', result: canned_message_data })
                }
            })
    })
    .post(async(req, res) => {
        let quoteid = ((req.body.quoteid === "" || req.body.quoteid === void(0)) ? 0 : req.body.quoteid)
        let subject = mysql.escape(req.body.subject)
        let message = mysql.escape(req.body.message)
        let lat = req.body.lat
        let lng = req.body.lng

        let aff_driver_id = 0
        let driver_id = 0
        let affMode = 0
        let time_log = req.body.time_log
        driver_id = req.decoded.id
        var company_code = req.decoded.company_code

        console.log("Driver_ID", driver_id)

        var pool = await Util.initConnection(company_code)

        let check_sum = req.body.check_sum
        let checkDoneWork = messageRoute.get(check_sum)

        console.log("check Done Work:", checkDoneWork)

        if (checkDoneWork != void(0) && checkDoneWork != "undefined" && checkDoneWork == "done") {
            console.log("** NOT Do it again")
            return res.json({ code: 2, text: 'Your message has been sent.', result: [] })
        }
        if (check_sum != void(0) && check_sum != "undefined") {
            messageRoute.set(check_sum, "done")
        }

        if (req.decoded.type == "normal_driver") {
            affMode = 0
            driver_id = req.decoded.id
            aff_driver_id = 0

        } else if (req.decoded.type == "affiliate_driver") {
            affMode = 1
            driver_id = req.decoded.affiliate_id
            aff_driver_id = req.decoded.id
        } else if (req.decoded.type == "affiliate_user") {
            affMode = 1
            driver_id = req.decoded.affiliate_id
            aff_driver_id = req.decoded.id
        }

        var UKtime = moment().utc().format()
        time_log = UKtime

        var account_detail = await action.getRoute(quoteid, pool)

        var account_id = account_detail.account
        var account_name = account_detail.account_name
        var contract_id = account_detail.contractID
        var contract_name = account_detail.contract_name
        var route_name = account_detail.job_pattern_name

        let location = ''
        location = await action.getLocationName(lat, lng)
            .catch((err) => {
                console.log('getLocationName catch: ', err)
            })

        location = mysql.escape(location)

        let inserSQL = `INSERT INTO tb_driver_message 
                        SET 
                            quote_id = '${quoteid}', 
                            aff_driver_id = '${aff_driver_id}', 
                            affiliateDriver = '${affMode}', 
                            driver_id = '${driver_id}', 
                            subject = ${subject}, 
                            message = ${message}, 
                            msg_date = '${time_log}',
                            account_id = '${account_id}',
                            contract_id = '${contract_id}',
                            route = '${route_name}',
                            location = ${location},
                            type = 'inbound'`

        console.log(inserSQL)

        pool.getConnection((err, connection) => {
            console.log("pool connection error:", err)
            connection.query(inserSQL, (err, rows, fields) => {
                connection.destroy()
                if (err) res.json({ code: 0, text: 'Failed to send message.', result: [] })
                else res.json({ code: 2, text: 'Your message has been sent.', result: [] })
            })
        })

    })

messageRoute.route('/sentnotification')
    .post((req, res) => {
        res.io.emit('notification', { hello: 'Hello It\'s me.' })
        res.send("success")
    })

module.exports = messageRoute