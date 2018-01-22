import Router from 'express'
import Config from '../../../config'
import jwt from 'jsonwebtoken'
import moment from 'moment'
import * as Util from '../Util'
import * as all_job_action from './_all-job'
import * as summary_action from './_summary'
import * as complete_job_action from './_complete-job'
import * as single_job_action from './_single-job'
import * as update_action from './_update-progress'
import * as driver_accept from './_driver_accept'
import * as enroute_action from './_enroute'
import _ from 'lodash'
import { enroute } from './_enroute';

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
const jobs = Router()
jobs.use(tokenKey)


//--    Get Jobs [START]
//-----------------------------
jobs.get('/all', async(req, res) => {

    var driver_id = req.decoded.id
    var company_code = req.decoded.company_code

    console.log("Driver_ID", driver_id)
    console.log("Company Code", company_code)

    var pool = await Util.initConnection(company_code)
    var qidRowData = await all_job_action.getQuoteID(driver_id, pool)

    console.log(qidRowData)

    console.log("after query")

    if (qidRowData.length <= 0) {
        console.log("No result found");
        res.send({ code: 0, text: 'not found', result: qid })
        return
    }

    var resp = []
    for (var i = 0; i < qidRowData.length; i++) {

        var movementDetail = await all_job_action.getMovement(qidRowData[i].quote_id, driver_id, pool)

        for (var j in movementDetail) {

            //console.log("movementDetail", movementDetail[j])

            var isJobAccept = await all_job_action.isJobAccept(movementDetail[j].quote_id, driver_id, pool)
            var getOutwardTime = moment(movementDetail[j].datetime_start).format('Do MMM YYYY hh:mm')
            var getReturnTime = moment(movementDetail[j].datetime_start).add(movementDetail[j].outbound_hours * 60, 'minutes').format('Do MMM YYYY hh:mm')

            var totalPrice = (movementDetail[j].total_price != 0 ? movementDetail[j].total_price : movementDetail[j].price)
            var payments = movementDetail[j].payment
            var balance_due = totalPrice - payments

            var data = {
                quote_id: movementDetail[j].quote_id,
                movement_id: movementDetail[j].movement_id,
                outward: getOutwardTime,
                return: getReturnTime,
                pickup: movementDetail[j].collection_address,
                max_passenger: movementDetail[j].default_num_id,
                pay_ok: movementDetail[j].pay_ok,
                destination: movementDetail[j].destination_address,
                passengers_num: movementDetail[j].passenger_number,
                passenger_name: movementDetail[j].passenger_name,
                driver_confirm: (movementDetail[j].driver_confirm == null ? "0000-00-00 00:00:00" : movementDetail[j].driver_confirm),
                driver_accept: isJobAccept,
                balance_due: balance_due,
                driver_pay: movementDetail[j].driver_pay,
                price: movementDetail[j].total_price,
                date_departure: moment(movementDetail[j].date_departure).format('Do MMM YYYY'),
                time_departure: moment(movementDetail[j].date_departure).format('hh:mm'),
                date_end: moment(movementDetail[j].date_end).format('Do MMM YYYY hh:mm'),
                onsite_before: moment(movementDetail[j].datetime_start).format('hh:mm')
            }
            resp.push(data)
        }
    }
    res.send({ code: 2, text: 'found jobs.', result: resp })
})
jobs.get('/amount', async(req, res) => {

    var driver_id = req.decoded.id
    var company_code = req.decoded.company_code

    console.log("Driver_ID", driver_id)

    var pool = await Util.initConnection(company_code)
    var qidRowData = await all_job_action.getQuoteID(driver_id, pool)

    console.log(qidRowData)

    return res.send({ code: 2, text: 'found jobs.', result: qidRowData })
})

