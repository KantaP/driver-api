import Router from 'express'
import Config from '../../../config'
import jwt from 'jsonwebtoken'
import * as Util from '../Util'
import moment from 'moment'
var url = require("url");
const tokenKey = (req, res, next) => {

    let key = req.headers['x-access-token']
    var pathname = url.parse(req.url).pathname;
    console.log(pathname)
    if (pathname == '/sendToDriverFromAdmin') {
        next()
    } else {
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
            res.send({ code: 1, text: 'Not found token key', result: [] })
        }
    }

}
const notification = Router()
notification.use(tokenKey)

const findDriverToken = (driver_id, pool) => {
    return new Promise((resolve, reject) => {
        var sql = `
            SELECT * FROM tb_driver_app_token WHERE driver_id = ?
        `
        console.log(sql, driver_id)
        pool.getConnection((err, conn) => {
            if (err) reject(err)
            conn.query(sql, [driver_id], (err, rows) => {
                conn.destroy()
                if (err) reject(err)
                resolve(rows)
            })
        })
    })
}

const findMovementDetail = (quote_id, movement_id, pool) => {
    return new Promise((resolve, reject) => {
        var sql = `
            SELECT * FROM tb_quote_movement WHERE quote_id = ? AND movement_id = ?
        `
        console.log(sql, quote_id, movement_id)
        pool.getConnection((err, conn) => {
            if (err) reject(err)
            conn.query(sql, [quote_id, movement_id], (err, rows) => {
                conn.destroy()
                if (err) reject(err)
                resolve(rows)
            })
        })

    })
}

notification.post('/sendToDriver', async(req, res) => {
    var { driver_id, data } = req.body
    var company_code = req.decoded.company_code
    var pool = await Util.initConnection(company_code)
    try {
        var driverToken = await findDriverToken(driver_id, pool)
        var payload = {
            data: Object.assign({}, data)
        }
        if (driverToken.length > 0) {
            req.firebase.messaging().sendToDevice(
                    driverToken.map((item) => item.token),
                    payload, {
                        contentAvailable: true,
                        priority: "normal",
                    })
                .then(function(response) {
                    // See the MessagingDevicesResponse reference documentation for
                    // the contents of response.
                    console.log("Successfully sent message:", response);
                    res.send(response)
                })
                .catch(function(error) {
                    console.log("Error sending message:", error);
                    res.send(error)
                });
        } else {
            res.send({
                status: false,
                msg: 'Not found token for this driver'
            })
        }
    } catch (err) {
        console.log(err)
    }
})

notification.post('/sendToDriverFromAdmin', async(req, res) => {
    var { driver_id, data, company_code } = req.body
    if (data.type == 'assign') {
        if (data.quote_id > 0 && data.movements.length > 0) {
            var pool = await Util.initConnection(company_code)
            try {
                var driverToken = await findDriverToken(driver_id, pool)
                console.log(driverToken)
                for (let i = 0; i < data.movements.length; i++) {
                    var m_detail = await findMovementDetail(data.quote_id, data.movements[i], pool)
                    var payload = {
                        data: {
                            quote_id: data.quote_id,
                            pickupDate: moment(m_detail[0].date_start).format('DD-MM-YYYY'),
                            pickupTime: m_detail[0].time_start.toString(),
                            pickup: m_detail[0].collection_address,
                            pax: m_detail[0].num_id.toString()
                        }
                    }
                    if (driverToken.length > 0) {
                        req.firebase.messaging().sendToDevice(
                                driverToken.map((item) => item.token),
                                payload, {
                                    contentAvailable: true,
                                    priority: "normal",
                                })
                            .then(function(response) {
                                // See the MessagingDevicesResponse reference documentation for
                                // the contents of response.
                                console.log("Successfully sent message:", response);
                                res.send(response)
                            })
                            .catch(function(error) {
                                console.log("Error sending message:", error);
                                res.send(error)
                            });
                    } else {
                        res.send({
                            status: false,
                            msg: 'Not found token for this driver'
                        })
                    }
                }

            } catch (err) {
                console.log(err)
            }
        } else {
            res.send({
                status: false,
                msg: 'Not found job'
            })
        }
    } else if (data.type == 'message') {
        console.log(company_code)
        var pool = await Util.initConnection(company_code)
        try {
            var driverToken = await findDriverToken(driver_id, pool)
            console.log(driverToken)
            var payload = {
                data: {
                    title: data.title,
                    message: data.message,
                    sentfrom: data.sentfrom
                }
            }
            if (driverToken.length > 0) {
                req.firebase.messaging().sendToDevice(
                        driverToken.map((item) => item.token),
                        payload, {
                            contentAvailable: true,
                            priority: "normal",
                        })
                    .then(function(response) {
                        // See the MessagingDevicesResponse reference documentation for
                        // the contents of response.
                        console.log("Successfully sent message:", response);
                        res.send(response)
                    })
                    .catch(function(error) {
                        console.log("Error sending message:", error);
                        res.send(error)
                    });
            } else {
                res.send({
                    status: false,
                    msg: 'Not found token for this driver'
                })
            }


        } catch (err) {
            console.log(err)
        }
    } else {
        res.send({
            status: false,
            msg: 'Not found job'
        })
    }

})

module.exports = notification