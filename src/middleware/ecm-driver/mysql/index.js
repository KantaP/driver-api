import mysql from 'mysql'
import * as Util from '../Util'

module.exports = {
    initConfig: (app_code)=>{
        return new Promise(async(resolve, reject)=>{
            var company_config = await Util.readConfigFile('./config_env/' + app_code + '.json')
            
            const pool = mysql.createPool({
                                connectionLimit : 100,
                                host: company_config.db_host,
                                user: company_config.db_user,
                                password: company_config.db_pass,
                                database: company_config.db_name
                            })
            resolve(pool)
        })
    }
}
 