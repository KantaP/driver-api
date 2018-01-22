import Router from 'express'
import * as Util from '../../Util'
import * as action from './action'

const vehiclecheck = Router()

var sanitizeHtml = require('sanitize-html')
var S = require('string')

vehiclecheck.route('/search')
    .get(async(req, res) => {
        var driver_id = req.decoded.id
        var company_code = req.decoded.company_code
        var name = req.query.name
        var pool = await Util.initConnection(company_code)
        var vehicleList = await action.getVehicleList(driver_id, name, pool)

        res.send({ code: 2, text: 'success.', result: vehicleList })
    })

vehiclecheck.route('/list')
    .get(async(req, res) => {
        var driver_id = req.decoded.id
        var company_code = req.decoded.company_code
        var pool = await Util.initConnection(company_code)
        var vehicleCheckedList = await action.getVehicleCheckedList(driver_id, pool)

        res.send({ code: 2, text: 'success.', result: vehicleCheckedList })
    })

vehiclecheck.route('/historylist/:veh_id')
    .get(async(req, res) => {
        var driver_id = req.decoded.id
        var company_code = req.decoded.company_code
        var vehicle_id = req.params.veh_id
        var pool = await Util.initConnection(company_code)
        var historyList = await action.getHistoryList(driver_id, vehicle_id, pool)

        res.send({ code: 2, text: 'success.', result: historyList })
    })

vehiclecheck.route('/history/:check_res_id/:veh_id/:pageno')
    .get(async(req, res) => {
        var driver_id = req.decoded.id
        var company_code = req.decoded.company_code
        var site_url = req.decoded.site_url
        var check_res_id = req.params.check_res_id
        var pageno = req.params.pageno
        var vid = req.params.veh_id
        var pool = await Util.initConnection(company_code)

        var history = action.getHistory(driver_id, check_res_id, vid, pageno, site_url, pool)
        var countAllData = action.numrowResult(driver_id, check_res_id, vid, pool)

        return res.send({
            code: 2,
            text: 'success.',
            result: {
                all_amount: await countAllData,
                data: await history
            }
        })
    })

vehiclecheck.route('/sheet')
    .get(async(req, res) => {
        var driver_id = req.decoded.id
        var company_code = req.decoded.company_code
        var pool = await Util.initConnection(company_code)
        var checkSheet = await action.getCheckSheet(pool)

        var sanitizeHtmlOption = {
            allowedTags: []
        }

        for (var i in checkSheet) {
            checkSheet[i].chk_name = sanitizeHtml(checkSheet[i].chk_name, sanitizeHtmlOption)
            checkSheet[i].chk_desc = S(sanitizeHtml(checkSheet[i].chk_desc, sanitizeHtmlOption)).collapseWhitespace().s

            checkSheet[i].chk_options = S(checkSheet[i].chk_options, sanitizeHtmlOption).collapseWhitespace().s
            checkSheet[i].chk_options = JSON.parse(checkSheet[i].chk_options)
        }

        res.send({ code: 2, text: 'success.', result: checkSheet })
    })
    .post(async(req, res) => {
        var driver_id = req.decoded.id
        var company_code = req.decoded.company_code
        var pool = await Util.initConnection(company_code)
        var { checkedList, quote_id, timecheck } = req.body

        var updateCheckResult = action.updateCheckResult(driver_id, quote_id, checkedList, timecheck, pool)

        return res.send({ code: 2, text: 'success.', result: [await updateCheckResult] })
    })

module.exports = vehiclecheck