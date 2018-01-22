import moment from 'moment'
import request from 'request'

export const signin = (driver_id, vehicle_id, lat, lng, location, pool) => {
    return new Promise((resolve, reject) => {

        var now = moment().format('YYYY-MM-DD')

        var sql = `INSERT INTO tb_vehicle_signin SET 
                        driver_id = ?,
						vehicle_id = ?,
						signin_time = ?,
						signin_lat = ?,
						signin_lon = ?,
						signin_location = ?`

        pool.getConnection((err, conn) => {
            console.log("pool signin connection error:", err)
            conn.query(sql, [driver_id, vehicle_id, now, lat, lng, location], (err, rows, fields) => {
                conn.destroy()

                if (err) {
                    err.method = "signin";
                    throw err;
                }

                resolve(rows)

            })
        })
    })
}

export const signout = (driver_id, lat, lng, locationName, start_id, pool) => {
    return new Promise((resolve, reject) => {

        var now = moment().format('YYYY-MM-DD')

        var sql = `UPDATE tb_vehicle_signin SET 
						driver_id = ?,
						signout_time = ?,
						signout_lat = ?,
						signout_lon = ?,
						signout_location = ?
					  WHERE 
						id = ?`

        if (start_id == 0 || start_id == void(0)) {
            reject("Invalid signin vehicle id.")
        }

        pool.getConnection((err, conn) => {
            console.log("pool signout connection error:", err)
            conn.query(sql, [driver_id, now, now, lat, lng, locationName, start_id], (err, rows, fields) => {
                conn.destroy()

                if (err) {
                    err.method = "signout";
                    throw err;
                }

                resolve(rows)

            })
        })
    })
}

export const getVehicleName = (vehicle_id, pool) => {
    return new Promise((resolve, reject) => {

        var now = moment().format('YYYY-MM-DD')

        var sql = `SELECT vehicle_reg
						FROM tb_vehicles
						WHERE available = ?
						AND vehicle_id = ?`

        pool.getConnection((err, conn) => {
            console.log("pool getVehicleName connection error:", err)
            conn.query(sql, [1, vehicle_id], (err, rows, fields) => {
                conn.destroy()

                if (err) {
                    err.method = "getVehicleName";
                    throw err;
                }

                resolve(rows[0].vehicle_reg)

            })
        })
    })
}

export const getLocationName = (lat, lng) => {
    return new Promise((resolve, reject) => {
        var url = 'http://maps.googleapis.com/maps/api/geocode/json?latlng=' + lat + "," + lng + '&sensor=true'

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