jobs.get('/summary/:start/:end', async(req, res) => {
    var driver_id = req.decoded.id
    var company_code = req.decoded.company_code
    var start = req.params.start
    var end = req.params.end

    console.log("Driver_ID", driver_id)

    var pool = await Util.initConnection(company_code)
    var date = {
        date_start: start,
        date_end: end
    }
    try {

        var get_summary = await summary_action.getSummary(driver_id, date, pool)

        for (var i in get_summary) {
            get_summary[i].date_start_convert = moment(get_summary[i].date_out).format('dddd D MMMM YYYY')
            get_summary[i].time_start_convert = moment(get_summary[i].date_out).format('hh:mm')
            get_summary[i].time_departure = moment(get_summary[i].date_departure).format('hh:mm')
            get_summary[i].time_arrival = moment(get_summary[i].date_back).format('hh:mm')
            get_summary[i].time_finish = moment(get_summary[i].date_end).format('hh:mm')
        }

        if (get_summary.length > 0) {
            res.send({ code: 2, text: 'Found jobs.', result: get_summary })
            return
        }

        res.send({ code: 2, text: 'Not found jobs.', result: [] })

    } catch (error) {
        res.send({ code: 0, text: 'Cannot connect server.', result: error })
    }
})

jobs.get('/byQuoteId/:id', async(req, res) => {
    let qid = req.params.id
    let type = req.decoded.type
    let driver_id = req.decoded.id
    let affiliate_id = req.decoded.affiliate_id

    var company_code = req.decoded.company_code
    var pool = await Util.initConnection(company_code)

    var job_detail = await single_job_action.getAllMovement(qid, driver_id, pool)

    var journey_group = []
    for (var i = 0; i < job_detail.length; i++) {
        journey_group.push(job_detail[i].j_order)
    }

    journey_group = _.uniq(journey_group)

    var route = []
    for (var i = 0; i < journey_group.length; i++) {
        var movementInJourney = job_detail.filter((item) => item.j_order == journey_group[i])
        movementInJourney = movementInJourney.map((item) => {
                item.date = moment(item.datetime_start).format("DD MMM YYYY")
                item.time = moment(item.datetime_start).format("HH:mm")
                item.dateEnd = moment(item.date_end).format("DD MMM YYYY")
                item.timeEnd = moment(item.date_end).format("HH:mm")
                item.dateStart = item.datetime_start
                item.progress = item.movement_progress
                item.col_latlng = item.add_lat + ',' + item.add_lng
                item.des_latlng = item.des_lat + ',' + item.des_lng
                return item
            })
            // for (var j = 0; j < job_detail.length; j++) {
            //     if (job_detail[j].j_order == journey_group[i]) {

        //         let dateStart = moment(job_detail[j].datetime_start).format("DD MMM YYYY")
        //         let timeStart = moment(job_detail[j].datetime_start).format("HH:mm")
        //         let dateEnd = moment(job_detail[j].date_end).format("DD MMM YYYY")
        //         let timeEnd = moment(job_detail[j].date_end).format("HH:mm")
        //         movement_group.push({
        //             collection_address: job_detail[j].collection_address,
        //             destination_address: job_detail[j].destination_address,
        //             dateStart: job_detail[j].datetime_start,
        //             date: dateStart,
        //             time: timeStart,
        //             movement_id: job_detail[j].movement_id,
        //             progress: job_detail[j].movement_progress,
        //             driver_confirm: job_detail[j].driver_confirm,
        //             dateEnd,
        //             timeEnd,
        //             col_latlng: job_detail[j].add_lat + ',' + job_detail[j].add_lng,
        //             des_latlng: job_detail[j].des_lat + ',' + job_detail[j].des_lng,
        //             is_end: job_detail[j].is_end,
        //             j_id: job_detail[j].j_id,
        //             movement_order: job_detail[j].movement_order
        //         })
        //     }
        // }
        route.push({
            journey_group: journey_group[i],
            movement: movementInJourney
        })
    }


    res.send({ code: 2, text: 'found jobs', result: route })
})

jobs.get('/otherMovmentByQuote/:id', async(req, res) => {
    let qid = req.params.id
    let type = req.decoded.type
    let driver_id = req.decoded.id
    let affiliate_id = req.decoded.affiliate_id

    var company_code = req.decoded.company_code
    var pool = await Util.initConnection(company_code)

    var job_detail = await single_job_action.getAllOtherMovement(qid, driver_id, pool)

    var journey_group = []
    for (var i = 0; i < job_detail.length; i++) {
        journey_group.push(job_detail[i].j_order)
    }

    journey_group = _.uniq(journey_group)

    var movement_group = []
    var route = []
    for (var i = 0; i < journey_group.length; i++) {
        for (var j = 0; j < job_detail.length; j++) {
            if (job_detail[j].j_order == journey_group[i]) {

                let dateStart = moment(job_detail[j].datetime_start).format("DD MMM YYYY")
                let timeStart = moment(job_detail[j].datetime_start).format("HH:mm")

                movement_group.push({
                    collection_address: job_detail[j].collection_address,
                    destination_address: job_detail[j].destination_address,
                    dateStart: job_detail[j].datetime_start,
                    date: dateStart,
                    time: timeStart,
                    movement_id: job_detail[j].movement_id,
                    progress: job_detail[j].movement_progress,
                    driver_confirm: job_detail[j].driver_confirm
                })
            }
        }
        route.push({
            journey_group: journey_group[i],
            movement: movement_group
        })
    }


    res.send({ code: 2, text: 'found jobs', result: route })
})

