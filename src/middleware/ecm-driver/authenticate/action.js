export const login = (username, password, pool) => {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, conn) => {
            if (err) throw err
            console.log(`SELECT * 
            FROM tb_drivers
            WHERE username = ${username}
            AND password = ${password}
            AND enabled = 1`)
            conn.query(`SELECT * 
                        FROM tb_drivers
                        WHERE username = ?
                        AND password = ? 
                        AND enabled = ? `, [username, password, '1'], async(err, rows, fields) => {
                if (err) {
                    conn.destroy()
                    throw err
                }
                conn.destroy()

                resolve(rows)
            })
        })
    })
}