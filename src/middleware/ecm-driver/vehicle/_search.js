export const getVehicleByName = (veh_name, pool)=>{
    return new Promise((resolve, reject)=>{

        var sql = `SELECT vehicle_reg,vehicle_id 
                    FROM tb_vehicles 
                    WHERE available=1 AND vehicle_reg LIKE '%${veh_name}%'`

        //console.log(sql)

        pool.getConnection((err, conn) => {
            console.log("pool getVehicleByName connection error:",err)
            conn.query( sql,(err, rows, fields)=>{
                conn.destroy()

                if(err) {
                    err.method = "getVehicleByName"; 
                    throw err;
                }
            
                resolve(rows)
                
            })
        })
    })
}

export const getVehicleByID = (veh_id, pool)=>{
    return new Promise((resolve, reject)=>{

        var sql = `SELECT vehicle_reg,vehicle_id 
                    FROM tb_vehicles 
                    WHERE available=1 AND vehicle_id LIKE '%${veh_id}%'`
        
        pool.getConnection((err, conn) => {
            console.log("pool getVehicleByID connection error:",err)
            conn.query( sql,(err, rows, fields)=>{
                conn.destroy()

                if(err) err.method = "getVehicleByID"; throw err
            
                resolve(rows)
                
            })
        })
    })
}