//--------------- Complete jobs ---------------

jobs.get('/allCompleteJobs', async(req, res) => {

    let type = req.decoded.type
    let id = req.decoded.id
    let affiliate_id = req.decoded.affiliate_id
    var company_code = req.decoded.company_code

    var pool = await Util.initConnection(company_code)
    var qidRowData = await complete_job_action.getQuoteID(driver_id, pool)

    console.log(qidRowData)

    if (qidRowData.length <= 0) {
        res.send({ code: 0, text: 'not found', result: qid })
        return
    }

    var resp = []
    for (var i = 0; i < qidRowData.length; i++) {

        var movementDetail = await complete_job_action.getMovement(qidRowData[i].quote_id, driver_id, pool)

        for (var j in movementDetail) {
            var isJobAccept = await complete_job_action.isJobAccept(movementDetail[j].quote_id, driver_id, pool)
            var getOutwardTime = moment(movementDetail[j].datetime_start).format('ddd Mo MMM YY H:mm')
            var getReturnTime = moment(movementDetail[j].datetime_start).add(movementDetail[j].outbound_hours * 60, 'minutes').format('ddd Mo MMM YY H:mm')

            var totalPrice = (movementDetail[j].total_price != 0 ? movementDetail[j].total_price : movementDetail[j].price)
            var payments = movementDetail[j].payment
            var balance_due = totalPrice - payments

            console.log("movementDetail", movementDetail[j])

            var data = {
                quote_id: movementDetail[j].quote_id,
                movement_id: movementDetail[j].movement_id,
                outward: getOutwardTime,
                return: getReturnTime,
                pickup: movementDetail[j].collection_address,
                destination: movementDetail[j].destination_address,
                passengers: movementDetail[j].default_num_id,
                driver_confirm: (movementDetail[j].driver_confirm == null ? "0000-00-00 00:00:00" : movementDetail[j].driver_confirm),
                driver_accept: isJobAccept,
                balance_due: balance_due,
                driver_pay: movementDetail[j].driver_pay
            }
            resp.push(data)
        }
    }

    res.send({ code: 2, text: 'found jobs.', result: resp })
})

//-------------- End complete jobs --------------------------

//--    Get Jobs [END]
//-----------------------------

//--    Update Jobs [START]
//-----------------------------
jobs.put('/updateProgress/:quote_id/:movement_id/:progressStatus/:point_id', async(req, res) => {

    let qid = req.params.quote_id
    let mid = req.params.movement_id
    let pstatus = req.params.progressStatus
    let point_id = req.params.point_id
    let time_log = req.body.time_log

    var company_code = req.decoded.company_code
    var pool = await Util.initConnection(company_code)
    var isMovementUpdated = await update_action.updateProgressMovement(mid, pstatus, pool)

    if (pstatus != 10) {
        pstatus = 7
    }

    var isQuoteUpdated = await update_action.updateProgressQuote(qid, pstatus, pool)
    var pointName = await update_action.getPointName(qid, point_id, pool)

    res.send({ code: 2, text: 'Journey update at ' + pointName, result: [] })

})

jobs.post('/driverAccept', async(req, res) => {
    try {
        var quote_id = req.body.quote_id
        var driver_id = req.body.driver_id
        var company_code = req.decoded.company_code
        var pool = await Util.initConnection(company_code)
        var acceptResults = await driver_accept.driveAccept(driver_id, quote_id, pool)
        res.send({ results: acceptResults, err: null })
    } catch (err) {
        res.send({ results: [], err: err })
    }
})

