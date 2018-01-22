import moment from 'moment'

export const getSummary = (driver_id, date, pool) => {
    return new Promise((resolve, reject) => {

        var getSummary = `SELECT 
                            QM.movement_id, QM.movement_order, QM.datetime_start AS mov_datetime_start, 
                            QM.date_start AS mov_date_start, QM.time_start AS mov_time_start, QM.collection_address AS mov_col_address, 
                            QM.destination_address AS mov_des_address, QM.num_id AS mov_num_id, QM.mileage AS mov_mileage, QM.is_end AS mov_is_end, QM.is_start AS mov_is_start, 			 							
                            QM.is_return AS mov_is_return, QM.vehicle_stay AS mov_vehicle_stay, QM.collection_notes AS mov_col_note, QM.destination_notes AS mov_des_note,
                            D.first_name, D.surname, 
                            C.car_id, C.avg_speed,	C.mile_weight, C.time_weight, C.mile_round, C.time_round, C.force_single,	
                            V.vehicle_reg,
                            J.*
                        FROM tb_quote_movement QM
                        LEFT JOIN tb_assigned_drivers AD ON(QM.movement_id = AD.movement_id)
                        LEFT JOIN tb_vehicles V ON (AD.vehicle_id = V.vehicle_id )
                        LEFT JOIN tb_drivers D ON(D.driver_id=AD.driver_id)
                        LEFT JOIN tb_car C ON(C.car_id=QM.car_id)
                        LEFT JOIN tb_quote AS Q ON Q.quote_id = QM.quote_id
                        LEFT JOIN tb_journey AS J ON J.j_id = QM.j_id
                        WHERE (
                            QM.date_start >= ?
                        AND 
                            QM.date_start <= ?
                        )
                        AND AD.assign_id IS NOT NULL
                        AND D.driver_id = ?
                        AND Q.progress != 10
                        AND (
                                QM.is_start = 1
                            OR
                                QM.is_end = 1
                            )
                        ORDER BY J.date_departure ASC`
        console.log(date)
        pool.getConnection((err, conn) => {
            console.log("pool getSummary connection error:", err)
            conn.query(getSummary, [date.date_start, date.date_end, driver_id], (err, rows, fields) => {
                conn.destroy()

                if (err) {
                    err.method = "getSummary";
                    console.log("getSummary error:", err)
                    throw err
                }

                resolve(rows)

            })
        })
    })
}