export const getMobileSettings = (pool) => {
    return new Promise((resolve, reject) => {
        var sql = "SELECT * FROM `tb_config_int` WHERE `key` LIKE '%app_setting_show_only_allocated%' OR `key` LIKE '%app_setting_download_vehicle_history%' OR `key` LIKE '%enable_broadcast%'"
        pool.getConnection((err, conn) => {
            if (err) reject(err)
            conn.query(sql, (err, rows) => {
                conn.destroy()
                if (err) reject(err)
                resolve(rows)
            })
        })
    })
}



export const getMobileSettingsStr = (pool) => {
    return new Promise((resolve, reject) => {
        var sql = "SELECT * FROM `tb_config_str` WHERE `key` = 'broadcast_audio' OR `key` = 'voice_url'"
        pool.getConnection((err, conn) => {
            if (err) reject(err)
            conn.query(sql, (err, rows) => {
                conn.destroy()
                if (err) reject(err)
                resolve(rows)
            })
        })
    })
}

export const checkToken = (token, driver_id, pool) => {
    return new Promise((resolve, reject) => {
        var sql = "SELECT * FROM tb_driver_app_token WHERE token = ? AND driver_id = ?"
        console.log(sql, token, driver_id)
        pool.getConnection((err, conn) => {
            if (err) reject(err)
            conn.query(sql, [token, driver_id], (err, rows) => {
                conn.destroy()
                if (err) reject(err)
                console.log(rows)
                if (rows.length > 0) resolve(true)
                else resolve(false)
            })
        })
    })
}

export const saveToken = (token, driver_id, pool) => {
    return new Promise(async(resolve, reject) => {
        var check = await checkToken(token, driver_id, pool)
        if (!check) {
            var sql = "INSERT INTO tb_driver_app_token SET token = ? , driver_id = ?"
            console.log(sql, token, driver_id)
            pool.getConnection((err, conn) => {
                if (err) reject(err)
                conn.query(sql, [token, driver_id], (err, rows) => {
                    conn.destroy()
                    if (err) reject(err)
                    console.log(rows)
                    resolve(rows)
                })
            })
        } else {
            resolve(true)
        }
    })
}

export const deleteToken = (tokenItem, driver_id, pool) => {
    return new Promise((resolve, reject) => {
        var sql = "DELETE FROM tb_driver_app_token WHERE token = ? AND driver_id = ?"
        console.log(sql, tokenItem, driver_id)
        pool.getConnection((err, conn) => {
            if (err) reject(err)
            conn.query(sql, [tokenItem, driver_id], (err, rows) => {
                conn.destroy()
                if (err) reject(err)
                resolve(rows)
            })
        })
    })
}

export const getLang = (pool) => {
    return new Promise((resolve, reject) => {
        var sql = "SELECT lang FROM tb_translate_mobile GROUP BY lang";
        pool.getConnection((err, conn) => {
            if (err) reject(err)
            conn.query(sql, (err, rows) => {
                conn.destroy()
                if (err) reject(err)
                resolve(rows)
            })
        })
    })
}

export const getWordByLang = (lang, pool) => {
    return new Promise((resolve, reject) => {
        var sql = "SELECT * FROM tb_translate_mobile WHERE lang = ?";
        pool.getConnection((err, conn) => {
            if (err) reject(err)
            conn.query(sql, [lang], (err, rows) => {
                conn.destroy()
                if (err) reject(err)
                resolve(rows)
            })
        })
    })
}

export const getWalkieTalkieSetting = (pool) => {
    return new Promise((resolve, reject) => {
        var sql = "SELECT * FROM tb_config_int WHERE key LIKE ?";
        pool.getConnection((err, conn) => {
            if (err) reject(err)
            conn.query(sql, ['%enable_broadcast%'], (err, rows) => {
                conn.destroy()
                if (err) reject(err)
                resolve(rows)
            })
        })
    })
}

export const saveDriverAction = ({ movement_id, action, date_time, lat, lng, type, quote_id }, driver_id, pool) => {
    return new Promise((resolve, reject) => {
        var sql = `INSERT INTO tb_driver_action 
                    SET
                    movement_id = ?,
                    progress_id = ? ,
                    date_time = ? ,
                    lat = ? ,
                    lng = ?,
                    type = ? ,
                    driver_id = ? ,
                    quote_id = ?
               `
        pool.getConnection((err, conn) => {
            if (err) reject(err)
            conn.query(sql, [movement_id, action, date_time, lat, lng, type, driver_id, quote_id], (err, rows) => {
                conn.destroy()
                if (err) reject(err)
                resolve(rows)
            })
        })
    })
}

export const saveDriverActionByMovementOrder = ({ quote_id, movement_order, action, date_time, lat, lng, type }, driver_id, pool) => {
    return new Promise((resolve, reject) => {
        var sql = `INSERT INTO tb_driver_action 
                    SET
                    movement_id = (SELECT movement_id FROM tb_quote_movement WHERE quote_id = ? AND movement_order = ?),
                    progress_id = ? ,
                    date_time = ? ,
                    lat = ? ,
                    lng = ?,
                    type = ? ,
                    driver_id = ? ,
                    quote_id = ?
               `
        pool.getConnection((err, conn) => {
            if (err) reject(err)
            conn.query(sql, [quote_id, movement_order, action, date_time, lat, lng, type, driver_id, quote_id], (err, rows) => {
                conn.destroy()
                if (err) reject(err)
                resolve(rows)
            })
        })
    })
}

export const saveDriverActionWhole = ({ quote_id, action, date_time, lat, lng, type }, driver_id, pool) => {
    return new Promise(async(resolve, reject) => {
        var movementIds = await getMovementIDs(quote_id, pool)
        var results = []
        for (let item of movementIds) {
            var params = { movement_id: item.movement_id, action, date_time, lat, lng, type, quote_id }
            var result = await saveDriverAction(params, driver_id, pool)
            results.push(result)
        }
        resolve(results.length)
    })
}

const getMovementIDs = (quote_id, pool) => {
    return new Promise((resolve, reject) => {
        var sql = `SELECT movement_id FROM tb_quote_movement WHERE quote_id = ?`
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