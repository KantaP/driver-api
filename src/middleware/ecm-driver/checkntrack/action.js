import request from 'request'


export const getChecknTrack = (site, site_id)=>{
    return new Promise((resolve, reject)=>{

        let api_url         = "http://demo.ecoachmanager.com/"
        let query_string    = "lib/api/?driver-journey=1&action=CheckNTrack"

        request(api_url+query_string, function (error, response, body) {
            console.log(body)

           resolve(JSON.parse(body).available)

        })
    })
}