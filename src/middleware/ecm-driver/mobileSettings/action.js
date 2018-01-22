export const getMobileSettings = (pool) => {
    return new Promise((resolve, reject) => {
        var sql = "SELECT * FROM `tb_config_int` WHERE `key` LIKE '%app_setting_show_only_allocated%' OR `key` LIKE '%app_setting_download_vehicle_history%'"
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