
import Router from 'express'
import Config from '../../../config'
import jwt from 'jsonwebtoken'
import moment from 'moment'
import * as Util from '../Util'
import * as action from './action'


const tokenKey = (req, res, next) => {
    let key =  req.headers['x-access-token']
    if(key){
        jwt.verify(key, Config.ecmdriver.ecmKey, function (err, decoded) {
            if (err) {
                return res.json({ code:0, text: 'Failed to authenticate token.', result:[] })
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded
                next()
            }   
        });  
    }else{
        res.send({code:1, text:'Not found key', result:[]})
    }
}
const checkNTrack = Router()
checkNTrack.use(tokenKey)

checkNTrack.route('/')
    .get(async(req, res)=>{
        var driver_id       = req.decoded.id
        var company_code    = req.decoded.company_code

        var compData = await Util.getCompanyData(company_code)

        var result = await action.getChecknTrack(compData.website, compData.id)
        res.send({code:2, text:'success', result:result})

    })

module.exports = checkNTrack