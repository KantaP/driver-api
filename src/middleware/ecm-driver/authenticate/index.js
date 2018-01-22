import Router from 'express'
import jwt from 'jsonwebtoken'
import moment from 'moment'
import Config from '../../../config'
import request from 'request'
import * as Util from '../Util'
import * as action from './action'
const path = require('path')
const crypto = require('crypto')

const authen = Router()

authen
    .post('/', async(req, res) => {
        var comp_code = req.body.code
        var username = req.body._u
        var password = crypto.createHash('md5').update(req.body._p).digest("hex")
            // var pathFile = __dirname + '/config_env/' + comp_code + '.json'
        var pathFile = path.resolve('config_env/' + comp_code + '.json');
        console.log(pathFile)
        var isFileExits = await Util.isFileExits(pathFile)
        if (!isFileExits) {
            res.status(200).send({ code: 0, text: 'Please verify your company code.', result: [] })
            return
        }

        var pool = await Util.initConnection(comp_code)
        var driverDetail = await action.login(username, password, pool)

        if (driverDetail.length <= 0) {
            res.status(200).send({ code: 0, text: 'Not found driver', result: [] })
            return
        }

        var compData = await Util.readConfigFile(pathFile)

        let protectData = {
            id: driverDetail[0].driver_id,
            username: driverDetail[0].username,
            date: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
            company_code: compData.code,
            share_server: compData.share_server,
            site_url: compData.website
        }

        //console.log("protectData", protectData)

        let token = jwt.sign(protectData, Config.ecmdriver.ecmKey, { expiresIn: "2 days" })

        var site = ""

        if (compData.share_server == "ecm") {
            site = "sv.ecoachmanager.com"
        } else if (compData.share_server == "myau") {
            site = "svau.ecoachmanager.com"
        }

        res.status(200).send({
            code: 2,
            text: 'Success',
            result: token,
            driver_id: driverDetail[0].driver_id,
            apisite: site,
            website: compData.website,
            port: process.env.PORT,
            company_logo: compData.website + 'images/invoice_logo.png?notTemp=1058552774'
        })
    })

module.exports = authen