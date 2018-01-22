'use strict'
import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import middleware from './middleware'
import secretRoute from './secretroute'
import jwt from 'jsonwebtoken'
import Config from './config'

const jsonfile = require('jsonfile')
const app = express()
const server = require('http').createServer(app)
var port = process.env.PORT || 8080;



app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (req, res) => res.send("Welcome to ecm webservice.."))


app.use('/api', middleware)
app.use('/secret', secretRoute)


server.listen(port, () => {
    const mode = process.env.NODE_ENV || 'prod';
    console.log("open in mode " + mode)
    console.log("Open in port " + port)
    let file = 'apikey.json'
    let jsonObject = {}
    Object.keys(Config).forEach((key) => {
        let token = ''
        if (Config[key].hasOwnProperty('dev') && Config[key].hasOwnProperty('prod')) {
            jsonObject[key.toLowerCase()] = {
                token: {
                    dev: jwt.sign(Config[key]['dev'].secretKey, Config[key]['dev'].appKey),
                    prod: jwt.sign(Config[key]['prod'].secretKey, Config[key]['prod'].appKey)
                }
            }
        }
    })
})