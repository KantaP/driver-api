export const getAllMovement = (qid, driver_id, pool) => {
    return new Promise((resolve, reject) => {

        let sql = `SELECT M.quote_id, M.movement_id, M.duration, M.mileage, M.collection_address, M.collection_notes, M.destination_notes,
                            M.movement_order, M.destination_address, M.flight, M.flight_time, M.flight_arrival, M.flight_arrival_time, M.is_start,
                            M.datetime_start, M.add_lng, M.add_lat, M.des_lat, M.des_lng, M.progress AS movement_progress,
                            M.passenger_name, M.passenger_number, M.is_end ,
                            A.outbound_hours, A.driver_name, A.driver_num, A.driver_notes, A.driver_pay, A.driver_confirm ,
                            C.car_name,
                            J.j_order, J.j_id,
                            B.bag_des,
                            Q.site_id, Q.comment, Q.progress AS quote_progess, Q.pay_ok, Q.default_num_id,
                            V.vehicle_id, V.vehicle_reg, V.vehicle_make, V.vehicle_colour,
                            BA.*,
                            MO.*
                    FROM tb_quote_movement M
                    LEFT JOIN tb_assigned_drivers A ON(M.movement_id=A.movement_id)
                    INNER JOIN tb_movement_options MO ON MO.movement_id = M.movement_id
                    LEFT JOIN tb_vehicles V ON (A.vehicle_id = V.vehicle_id)
                    LEFT JOIN tb_base_pricing BA ON (V.base_id = BA.base_id)
                    LEFT JOIN tb_quote Q ON(M.quote_id=Q.quote_id) 
                    LEFT JOIN tb_car C ON(Q.default_car_id=C.car_id) 
                    LEFT JOIN tb_bag B ON(B.bag_id=Q.default_bag_id)
                    LEFT JOIN tb_journey J ON(J.j_id=M.j_id)
                    WHERE M.quote_id = ? AND A.driver_id = ?
                    ORDER BY J.j_order, M.movement_order ASC`

        pool.getConnection((err, conn) => {
            console.log("pool getAllMovement connection error:", err)
            conn.query(sql, [qid, driver_id], (err, rows, fields) => {
                conn.destroy()
                if (err) throw err
                resolve(rows)

            })
        })
    })
}

export const getAllOtherMovement = (qid, driver_id, pool) => {
    return new Promise((resolve, reject) => {

        let sql = `SELECT M.quote_id, M.movement_id, M.duration, M.mileage, M.collection_address, M.collection_notes, M.destination_notes,
                            M.movement_order, M.destination_address, M.flight, M.flight_time, M.flight_arrival, M.flight_arrival_time, M.is_start,
                            M.datetime_start, M.add_lng, M.add_lat, M.des_lat, M.des_lng, M.progress AS movement_progress,
                            M.passenger_name, M.passenger_number, 
                            C.car_name,
                            J.j_order, J.j_id,
                            B.bag_des,
                            Q.site_id, Q.comment, Q.progress AS quote_progess, Q.pay_ok, Q.default_num_id, MO.*
                    FROM tb_quote_movement M
                    INNER JOIN tb_movement_options MO ON MO.movement_id = M.movement_id
                    LEFT JOIN tb_quote Q ON(M.quote_id=Q.quote_id) 
                    LEFT JOIN tb_car C ON(Q.default_car_id=C.car_id) 
                    LEFT JOIN tb_bag B ON(B.bag_id=Q.default_bag_id)
                    LEFT JOIN tb_journey J ON(J.j_id=M.j_id)
                    WHERE Q.quote_id = ? AND  M.movement_id NOT IN (SELECT movement_id FROM tb_assigned_drivers WHERE quote_id = ? AND driver_id = ?)
                    ORDER BY J.j_order, M.movement_order ASC`

        pool.getConnection((err, conn) => {
            console.log("pool getAllOtherMovement connection error:", err)
            conn.query(sql, [qid, qid, driver_id], (err, rows, fields) => {
                conn.destroy()
                if (err) throw err
                resolve(rows)

            })
        })
    })
}