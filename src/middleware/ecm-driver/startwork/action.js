import request from 'request'
import * as Util from '../Util'
import moment from 'moment'


export const startWork = (driver_id, lat, lng, location, timestart, pool) => {
    return new Promise((resolve, reject) => {

        var now = timestart

        var sql = `INSERT INTO tb_driver_work_time SET 
						driver_id = ?,
						start_time = ?,
						start_lat = ?,
						start_lon = ?,
						start_location = ?`

        pool.getConnection((err, conn) => {
            console.log("pool startWork connection error:", err)
            conn.query(sql, [driver_id, now, lat, lng, location], (err, rows, fields) => {
                conn.destroy()

                if (err) {
                    err.method = "startWork"
                    throw err
                }

                rows.workTime = now
                resolve(rows)

            })
        })
    })
}

export const getLocationName = (lat, lng) => {
    return new Promise((resolve, reject) => {
        var url = 'http://maps.googleapis.com/maps/api/geocode/json?latlng=' + lat + "," + lng + '&sensor=true&key=AIzaSyC-s1gGq15TJrXstQm1cz6TV6ThTPr7NIs'

        request(url, function(error, response, body) {
            body = JSON.parse(body)
            console.log(body)
            if (body.status == 'ZERO_RESULTS' || body.results.length == 0) {
                resolve("N/A")
                return
            }
            let address = body.results[0].formatted_address
            console.log("body****", address)
            if (body.status == "OK") {
                resolve(address)
            } else {
                resolve("N/A")
            }
        })
    })
}