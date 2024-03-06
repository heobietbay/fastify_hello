const config = require('../config')

module.exports = {
    registerDb: async function (fastify) {
        fastify.register(require('@fastify/postgres'), {
            connectionString: config.supabase.dbConnectStr
        })
    }
}