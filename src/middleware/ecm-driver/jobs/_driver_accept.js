import moment from 'moment'
import * as update_action from './_update-progress'
//driver accept whole job
export const driveAccept = (driver_id, quote_id, pool) => {
    return new Promise(async(resolve, reject) => {
        var checkBooking = await checkStatusBooking(quote_id, pool)
        if (!checkBooking) {
            reject(new Error('THIS IS NOT A BOOKING - DRIVER NOT ACCEPT!'))
        }
        // var movements = await getMovements(quote_id, driver_id, pool)
        // var acceptPromises = movements.map((item) => updateDriverAccept(driver_id, item.movement_id, pool))
        var results = await updateDriverAccept(driver_id, quote_id, pool)
            // var results = await Promise.all(acceptPromises)
        var quoteProgress = await update_action.updateProgressQuote(quote_id, 6, pool)
            // var movementProgressPromises = movements.map((item) => update_action.updateProgressMovement(item.movement_order, 6, quote_id, pool))
        var results2 = await update_action.updateProgressMovementsInJob(quote_id, 6, pool)
            // var results2 = await Promise.all(movementProgressPromises)
        resolve({ acceptJob: results, updateProgress: results2 })
    })
}

export const driverReject = (driver_id, quote_id, pool) => {
    return new Promise(async(resolve, reject) => {
        var checkBooking = await checkStatusBooking(quote_id, pool)
        if (!checkBooking) {
            reject(new Error('THIS IS NOT A BOOKING - DRIVER NOT ACCEPT!'))
        }
        var removeDriverAssigned = await updateDriverReject(driver_id, quote_id)
        resolve({ rejectJob: (removeDriverAssigned) ? true : false })
    })
}

const updateDriverReject = (driver_id, quote_id, pool) => {
    return new Promise((resolve, reject) => {
        var sql = "DELETE FROM tb_assigned_drivers WHERE driver_id = ? AND quote_id = ? AND affiliateDriver = 0"
        pool.getConnection((err, conn) => {
            if (err) reject(err)
            conn.query(sql, [driver_id, quote_id], (err, rows, fields) => {
                conn.destroy()
                if (err) reject(err)
                if (rows.affectedRows > 0) {
                    resolve(true)
                } else {
                    resolve(false)
                }
            })
        })
    })
}

const updateDriverAccept = (driver_id, quote_id, pool) => {
    return new Promise((resolve, reject) => {
        var sql = "UPDATE tb_assigned_drivers SET driver_confirm = ? WHERE driver_id = ? AND quote_id = ? AND affiliateDriver = 0"
        console.log(sql.replace(['?', '?', '?'], [moment().format('YYYY-MM-DD HH:mm:ss'), driver_id, quote_id]))
        pool.getConnection((err, conn) => {
            if (err) reject(err)
            conn.query(sql, [moment().utc().format('YYYY-MM-DD HH:mm:ss'), driver_id, quote_id], (err, rows, fields) => {
                conn.destroy()
                if (err) reject(err)
                if (rows['changedRows'] > 0) {
                    resolve(true)
                } else {
                    resolve(false)
                }
            })
        })
    })
}

const checkStatusBooking = (quote_id, pool) => {
    return new Promise((resolve, reject) => {
        var sql = "SELECT status_re FROM tb_quote WHERE quote_id = ?"
        pool.getConnection((err, conn) => {
            if (err) reject(err)
            conn.query(sql, [quote_id], (err, rows, fields) => {
                conn.destroy()
                if (err) reject(err)
                if (rows.length > 0) {
                    if (rows[0].status_re == 'B') {
                        resolve(true)
                    } else {
                        resolve(false)
                    }
                } else {
                    resolve(false)
                }
            })
        })
    })
}

const getMovements = (quote_id, driver_id, pool) => {
    return new Promise((resolve, reject) => {
        var sql = `SELECT M.movement_id , M.movement_order FROM tb_quote_movement M
                    INNER JOIN tb_assigned_drivers AD  ON M.movement_id = AD.movement_id
                    WHERE AD.quote_id = ? AND AD.driver_id = ?`
        pool.getConnection((err, conn) => {
            if (err) reject(err)
            conn.query(sql, [quote_id, driver_id], (err, rows, fields) => {
                conn.destroy()
                if (err) reject(err)
                resolve(rows)
            })
        })
    })
}