export const enroute = (movement_id, pool) => {
    return new Promise((resolve, reject) => {
        var sql = `
            UPDATE tb_job_passengers SET status = '-1' 
            WHERE point_id = ? AND status = 0 AND pickup = 1
        `
        pool.getConnection((err, conn) => {
            if (err) reject(err)
            conn.query(sql, [movement_id], (err, rows) => {
                conn.destroy()
                if (err) reject(err)
                console.log('enRoute', rows)
                resolve(rows.affectedRows)
            })
        })
    })
}

export const getFailedBoardPassengerByRoute = (movement_id, pool) => {
    return new Promise((resolve, reject) => {
        var sql = `
            SELECT * FROM tb_job_passengers
            WHERE point_id = ? AND pickup = 1 AND status = '-1' 
        `
        pool.getConnection((err, conn) => {
            if (err) reject(err)
            conn.query(sql, [movement_id], (err, rows) => {
                conn.destroy()
                if (err) reject(err)
                console.log('getFailedBoardPassengerByRoute', rows)
                resolve(rows)
            })
        })
    })
}

export const endRoute = (movement_id, quote_id, datetime, pool) => {
    return new Promise(async(resolve, reject) => {
        var failedPassengers = await alreadyFailed(quote_id, pool)
        var sql = `
            UPDATE tb_job_passengers SET status = '1'  , force_login = 1 , date_time_scan = ?
            WHERE quote_id = ? AND status = 0 AND pickup = 0
        `
        if (failedPassengers.length > 0) {
            sql += `AND passenger_id NOT IN (${failedPassengers.map((item) => item.passenger_id).join(',')})`
        }
        console.log('alreadyFailed', failedPassengers, failedPassengers.map((item) => item.passenger_id).join(','))
        pool.getConnection((err, conn) => {
            if (err) reject(err)
            conn.query(sql, [datetime, quote_id], (err, rows) => {
                conn.destroy()
                if (err) reject(err)
                console.log('endRoute Error:', err)
                console.log('endRoute', rows)
                resolve(rows.affectedRows)
            })
        })
    })
}

const alreadyFailed = (quote_id, pool) => {
    return new Promise((resolve, reject) => {
        var sql = `SELECT passenger_id FROM tb_job_passengers WHERE status = '-1' AND pickup = 1 AND quote_id = ?`
        pool.getConnection((err, conn) => {
            if (err) reject(err)
            conn.query(sql, [quote_id], (err, rows) => {
                conn.destroy()
                if (err) reject(err)
                resolve(rows)
            })
        })
    })
}