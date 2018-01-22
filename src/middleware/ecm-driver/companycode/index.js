import Router from 'express'
import jwt from 'jsonwebtoken'
import moment from 'moment'
import Config from '../../../config'
import request from 'request'
import * as Util from '../Util'

const crypto = require('crypto')
const path = require('path')
const companyCode = Router()

companyCode
    .post('/', async(req, res) => {
        var comp_code = req.body.code
        var pathFile = path.resolve('config_env/' + comp_code + '.json');
        console.log('find code :' + pathFile)
        try {

            var isLocalHasENV = await Util.isFileExits(pathFile)
            console.log(isLocalHasENV)
            if (!isLocalHasENV) {

                var companyData = await Util.getCompanyData(comp_code)
                console.log(companyData)
                var accessKey = crypto.createHash('md5').update(Config.ecmdriver.secretKey).digest("hex")

                var configData = await Util.getConfigEnv(companyData.website, accessKey)

                var combine = {
                    id: companyData.id,
                    name: companyData.name,
                    website: companyData.website,
                    code: companyData.company_code,
                    share_server: companyData.share_server,
                    db_user: configData.db_user,
                    db_pass: configData.db_pass,
                    db_host: configData.db_host,
                    db_name: configData.db_name
                }

                console.log(pathFile, combine)
                console.log('---- create env file ----')
                    /* CREATE CONFIG ENV FILE */
                await Util.createFile(pathFile, combine)
            }

            var configENV = await Util.readConfigFile(pathFile)

            var site = ""

            if (configENV.share_server == "ecm") {
                site = "sv.ecoachmanager.com"
            } else if (configENV.share_server == "myau") {
                site = "svau.ecoachmanager.com"
            }

            res.status(200).send({
                code: 2,
                text: 'Success',
                result: site,
                name: configENV.name
            })

        } catch (error) {
            res.status(200).send({ code: 0, text: 'Fail.', result: error })
        }
    })


module.exports = companyCode