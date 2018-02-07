import moment from 'moment'


export const getPassengerForFirstMovement = async(quote_id, j_id, pool) => {
    return new Promise((resolve, reject) => {
        var sql = `
        SELECT * FROM tb_job_passengers JP 
        INNER JOIN tb_passengers P ON P.passenger_id = JP.passenger_id
        INNER JOIN tb_quote Q ON JP.quote_id = Q.quote_id
        INNER JOIN tb_quote_movement M ON JP.point_id = M.movement_id
        WHERE Q.quote_id = ? AND M.j_id = ? `

        pool.getConnection((err, conn) => {
            if (err) reject(err)
            console.log("pool getPassengerForFirstMovement connection error:", err)
            conn.query(sql, [quote_id, j_id], (err, rows) => {
                conn.destroy()
                if (err) reject(err)
                resolve(rows)
            })
        })
    })


}

export const getPassengersByMovement = async(movement, pool) => {
    return new Promise((resolve, reject) => {
        var sql = `
                    SELECT * FROM tb_job_passengers JP
                    INNER JOIN tb_passengers P ON P.passenger_id = JP.passenger_id
                    WHERE point_id = ?
                        `
        pool.getConnection((err, conn) => {
            if (err) reject(err)
            console.log("pool getPassengersByMovement connection error:", err)
            conn.query(sql, [movement], async(err, rows, fields) => {
                conn.destroy()
                if (err) reject(err)
                var jobDetail = await getID(movement, pool)
                for (let i = 0; i < rows.length; i++) {
                    if (rows[i].pickup == 0 && rows[i].status == 0) {
                        var studenAlreadyBoard = await checkBeforeAligned(rows[i].passenger_id, jobDetail[0].quote_id, jobDetail[0].j_id, pool)
                        if (studenAlreadyBoard.length == 0) {
                            rows[i].status = -1
                            rows[i].pickup = 1
                        }
                        rows[i].parents = await findParent(rows[i].passenger_id, pool)
                    }
                }
                resolve(rows)
            })
        })
    })
}

const findParent = async(passenger_id, pool) => {
    return new Promise((resolve, reject) => {
        var sql = `
                    SELECT email FROM tb_parent P
                    INNER JOIN tb_parent_passenger PP ON P.parent_id = PP.parent_id
                    WHERE PP.passenger_id = ?
                        `
        pool.getConnection((err, conn) => {
            if (err) reject(err)
            conn.query(sql, [passenger_id], (err, rows) => {
                conn.destroy()
                if (err) reject(err)
                resolve(rows)
            })
        })
    })
}

