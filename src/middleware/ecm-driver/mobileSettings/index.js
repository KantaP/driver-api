import Router from 'express'
import Config from '../../../config'
import jwt from 'jsonwebtoken'
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
const mobileSetting = Router()
mobileSetting.use(tokenKey)

mobileSetting.route('/')
    .get(async(req, res) => {
        var driver_id = req.decoded.id
        var company_code = req.decoded.company_code
        var pool = await Util.initConnection(company_code)
        var result = await action.getMobileSettings(pool)
        var resultStr = await action.getMobileSettingsStr(pool)
        result = result.concat(resultStr)
        res.send({ result: result })

    })


//for website request to push notification to app
mobileSetting.route('/token')
    .post(async(req, res) => {
        var driver_id = req.decoded.id
        var company_code = req.decoded.company_code
        var token = req.body.token
        var pool = await Util.initConnection(company_code)
        try {
            var result = await action.saveToken(token, driver_id, pool)
            res.send({ status: true, msg: 'Added token' })
        } catch (err) {
            res.send({ status: false, msg: err.message })
        }
    })
mobileSetting.route('/deletetoken').post(async(req, res) => {
        var driver_id = req.decoded.id
        var company_code = req.decoded.company_code
        var token = req.body.token
        var pool = await Util.initConnection(company_code)
        try {
            var result = await action.deleteToken(token, driver_id, pool)
            res.send({ status: true, msg: 'Removed token', result: result })
        } catch (err) {
            res.send({ status: false, msg: err.message, result: [] })
        }
    })
    // ********************** //

mobileSetting.route('/lang').get(async(req, res) => {
    var company_code = req.decoded.company_code
    var pool = await Util.initConnection(company_code)
    try {
        var results = await action.getLang(pool)
        res.send({ status: true, msg: '', results: results })
    } catch (err) {
        res.send({ status: false, msg: err.message, results: [] })
    }
})

mobileSetting.get('/lang/:lang', async(req, res) => {
    var company_code = req.decoded.company_code
    var lang = req.params.lang
    var pool = await Util.initConnection(company_code)
    try {
        var results = await action.getWordByLang(lang, pool)
        res.send({ status: true, msg: '', results: results })
    } catch (err) {
        res.send({ status: false, msg: err.message, results: [] })
    }
})

mobileSetting.post('/driveraction', async(req, res) => {
    var company_code = req.decoded.company_code
    var driver_id = req.decoded.id
    var pool = await Util.initConnection(company_code)
    try {
        var results = await action.saveDriverAction(req.body, driver_id, pool)
        res.send({ status: true, msg: '', results: results.insertId })
    } catch (err) {
        res.send({ status: false, msg: err.message, results: null })
    }
})

mobileSetting.post('/driveractionwhole', async(req, res) => {
    var company_code = req.decoded.company_code
    var driver_id = req.decoded.id
    var pool = await Util.initConnection(company_code)
    try {
        var results = await action.saveDriverActionWhole(req.body, driver_id, pool)
        res.send({ status: true, msg: '', results: results })
    } catch (err) {
        res.send({ status: false, msg: err.message, results: null })
    }
})




module.exports = mobileSetting