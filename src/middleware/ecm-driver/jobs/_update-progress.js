import moment from 'moment'

export const updateProgressMovement = (movement_order, progress_status, quote_id, pool) => {
    return new Promise((resolve, reject) => {

        let sql = `UPDATE tb_quote_movement 
                    SET 
                        progress = ? 
                    WHERE 
                        movement_order = ? AND quote_id= ?`

        pool.getConnection((err, conn) => {
            console.log("pool updateProgressMovement connection error:", err)
            conn.query(sql, [progress_status, movement_order, quote_id], (err, rows, fields) => {
                conn.destroy()
                if (err) reject(err)
                console.log("updateProgressMovement", rows)
                if (rows.affectedRows > 0) {
                    resolve(true)
                } else {
                    resolve(false)
                }

            })
        })
    })
}

export const updateProgressMovementsInJob = (quote_id, progress_status, pool) => {
    return new Promise((resolve, reject) => {
        let sql = `UPDATE tb_quote_movement 
                    SET 
                        progress = ? 
                    WHERE 
                        quote_id= ?`
        pool.getConnection((err, conn) => {
            console.log("pool updateProgressMovementsInJob connection error:", err)
            conn.query(sql, [progress_status, quote_id], (err, rows, fields) => {
                conn.destroy()
                if (err) reject(err)
                console.log("updateProgressMovementsInJob", rows)
                if (rows.affectedRows > 0) {
                    resolve(true)
                } else {
                    resolve(false)
                }

            })
        })
    })
}

export const updateProgressQuote = (quote_id, progress_status, pool) => {
    return new Promise((resolve, reject) => {
        let sql = `UPDATE tb_quote 
                    SET 
                        progress = ? 
                    WHERE 
                        quote_id = ?`

        pool.getConnection((err, conn) => {
            console.log("pool updateProgressQuote connection error:", err)
            conn.query(sql, [progress_status, quote_id], (err, rows, fields) => {
                conn.destroy()

                if (err) throw err
                console.log("updateProgressQuote", rows)
                if (rows.affectedRows > 0) {
                    resolve(true)
                } else {
                    resolve(false)
                }
            })
        })
    })
}

export const progressUpdateAt = (movement_order, quote_id, pool) => {
    return new Promise((resolve, reject) => {
        var sql = `
        UPDATE tb_movement_options SET progress_updated = ? 
        WHERE movement_id = (SELECT movement_id FROM tb_quote_movement WHERE quote_id = ? AND movement_order = ?)
    `
        pool.getConnection((err, conn) => {
            console.log("pool progressUpdateAt connection error:", err)
            conn.query(sql, [moment().utc().format('YYYY-MM-DD HH:mm:ss'), quote_id, movement_order], (err, rows, fields) => {
                conn.destroy()

                if (err) throw err
                console.log("updateProgressQuote", rows)
                if (rows.affectedRows > 0) {
                    resolve(true)
                } else {
                    resolve(false)
                }
            })
        })
    })


}

export const getPointName = (qid, point_id, pool) => {
    return new Promise((resolve, reject) => {

        let pointNameSQL = ``

        if (point_id == -1) {
            pointNameSQL += `SELECT collection_address AS point_name FROM tb_quote_movement WHERE quote_id = '${qid}' ORDER BY  movement_order ASC LIMIT 1`
        } else if (point_id == -2) {
            pointNameSQL += `SELECT destination_address AS point_name FROM tb_quote_movement WHERE quote_id = '${qid}' ORDER BY  movement_order DESC LIMIT 1`
        } else if (point_id > 0) {
            pointNameSQL += `SELECT collection_address AS point_name FROM tb_quote_movement WHERE quote_id = '${qid}' AND movement_id = '${point_id}'`
        }

        pool.getConnection((err, conn) => {
            if (err) reject(err)

            conn.query(pointNameSQL, (err, re, fields) => {
                conn.destroy()

                if (err) reject(err) //console.log(err)

                resolve(re[0].point_name)
            })
        })

    })
}