const getJobPattern = (quote_id, pool) => {
    return new Promise((resolve, reject) => {
        var sql = `
                    SELECT job_name FROM tb_job_contract JC
                    INNER JOIN tb_contract_quote CQ ON CQ.jobID = JC.jobID
                    WHERE CQ.quote_id = ?
                        `
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

const getID = (movement, pool) => {
    return new Promise((resolve, reject) => {
        var sql = `
                    SELECT j_id, quote_id FROM tb_quote_movement WHERE movement_id = ?
                        `
        pool.getConnection((err, conn) => {
            if (err) reject(err)
            console.log("pool getID connection error:", err)
            conn.query(sql, [movement], (err, rows, fields) => {
                conn.destroy()
                if (err) reject(err)
                resolve(rows)
            })
        })
    })
}

const checkBeforeAligned = (passenger_id, quote_id, j_id, pool) => {
    return new Promise((resolve, reject) => {
        var sql = `
                    SELECT * FROM tb_job_passengers JP
                    WHERE passenger_id = ? AND quote_id = ? AND j_id = ? AND pickup = 1 AND status = 1 `
        pool.getConnection((err, conn) => {
            if (err) reject(err)
            console.log("pool checkBeforeAligned connection error:", err)
            conn.query(sql, [passenger_id, quote_id, j_id], (err, rows) => {
                conn.destroy()
                if (err) reject(err)
                resolve(rows)
            })
        })
    })
}

export const cloneToHistory = (passenger_id, pickup, quote_id, pool) => {
    return new Promise((resolve, reject) => {
        var sql = 'INSERT INTO tb_job_passengers_history (job_passengers_id, quote_id, passenger_id, point_id, pickup, side, status, date_time_scan, `return`, force_login, log_id, j_id, movement_order, action_point_id , note) SELECT * FROM tb_job_passengers WHERE passenger_id = ? AND pickup = ? AND quote_id = ? LIMIT 1'
        pool.getConnection((err, conn) => {
            if (err) reject(err)
            console.log("pool cloneToHistory connection error:", err)
            conn.query(sql, [passenger_id, pickup, quote_id], (err, rows, fields) => {
                conn.destroy()
                if (err) throw err
                resolve(rows.insertId)
            })
        })
    })
}

export const updatePassengerStatus = (passenger_id, status_new, force_login, pickup, action_point_id, timescan, quote_id, pool) => {
    return new Promise((resolve, reject) => {
        var sql = ""
        var params = []
        sql = `
                    UPDATE tb_job_passengers SET status = ? , force_login = ? , date_time_scan = ? , action_point_id = ?
                        WHERE passenger_id = ?  AND pickup = ? AND quote_id = ?
                        `
        params = [status_new, force_login, timescan, action_point_id, passenger_id, pickup, quote_id]

        pool.getConnection((err, conn) => {
            if (err) reject(err)
            console.log("pool updatePassengerStatus connection error:", err)
            conn.query(sql, params, (err, rows, fields) => {
                conn.destroy()
                if (err) throw err
                resolve(rows.changedRows)
            })
        })
    })
}

export const searchPassenger = (query, quote_id, pool) => {
    return new Promise((resolve, reject) => {
        var sql = `
                SELECT JP.*, P.*, M.j_id , M.movement_order , 
                (M.collection_address) as correctPickUp, (M.destination_address) as correctDestination FROM tb_job_passengers JP
                INNER JOIN tb_passengers P ON P.passenger_id = JP.passenger_id
                INNER JOIN tb_quote_movement M ON JP.point_id = M.movement_id
                WHERE JP.quote_id = ? AND (P.first_name LIKE ? OR P.surname LIKE ? ) AND JP.status != 1 `
        pool.getConnection((err, conn) => {
            if (err) reject(err)
            console.log("pool searchPassenger connection error:", err)
            conn.query(sql, [quote_id, `%${ query }%`, `%${ query }%`], async(err, rows, fields) => {
                conn.destroy()
                if (err) throw err
                for (let i = 0; i < rows.length; i++) {
                    rows[i].parents = await findParent(rows[i].passenger_id, pool)
                    rows[i].jobPattern = await getJobPattern(quote_id, pool)
                }
                resolve(rows)
            })
        })
    })
}

export const getAllPassengerInJob = (quote_id, pool) => {
    return new Promise((resolve, reject) => {
        var sql = `
                    SELECT JP.*, P.*, M.j_id , M.movement_order , 
                    (M.collection_address) as correctPickUp, (M.destination_address) as correctDestination FROM tb_job_passengers JP
                    INNER JOIN tb_passengers P ON P.passenger_id = JP.passenger_id
                    INNER JOIN tb_quote_movement M ON JP.point_id = M.movement_id
                    WHERE JP.quote_id = ?
                        `
        pool.getConnection((err, conn) => {
            if (err) reject(err)
            console.log("pool getAllPassengerInJob connection error:", err)
            conn.query(sql, [quote_id], async(err, rows, fields) => {
                conn.destroy()
                if (err) reject(err)
                for (let i = 0; i < rows.length; i++) {
                    rows[i].parents = await findParent(rows[i].passenger_id, pool)
                    rows[i].jobPattern = await getJobPattern(quote_id, pool)
                }
                resolve(rows)
            })
        })
    })
}

export const getAllPassengerInSystem = (pool) => {
    return new Promise((resolve, reject) => {
        var sql = `
                    SELECT * FROM tb_passengers `

        pool.getConnection((err, conn) => {
            if (err) reject(err)
            console.log("pool getAllPassengerInSystem connection error:", err)
            conn.query(sql, async(err, rows, fields) => {
                conn.destroy()
                if (err) reject(err)
                for (let i = 0; i < rows.length; i++) {
                    rows[i].parents = await findParent(rows[i].passenger_id, pool)
                }
                resolve(rows)
            })
        })
    })
}

export const getPassengerQuestions = (pool) => {
    return new Promise((resolve, reject) => {
        var sql = `SELECT * FROM tb_passenger_question`
        pool.getConnection((err, conn) => {
            if (err) reject(err)
            console.log("pool getPassengerQuestions connection error:", err)
            conn.query(sql, (err, rows, fields) => {
                conn.destroy()
                if (err) reject(err)
                resolve(rows)
            })
        })
    })
}

export const addPassengerNote = (quote_id, passenger_id, note, timeAdd, pool) => {
    return new Promise((resolve, reject) => {
        var sql = `INSERT INTO tb_passenger_note SET quote_id = ? , passenger_id = ? , note = ? , date_time = ?`
        pool.getConnection((err, conn) => {
            if (err) reject(err)
            console.log("pool addPassengerNote connection error:", err)
            conn.query(sql, [quote_id, passenger_id, note, timeAdd], (err, rows, fields) => {
                conn.destroy()
                if (err) reject(err)
                resolve(rows.insertId)
            })
        })
    })
}

export const addPassengerAnswer = (answer, quest_id, quote_id, movement_id, passenger_id, pool) => {
    return new Promise((resolve, reject) => {
        var sql = `INSERT INTO tb_passenger_answer SET quote_id = ? , passenger_id = ? , answer = ? , qut_id = ? , point_id = ?`
        pool.getConnection((err, conn) => {
            if (err) reject(err)
            console.log("pool addPassengerNote connection error:", err)
            conn.query(sql, [quote_id, passenger_id, answer, quest_id, movement_id], (err, rows, fields) => {
                conn.destroy()
                if (err) reject(err)
                resolve(rows.insertId)
            })
        })
    })
}