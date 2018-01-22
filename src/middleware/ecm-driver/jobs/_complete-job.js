import moment from 'moment'



export const getQuoteID = (driver_id, pool)=>{
    return new Promise((resolve, reject)=>{

        let sql = `SELECT 
                        A.quote_id 
                    FROM 
                        tb_assigned_drivers A 
                    LEFT JOIN tb_quote_movement M ON (A.movement_id=M.movement_id) 
                    LEFT JOIN tb_quote Q ON(Q.quote_id=A.quote_id) 
                    WHERE 
                        A.driver_id = ? 
                    AND 
                        Q.status_re='C' 
                    GROUP BY A.quote_id ORDER BY M.datetime_start ASC`
        

        pool.getConnection((err, conn) => {
            console.log("pool getQuoteID connection error:",err)
            conn.query( sql, [driver_id],(err, rows, fields)=>{
                conn.destroy()

                if(err) throw err
            
                resolve(rows)
                
            })
        })
    })
}

export const getMovement = (qid, driver_id, pool)=>{
    return new Promise((resolve, reject)=>{

        let sql = `SELECT 
                        Q.quote_id, Q.default_num_id, Q.total_price, Q.price,
                        M.movement_id, M.datetime_start, M.collection_address, M.destination_address, M.driver_confirm, 
                        A.driver_pay, A.outbound_hours,
                        (
                            SELECT SUM( amount ) AS total_payment
                            FROM  tb_payments 
                            WHERE quote_id = ?
                        ) AS payment
                    FROM 
                        tb_quote_movement M 
                    LEFT JOIN 
                        tb_assigned_drivers A ON(A.movement_id=M.movement_id) 
                    LEFT JOIN 
                        tb_quote Q ON(Q.quote_id=M.quote_id) 
                    WHERE 
                        M.quote_id = ? 
                    AND 
                        A.driver_id = ? 
                    AND 
                        Q.status_re='C' 
                    ORDER BY M.movement_order ASC`
        

        pool.getConnection((err, conn) => {
            console.log("pool getMovement connection error:",err)
            conn.query( sql, [qid, qid, driver_id],(err, rows, fields)=>{
                conn.destroy()

                if(err) throw err
            
                resolve(rows)
                
            })
        })
    })
}

export const isJobAccept = (qid, driver_id, pool)=>{
    return new Promise((resolve, reject)=>{

        let sql = `SELECT COUNT(*) AS amount
                    FROM 
                        tb_quote_movement M 
                    LEFT JOIN 
                        tb_assigned_drivers A ON(M.movement_id=A.movement_id) 
                    LEFT JOIN 
                        tb_quote Q ON(Q.quote_id=M.quote_id) 
                    WHERE 
                        M.quote_id = ? 
                    AND 
                        A.driver_id = ? 
                    AND 
                        Q.status_re='C'
                    AND 
                        A.driver_confirm IS NOT NULL`
        

        pool.getConnection((err, conn) => {
            console.log("pool isJobAccept connection error:",err)
            conn.query( sql, [qid, driver_id],(err, rows, fields)=>{
                conn.destroy()

                if(err) throw err

                if(rows[0].amount > 0){ //Accepted
                    resolve(true)
                }else{
                    resolve(false)
                }
                
            })
        })
    })
}

export const getMovementReturn = (qid, driver_id, pool)=>{
    return new Promise((resolve, reject)=>{

        let sql = `SELECT 
                        M.datetime_start,M.destination_address,
                        A.outbound_hours 
                    FROM 
                        tb_quote_movement M 
                    LEFT JOIN 
                        tb_assigned_drivers A ON(A.movement_id=M.movement_id) 
                    LEFT JOIN 
                        tb_quote Q ON(Q.quote_id=M.quote_id) 
                    WHERE 
                        M.quote_id = ?
                    AND 
                        A.driver_id = ?
                    AND 
                        Q.status_re='C' 
                    ORDER BY M.movement_order DESC LIMIT 1`
        

        pool.getConnection((err, conn) => {
            console.log("pool getMovementReturn connection error:",err)
            conn.query( sql, [qid, driver_id],(err, rows, fields)=>{
                conn.destroy()

                if(err) throw err

                var returnTXT = moment(rows[0].datetime_start).add(rows[0].outbound_hours*60, 'minutes').format('ddd Mo MMM YY H:mm')
                //console.log(returnTXT)
                resolve(returnTXT)
                
            })
        })
    })
}

export const getMovementOutward = (qid, driver_id, pool)=>{
    return new Promise((resolve, reject)=>{

        let sql = `SELECT 
                        M.datetime_start
                    FROM 
                        tb_quote_movement M 
                    LEFT JOIN 
                        tb_assigned_drivers A ON(A.movement_id=M.movement_id) 
                    LEFT JOIN 
                        tb_quote Q ON(Q.quote_id=M.quote_id) 
                    WHERE 
                        M.quote_id = ?
                    AND 
                        A.driver_id = ?
                    AND 
                        Q.status_re='C' 
                    ORDER BY M.movement_order ASC LIMIT 1`
        

        pool.getConnection((err, conn) => {
            console.log("pool getMovementOutward connection error:",err)
            conn.query( sql, [qid, driver_id],(err, rows, fields)=>{
                conn.destroy()

                if(err) throw err

                var outwardTXT = moment(rows[0].datetime_start).format('ddd Mo MMM YY H:mm')
                //console.log(returnTXT)
                resolve(outwardTXT)
                
            })
        })
    })
}

export const getBalanceDue = (qid, pool)=>{
    return new Promise(async(resolve, reject)=>{

        var total_price = await getTotalPrice(qid, pool)
        var payments    = await getPayment(qid, pool)

        var balance_due = total_price - payments
        resolve(balance_due)

    })
}

export const getTotalPrice = (qid, pool)=>{
    return new Promise((resolve, reject)=>{

        let sql = `SELECT 
                        Q.total_price, Q.price 
                    FROM 
                        tb_quote Q 
                    WHERE 
                        Q.quote_id = ?`
        

        pool.getConnection((err, conn) => {
            console.log("pool getTotalPrice connection error:",err)
            conn.query( sql, [qid],(err, rows, fields)=>{
                conn.destroy()

                if(err) throw err

                if(rows[0].total_price == 0) resolve(rows[0].price)
                else resolve(rows[0].total_price)
                
            })
        })
    })
}

export const getPayment = (qid, pool)=>{
    return new Promise((resolve, reject)=>{

        let sql = `SELECT SUM( amount ) AS total_payment
                    FROM  tb_payments 
                    WHERE quote_id = ?`

        pool.getConnection((err, conn) => {
            console.log("pool getPayment connection error:",err)
            conn.query( sql, [qid],(err, rows, fields)=>{
                conn.destroy()

                if(err) throw err

                resolve(rows[0].total_payment)
                
            })
        })
    })
}