import config from '../../../config'
import request from 'request'
import mysql from 'mysql'
const path = require('path')
const fs = require('fs-extra')

export const isFileExits = (path) => {
    return new Promise((resolve, reject) => {
        fs.stat(path, (err, stats) => {
            console.log("isFileExits -----?")
                //console.log(err, stats)
            if (err) {
                resolve(false)
            } else {
                resolve(true)
            }
        })
    })
}

export const createFile = (path, data) => {
    return new Promise((resolve, reject) => {
        fs.writeJson(path, data, (err) => {
            if (err) return console.error(err)
            resolve(true)
            console.log("createFile -----")
            console.log('success!')
        })
    })
}

export const readConfigFile = (path) => {
    return new Promise((resolve, reject) => {
        fs.readJSON(path, (err, data) => {
            console.log("readConfigFile ----- ")
            if (err) {
                reject(err)
            } else {
                resolve(data)
            }
        })
    })
}

export const getCompanyData = (app_code) => {
    return new Promise((resolve, reject) => {
        let api_url = "http://demo.ecoachmanager.com/"
            // let api_url = "http://journey.local.ppcnseo.com/"
        let query_string = "lib/api/?company=1"
        let companyCode = app_code

        request.post({
            url: api_url + query_string,
            form: {
                code: companyCode
            }
        }, (err, httpResponse, body) => {
            if (err) throw err
            let data = JSON.parse(body)
            data.company_code = companyCode
                // console.log(data)
            resolve(data)
        })
    })
}


export const getConfigEnv = (siteName, key) => {
    return new Promise((resolve, reject) => {
        console.log(key)
        request.post({
            url: siteName + "lib/api/?env=1",
            headers: {
                'x-access-key': key
            }
        }, (err, httpResponse, body) => {
            console.log(body);
            if (err) throw err
            let data = JSON.parse(body)
                // console.log('test', data)
            let config_env = JSON.parse(Base64.decode(data.package))
            resolve(config_env)
        })
    })
}

export const initConnection = async(comp_code) => {
    return new Promise(async(resolve, reject) => {
        var pathFile = path.resolve('config_env/' + comp_code + '.json');
        var company_config = await readConfigFile(pathFile)

        const pool = mysql.createPool({
            connectionLimit: 100,
            host: company_config.db_host,
            user: company_config.db_user,
            password: company_config.db_pass,
            database: company_config.db_name,
            multipleStatements: true
        })
        resolve(pool)
    })
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

export const Base64 = {
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encode: function(e) {
        var t = "";
        var n, r, i, s, o, u, a;
        var f = 0;
        e = Base64._utf8_encode(e);
        while (f < e.length) {
            n = e.charCodeAt(f++);
            r = e.charCodeAt(f++);
            i = e.charCodeAt(f++);
            s = n >> 2;
            o = (n & 3) << 4 | r >> 4;
            u = (r & 15) << 2 | i >> 6;
            a = i & 63;
            if (isNaN(r)) { u = a = 64 } else if (isNaN(i)) { a = 64 }
            t = t + this._keyStr.charAt(s) + this._keyStr.charAt(o) + this._keyStr.charAt(u) + this._keyStr.charAt(a)
        }
        return t
    },
    decode: function(e) {
        var t = "";
        var n, r, i;
        var s, o, u, a;
        var f = 0;
        e = e.replace(/[^A-Za-z0-9+/=]/g, "");
        while (f < e.length) {
            s = this._keyStr.indexOf(e.charAt(f++));
            o = this._keyStr.indexOf(e.charAt(f++));
            u = this._keyStr.indexOf(e.charAt(f++));
            a = this._keyStr.indexOf(e.charAt(f++));
            n = s << 2 | o >> 4;
            r = (o & 15) << 4 | u >> 2;
            i = (u & 3) << 6 | a;
            t = t + String.fromCharCode(n);
            if (u != 64) { t = t + String.fromCharCode(r) }
            if (a != 64) { t = t + String.fromCharCode(i) }
        }
        t = Base64._utf8_decode(t);
        return t
    },
    _utf8_encode: function(e) {
        e = e.replace(/rn/g, "n");
        var t = "";
        for (var n = 0; n < e.length; n++) {
            var r = e.charCodeAt(n);
            if (r < 128) { t += String.fromCharCode(r) } else if (r > 127 && r < 2048) {
                t += String.fromCharCode(r >> 6 | 192);
                t += String.fromCharCode(r & 63 | 128)
            } else {
                t += String.fromCharCode(r >> 12 | 224);
                t += String.fromCharCode(r >> 6 & 63 | 128);
                t += String.fromCharCode(r & 63 | 128)
            }
        }
        return t
    },
    _utf8_decode: function(e) {
        var t = "";
        var n = 0;
        var c2, c1;
        var r = c1 = c2 = 0;
        while (n < e.length) {
            r = e.charCodeAt(n);
            if (r < 128) {
                t += String.fromCharCode(r);
                n++
            } else if (r > 191 && r < 224) {
                c2 = e.charCodeAt(n + 1);
                t += String.fromCharCode((r & 31) << 6 | c2 & 63);
                n += 2
            } else {
                c2 = e.charCodeAt(n + 1);
                c3 = e.charCodeAt(n + 2);
                t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
                n += 3
            }
        }
        return t
    }
};