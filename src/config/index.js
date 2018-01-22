module.exports = {
    "omc": {
        "prod": {
            "secret": "ecm",
            "appKey": "OmcGlobalProd",
            "secretKey": "Rx78",
            "host": 'voovamariadblive.c2twiultssq7.eu-west-1.rds.amazonaws.com',
            "database": "omctaxis",
            "user": "bW3QKKbuyvRedyf7",
            "password": "nBW7Z2xD5UDww9yM",
            "siteId": 348,
            "sms_api": '3282401',
            "sms_user": 'oxford',
            "sms_pass": 'oxfordsms1'
        },
        "dev": {
            "secret": "ecm",
            "appKey": "OmcGlobalDev",
            "secretKey": "Rx78",
            "host": '192.168.1.10',
            "database": "ecm_journey",
            "user": "localdev",
            "password": "localdev",
            "siteId": 232,
            "sms_api": '3266470',
            "sms_user": 'ecmauuk',
            "sms_pass": 'demo01'
        }
    },
    "pheonix":{
        "secret": "ecm",
        "pheonixKey": "PheonixDareDevil",
        "secretKey": "Civilwar",
        /*"pheonixhost": 'coachhirelive2.cqp3pb8a3b9k.eu-west-2.rds.amazonaws.com',
        "pheonixdatabase": "londonmc",
        "pheonixuser": "londonmc",
        "pheonixpassword": "LmC993t3",*/
        /*"pheonixhost": 'uat-coachhirelive2.cqp3pb8a3b9k.eu-west-2.rds.amazonaws.com',
        "pheonixdatabase": "londonmc",
        "pheonixuser": "root",
        "pheonixpassword": "Pd#d$Q$qwCp)X",*/
        "pheonixhost": 'localhost',
        "pheonixdatabase": "manchester",
        "pheonixuser": "programmer",
        "pheonixpassword": "Pa$$wordIT01",
        /*"pheonixhost_au": 'sydney-mariadb.cggnymkq1gyg.ap-southeast-2.rds.amazonaws.com',
        "pheonixdatabase_au": "tracking_demo",
        "pheonixuser_au": "tracking_demo",
        "pheonixpassword_au": "GoogleD!@d001d",*/
        "pheonixhost_au": 'uat-coachhirelive2.cqp3pb8a3b9k.eu-west-2.rds.amazonaws.com',
        "pheonixdatabase_au": "londonmc",
        "pheonixuser_au": "londonmc",
        "pheonixpassword_au": "LmC993t3",
        "sms_api": '3266470',
        "sms_user": 'ecmauuk',
        "sms_pass": 'demo01',
        "google_api_key":{
            "fcm_key":"key=AAAAXrQxyXU:APA91bGt2jgdHo9pKwbhVBKA_-gIawP_2FTohcR-kdyRpQvJf0OPHb2agOGL3KUfVIL0-dpz15Wdl5eZNrgHxp8qCERErnR4uETWn0NCyhdJonlPzwfWRv9xITubvtoliTuzP8EneFaOSllw1ToNFJnQe72RMpXhHQ"
        },
        "system_prefix":""
    },
    "globaldriver":{
        "secret": "ecm",
        "globalKey": "TheManWhoSoldTheWorld",
        "secretKey": "ZebraWannaDriveAJEEP"
    },
    "ecmdriver":{
        "secret": "ecm",
        "ecmKey": "1amZ00K33p3r",
        "secretKey": "Th3L10nK155aD33R"
    },
    "programmer":{
        "user": 'programmer',
        "password": 'Pa$$wordIT01',
        "database": 'ecm_share',
    },
    "adminuser": "chaino",
    "adminpassword": "0hp0mn3aur3",
    "email": {
        "host": "smtp.mandrillapp.com",
        "username": "admin@voovagroup.com",
        "password": "cCXNTUa3ROfI8xMBbwz4ew",
        "port": 587,
        "secure": "tls"
    }
}