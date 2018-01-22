import moment from 'moment'

export const getVehicleList = (driver_id, name, pool) => {
    return new Promise((resolve, reject) => {

        if (name == void(0) || name == "") {
            name = "%"
        }

        var condition = "%" + name + "%"

        var sql = `SELECT v . * , d . * 
                    FROM tb_vehicles AS v
                    LEFT JOIN tb_driver_check_results AS d ON ( v.vehicle_id = d.vehicle_id ) 
                    WHERE v.available = ?
                    AND (
                        v.vehicle_reg LIKE ?
                        OR
                        v.vehicle_make LIKE ?
                    )
                    AND d.driver_id = ?
                    GROUP BY v.vehicle_id`

        pool.getConnection((err, conn) => {
            console.log("pool getVehicleList connection error:", err)
            conn.query(sql, [1, condition, condition, driver_id], (err, rows, fields) => {
                conn.destroy()

                if (err) throw err

                resolve(rows)

            })
        })
    })
}


export const getVehicleCheckedList = (driver_id, pool) => {
    return new Promise((resolve, reject) => {

        var sql = `SELECT V.vehicle_reg,V.vehicle_id FROM tb_driver_check_results R 
                    INNER JOIN tb_vehicles V ON(V.vehicle_id=R.vehicle_id) 
                    WHERE R.driver_id = ? 
                    GROUP BY R.vehicle_id `

        pool.getConnection((err, conn) => {
            console.log("pool getVehicleCheckedList connection error:", err)
            conn.query(sql, [driver_id], (err, rows, fields) => {
                conn.destroy()

                if (err) throw err

                resolve(rows)

            })
        })
    })
}

export const getHistoryList = (driver_id, vehicle_id, pool) => {
    return new Promise((resolve, reject) => {

        var sql = `SELECT R.vehicle_id,R.chk_res_id,R.chk_time,R.chk_pass,
                            D.first_name,D.surname 
                    FROM tb_driver_check_results R 
                    LEFT JOIN tb_drivers D ON(R.driver_id=D.driver_id)  
                    WHERE R.vehicle_id = ?
                    AND R.driver_id = ?`

        pool.getConnection((err, conn) => {
            console.log("pool getHistoryList connection error:", err)
            conn.query(sql, [vehicle_id, driver_id], (err, rows, fields) => {
                conn.destroy()

                if (err) throw err

                for (let i in rows) {
                    rows[i].chk_time = moment(rows[i].chk_time).format('DD MMM YYYY HH:mm:ss')
                }

                resolve(rows)

            })
        })
    })
}

export const getHistory = async(driver_id, check_res_id, veh_id, page_no, site_url, pool) => {

    var chk_res_list = await getCheckResultList(driver_id, check_res_id, veh_id, page_no, pool)
    var arr = []

    for (var i = 0; i < chk_res_list.length; i++) {
        let re = getResultList(driver_id, check_res_id, chk_res_list[i].chk_id, veh_id, site_url, pool)
        arr.push(await re)
    }

    return arr
}

const getCheckResultList = (driver_id, check_res_id, veh_id, page_no, pool) => {
    return new Promise((resolve, reject) => {

        let resultPerPage = 10
        let start = page_no - 1

        if (page_no > 1) {
            start = ((page_no - 1) * resultPerPage)
        }
        let limit = ''
            //limit = " LIMIT " + start + ", " + resultPerPage

        var sql = `SELECT chk_res_id, chk_id 
                FROM tb_driver_check_results_single 
                WHERE chk_res_id = ? 
                AND vehicle_id = ? 
                AND driver_id = ?
                GROUP BY chk_id ${limit}`

        pool.getConnection((err, conn) => {
            console.log("pool getCheckResultList connection error:", err)
            conn.query(sql, [check_res_id, veh_id, driver_id], (err, rows, fields) => {
                conn.destroy()
                if (err) throw err

                resolve(rows)
            })
        })
    })
}

