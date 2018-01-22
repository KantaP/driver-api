import request from 'request'
import * as Util from '../Util'
import moment from 'moment'

export const stopWork = (driver_id, lat, lng, location, startwork_id, timestop, pool) => {
    return new Promise((resolve, reject) => {

        var now = timestop

        var sql = `UPDATE tb_driver_work_time SET 
						driver_id = ?,
						stop_time = ?,
						stop_lat = ?,
						stop_lon = ?,
						stop_location = ?
					WHERE 
						id = ?`
        if (startwork_id == 0 || startwork_id == void(0)) {
            reject("Invalid start work id.")
        }
        pool.getConnection((err, conn) => {
            console.log("pool stopWork connection error:", err)
            conn.query(sql, [driver_id, now, lat, lng, location, startwork_id], (err, rows, fields) => {
                conn.destroy()

                if (err) {
                    err.method = "stopWork"
                    throw err
                }

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