import Router from 'express'
import jwt from 'jsonwebtoken'
import Config from '../config'
import path from 'path'
import _ from 'lodash'



const secretRoute = Router();

secretRoute.get('/generateApiKey/:name',(req,res)=>{
    let code;
    let token;
    let message;

    if(_.lowerCase(req.params.name) == 'pheonix'){
        code = 2;
        message = "This token only use in pheonix apps.";
        token = jwt.sign(Config.pheonix.secret, Config.pheonix.pheonixKey);

    }else if(_.lowerCase(req.params.name) == "globaldriver"){
        code = 2;
        message = "This token use in global apps.";
        token = jwt.sign(Config.globaldriver.secret, Config.globaldriver.globalKey);
    }else if(_.lowerCase(req.params.name) == "ecmdriver"){
        code = 2;
        message = "This token use in ecmdriver apps.";
        token = jwt.sign(Config.ecmdriver.secret, Config.ecmdriver.ecmKey);
    }else{
        code = 0;
        message = 'Not found that system';
        token = [];
    }
    res.send({code:code, text:message, result:token});
})

secretRoute.get('/download/DriverApp.apk', (req, res)=>{

    res.sendFile(path.resolve('file/DriverApp.apk'), (err)=>{
        console.log(err)
    }); 
    
})


secretRoute.get('/apks/update', (req, res)=>{

    res.json({
        versionCode: 11,
        updateMessage: "",
        url: "http://sv.ecoachmanager.com:3000/secret/download/DriverApp.apk"
    })
    
})

secretRoute.get('/decodeKey',(req,res)=>{
    let token = req.headers['x-access-key'];
    res.send(jwt.decode(token));
})

secretRoute.get('/decodeToken', (req,res)=>{
    let token = req.headers['x-access-token']
     if (token) {
         jwt.verify(token, Config.pheonix.pheonixKey, (err, decoded) => {
            if (err) {
                return res.json({ code:0, text: 'Failed to authenticate token.', result:[] })
            } else {
                res.send({code:1, text:'key', result:[decoded]})
            } 
         })
     }else{
        res.send({code:1, text:'Not found key', result:[]})
    }
})

module.exports = secretRoute; 