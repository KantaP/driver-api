import Router from 'express'

const path = requre('path')
const tokenKey = (req, res, next) => {
    let key = req.headers['x-access-token']
    if (key) {
        jwt.verify(key, Config.ecmdriver.ecmKey, function(err, decoded) {
            if (err) {
                return res.json({ code: 0, text: 'Failed to authenticate token.', result: [] })
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded
                next()
            }
        });
    } else {
        res.send({ code: 1, text: 'Not found key', result: [] })
    }
}


const log = Router()
log.use(tokenKey)

log.post('/errorFromMobile', async(req, res) => {
    var company_code = req.decoded.company_code
    var pathFile = path.resolve('logs/' + company_code + '_' + Date.now() + '.txt');


})

module.exports = log