jobs.post('/alreadyOnsite', async(req, res) => {
    try {
        var movement_order = req.body.movement_order
        var quote_id = req.body.quote_id
        var company_code = req.decoded.company_code
        var pool = await Util.initConnection(company_code)
        var isMovementUpdated = await update_action.updateProgressMovement(movement_order, 9, quote_id, pool)
        var progressUpdateAt = await update_action.progressUpdateAt(movement_order, quote_id, pool)
        res.send({ results: { update: isMovementUpdated }, err: null })
    } catch (err) {
        res.send({ results: { update: false }, err: err })
    }
})

jobs.get('/journeyProgress/:quote_id', async(req, res) => {
    try {
        var quote_id = req.params.quote_id
        var company_code = req.decoded.company_code
        var pool = await Util.initConnection(company_code)
        var journeyProgress = await all_job_action.getJourneyProgress(quote_id, pool)
        res.send({ results: journeyProgress, err: null })
    } catch (err) {
        res.send({ results: [], err: err })
    }
})

jobs.post('/startJourney', async(req, res) => {
    try {
        var quote_id = req.body.quote_id
        var j_order = req.body.j_order
        var company_code = req.decoded.company_code
        var pool = await Util.initConnection(company_code)
        var journeyUpdate = await all_job_action.updateJourneyProgress(1, j_order, quote_id, pool)
        res.send({ results: journeyUpdate, err: null })
    } catch (err) {
        res.send({ results: 0, err: err })
    }
})

jobs.post('/endJourney', async(req, res) => {
    try {
        var quote_id = req.body.quote_id
        var j_order = req.body.j_order
        var company_code = req.decoded.company_code
        var pool = await Util.initConnection(company_code)
        var journeyUpdate = await all_job_action.updateJourneyProgress(2, j_order, quote_id, pool)
        res.send({ results: journeyUpdate, err: null })
    } catch (err) {
        res.send({ results: 0, err: err })
    }
})

jobs.post('/enroute', async(req, res) => {
    try {
        var movement_order = req.body.movement_order
        var movement_id = req.body.movement_id
        var quote_id = req.body.quote_id
        var company_code = req.decoded.company_code
        var pool = await Util.initConnection(company_code)
        var isMovementUpdated = await update_action.updateProgressMovement(movement_order, 8, quote_id, pool)
        var isPrevMovementUpdated = await update_action.updateProgressMovement((movement_order - 1), 10, quote_id, pool)
        var progressUpdateAt = await update_action.progressUpdateAt(movement_order, quote_id, pool)
        var failedBoardPassengerCount = await enroute_action.enroute(movement_id, pool)
        var failedBoardPassenger = []
        if (failedBoardPassengerCount) {
            failedBoardPassenger = await enroute_action.getFailedBoardPassengerByRoute(movement_id, pool)
        }
        // var failedAlignPassenger = await enroute_action.getFailedAlignPassengerByRoute(movement_id, pool)
        res.send({ results: { update: isMovementUpdated, force_passenger_fail_to_board: failedBoardPassengerCount, failedBoardPassenger }, err: null })
    } catch (err) {
        res.send({ results: { update: false, force_passenger_fail_to_board: 0, failedBoardPassenger: [] }, err: err })
    }
})

jobs.post('/endroute', async(req, res) => {
    try {
        var movement_order = req.body.movement_order
        var movement_id = req.body.movement_id
        var quote_id = req.body.quote_id
        var company_code = req.decoded.company_code
        var datetime = req.body.datetime
        var pool = await Util.initConnection(company_code)
        var isMovementUpdated = await update_action.updateProgressMovement(movement_order, 10, quote_id, pool)
        var progressUpdateAt = await update_action.progressUpdateAt(movement_order, quote_id, pool)
        var changePassengerStatus = await enroute_action.endRoute(movement_id, quote_id, datetime, pool)
        res.send({ results: { update: isMovementUpdated, force_passenger_out: changePassengerStatus }, err: null })
    } catch (err) {
        res.send({ results: { update: false, force_passenger_out: 0 }, err: err })
    }
})

jobs.post('/reject', async(req, res) => {
    try {
        var quote_id = req.body.quote_id
        var driver_id = req.body.driver_id
        var company_code = req.decoded.company_code
        var pool = await Util.initConnection(company_code)
        var rejectResult = await driver_accept.driverReject(driver_id, quote_id, pool)
        res.send({ results: rejectResult, err: null })
    } catch (err) {
        res.send({ results: false, err: err })
    }
})


//--    Update Jobs [END]
//-----------------------------
module.exports = jobs