const getResultList = (driver_id, check_res_id, chk_id, veh_id, site_url, pool) => {
    return new Promise((resolve, reject) => {

        var sql = `SELECT * FROM tb_driver_check_results_single 
                    WHERE chk_res_id = ? 
                    AND chk_id = ?
                    AND driver_id = ?
                    AND vehicle_id = ?`


        pool.getConnection((err, conn) => {
            console.log("pool getResultList connection error:", err)
            conn.query(sql, [check_res_id, chk_id, driver_id, veh_id], async(err, rows, fields) => {
                conn.destroy()

                if (err) throw err

                let photo = getPhotoPath(rows[0].chk_res_sing_id, site_url, pool)
                let question = getQuestion(rows[0].chk_id, pool)

                let fail = 0
                let c_fail = 0

                if (rows[0].chk_pass == 1) {
                    rows[0].chk_notes_bg_color = 'green'
                } else if (rows[0].chk_critical_fail == 1) {
                    c_fail = c_fail + 1
                    rows[0].chk_notes_bg_color = 'red'
                } else {
                    fail = fail + 1
                    rows[0].chk_notes_bg_color = 'orange'
                }

                if (c_fail > 0) {
                    rows[0].status = 'Fail'
                    rows[0].status_bg = 'red'
                } else if (fail > 0) {
                    rows[0].status = 'Minor Issue'
                    rows[0].status_bg = 'orange'
                } else {
                    rows[0].status = 'Pass'
                    rows[0].status_bg = 'green'
                }

                rows[0].chk_date_convert = moment(rows[0].chk_date).format('DD MMM YYYY HH:mm:ss')
                if (rows[0].chk_date_convert == 'Invalid date') {
                    rows[0].chk_date_convert = '-'
                }

                rows[0].chk_img = await photo
                rows[0].question = await question

                resolve(rows[0])

            })
        })
    })
}

export const numrowResult = (driver_id, check_res_id, vid, pool) => {
    return new Promise((resolve, reject) => {

        var sql = `SELECT count(*) AS amount 
                FROM tb_driver_check_results_single 
                WHERE chk_res_id = ?
                AND driver_id = ?
                AND vehicle_id = ? GROUP BY chk_id`

        pool.getConnection((err, conn) => {
            console.log("pool numrowResult connection error:", err)
            conn.query(sql, [check_res_id, driver_id, vid], (err, rows, fields) => {
                conn.destroy()

                if (err) throw err

                resolve(rows.length)

            })
        })
    })
}

const getPhotoPath = (check_res_single_id, site_url, pool) => {
    return new Promise((resolve, reject) => {

        var sql = `SELECT chk_photo_filepath 
                    FROM tb_driver_checks_photo 
                    WHERE chk_res_sing_id = ?`

        pool.getConnection((err, conn) => {
            console.log("pool getPhotoPath connection error:", err)
            conn.query(sql, [check_res_single_id], (err, rows, fields) => {
                conn.destroy()

                if (err) throw err
                let arr = []
                for (var i in rows) {
                    arr.push(site_url + 'uploads/' + rows[i].chk_photo_filepath)
                }

                resolve(arr)

            })
        })
    })
}

const getQuestion = (chk_id, pool) => {
    return new Promise((resolve, reject) => {

        var sanitizeHtml = require('sanitize-html')
        var S = require('string')
        var sanitizeHtmlOption = {
            allowedTags: []
        }

        var sql = `SELECT chk_desc 
                FROM tb_driver_checks 
                WHERE chk_id = ?`

        pool.getConnection((err, conn) => {
            console.log("pool getQuestion connection error:", err)
            conn.query(sql, [chk_id], (err, rows, fields) => {
                conn.destroy()
                if (err) throw err
                let result = S(sanitizeHtml(rows[0].chk_desc, sanitizeHtmlOption)).collapseWhitespace().s
                resolve(result)

            })
        })
    })
}

export const getCheckSheet = (pool) => {
    return new Promise((resolve, reject) => {

        var sql = `SELECT *
                FROM tb_driver_checks
				ORDER BY chk_order`

        pool.getConnection((err, conn) => {
            console.log("pool getCheckSheet connection error:", err)
            conn.query(sql, (err, rows, fields) => {
                conn.destroy()
                if (err) throw err
                resolve(rows)
            })
        })
    })
}

