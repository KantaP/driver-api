import Router from 'express'
import ecmdriver from './ecm-driver'

const middleware = Router()

middleware.get('/', (req, res) => res.send({ message: 'Welcome to Middleware' }))
middleware.use('/ecmdriver', ecmdriver)

module.exports = middleware