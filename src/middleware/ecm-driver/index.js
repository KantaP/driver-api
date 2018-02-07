import Router from 'express'
import authenticate from './authenticate'
import jobs from './jobs'
import tracking from './tracking'
import startwork from './startwork'
import stopwork from './stopwork'
import checkntrack from './checkntrack'
import companycode from './companycode'
import vehicle from './vehicle'
import Config from '../../config'
import jwt from 'jsonwebtoken'
import message from './message'
import passengers from './passengers'
import mobileSettings from './mobileSettings'
import notification from './notification'
// import log from './log'

const ecmDriver = Router()
const admin = require("firebase-admin");
const serviceAccount = require("./driverapp-1470129684507-firebase-adminsdk-qd3ut-7debccb432.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const apiKey = (req, res, next) => {
    let key = req.headers['x-access-key']
    if (key) {
        jwt.verify(key, Config.ecmdriver.ecmKey, function(err, decoded) {
            if (err) {
                return res.json({ code: 0, text: 'Failed to authenticate token.', result: [] })
            } else {
                // if everything is good, save to request for use in other routes
                // req.decoded = decoded;
                req.firebase = admin
                next()
            }
        })
    } else {
        res.send({ code: 1, text: 'Not found api key', result: [] })
    }
}
ecmDriver.use(apiKey)
ecmDriver.get('/', (req, res) => res.send({ message: '...' }))
ecmDriver.use('/companycode', companycode)
ecmDriver.use('/authenticate', authenticate)
ecmDriver.use('/jobs', jobs)
ecmDriver.use('/tracking', tracking)
ecmDriver.use('/message', message)
ecmDriver.use('/startwork', startwork)
ecmDriver.use('/stopwork', stopwork)
ecmDriver.use('/checkntrack', checkntrack)
ecmDriver.use('/vehicle', vehicle)
ecmDriver.use('/passengers', passengers)
ecmDriver.use('/mobileSettings', mobileSettings)
ecmDriver.use('/notification', notification)
    // ecmDriver.use('/log', log)

module.exports = ecmDriver