export const updateCheckResult = (driver_id, quote_id, body, timecheck, pool) => {
    return new Promise((resolve, reject) => {
        var now = timecheck
        let movement_id = (body[0].movement_id == void(0) ? 0 : body[0].movement_id)
        let vehicle_id = (body[0].vehicle_id == void(0) ? 0 : body[0].vehicle_id)

        var sql = `INSERT INTO tb_driver_check_results 
                    SET chk_pass=0 , 
                    chk_fail_cnt=0 , 
                    chk_critical_fail_cnt=0 , 
                    chk_time='${now}' , 
                    driver_id='${driver_id}' , 
                    vehicle_id='${vehicle_id}' , 
                    quote_id='${quote_id}' , 
                    movement_id='${movement_id}'`

        pool.getConnection((err, conn) => {
            console.log("pool updateCheckResult connection error:", err)
            conn.beginTransaction((err) => {
                if (err) { throw err }
                conn.query(sql, (err, rows, fields) => {
                    if (err) {
                        console.log(err)
                        return conn.rollback(() => {
                            throw err
                        })
                    }
                    //console.log("success", sql)

                    var passCount = 0
                    var failCount = 0
                    var criFailCount = 0
                    var chk_res_id = rows.insertId
                    var insertMultiRowSQL = "INSERT INTO tb_driver_check_results_single (chk_res_id, chk_id, chk_pass, chk_critical_fail, chk_notes, chk_date, chk_status, quote_id, movement_id, driver_id, vehicle_id) VALUES "

                    for (var i = 0; i < body.length; i++) {

                        let cri_val = 0
                        let chk_pass = body[i].value

                        if (body[i].critical) { cri_val = 0 } else {
                            cri_val = 1
                            criFailCount++
                        }

                        if (chk_pass == 1) { passCount++ }

                        if (cri_val == 0 &&
                            chk_pass == 0) { failCount++ }

                        insertMultiRowSQL += "('" + chk_res_id + "', '" + body[i].chk_id + "', '" + chk_pass + "', '" + cri_val + "', '" + body[i].title + "', '" + now + "', 'N', '" + quote_id + "', '" + movement_id + "', '" + driver_id + "', '" + vehicle_id + "')"

                        if (i == body.length - 1) {
                            insertMultiRowSQL += ";"
                        } else {
                            insertMultiRowSQL += ","
                        }
                    }

                    //console.log(insertMultiRowSQL)

                    conn.query(insertMultiRowSQL, (error, results, fields) => {
                        if (error) {
                            console.log("insertMultiRowSQL error", error)
                            return conn.rollback(() => {
                                throw error
                            })
                        }
                        conn.commit((err) => {
                            if (err) {
                                return conn.rollback(() => {
                                    throw err
                                })
                            }
                            console.log('success insertMultiRowSQL!', results)
                        })
                    })

                    if (criFailCount == 0 &&
                        passCount > 0) {
                        passCount = 1
                    } else {
                        passCount = 0
                    }

                    var updateSQL = "UPDATE tb_driver_check_results SET chk_pass='" + passCount +
                        "' , chk_fail_cnt='" + failCount +
                        "' , chk_critical_fail_cnt='" + criFailCount +
                        "' , chk_time = '" + now + "' WHERE chk_res_id='" + chk_res_id + "' "

                    conn.query(updateSQL, (error, results, fields) => {
                        if (error) {
                            return conn.rollback(() => {
                                throw error
                            })
                        }
                        conn.commit((err) => {
                            if (err) {
                                return conn.rollback(() => {
                                    throw err
                                })
                            }
                            console.log('success! updateSQL', results)
                        })
                    })

                    conn.query(`SELECT * FROM tb_driver_check_results_single WHERE chk_res_id = ?`, [chk_res_id], (error, results, fields) => {
                        if (error) {
                            return conn.rollback(() => {
                                throw error
                            })
                        }
                        conn.commit((err) => {
                            if (err) {
                                return conn.rollback(() => {
                                    throw err
                                })
                            }
                            conn.destroy()
                            console.log('success! SELECT result list')
                            resolve(results)
                        })
                    })

                })
            })
        })
    })
}