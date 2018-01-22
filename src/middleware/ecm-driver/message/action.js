import request from 'request'

export const getRoute = (quote_id, pool) => {
    let action = new Promise((resolve, reject) => {
        console.log('getRoute')
        pool.getConnection((err, conn) => {
            if (err) throw err
            conn.query(`SELECT jc.job_name, jc.account, jc.contractID, c.contractName AS contract_name, ac.name AS account_name
                        FROM tb_contract_quote AS cq, tb_job_contract AS jc, tb_accounts AS ac, tb_contract AS c
                        WHERE cq.jobID = jc.jobID
                        AND jc.account = ac.account_id
                        AND cq.contractID = c.contractID
                        AND cq.quote_id = ?`, [quote_id], (err, rows, fields) => {
                conn.destroy()
                if (err) throw err
                if (rows != void(0) && rows.length > 0) resolve(rows[0])
                else resolve("")
            })
        })
    })
    return action
}

export const getLocationName = (lat, lng) => {
    return new Promise((resolve, reject) => {
        var url = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + lat + "," + lng + '&sensor=true&key=AIzaSyC-s1gGq15TJrXstQm1cz6TV6ThTPr7NIs'

        request(url, function(error, response, body) {
            body = JSON.parse(body)
            console.log(body)
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