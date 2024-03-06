require('dotenv').config()

module.exports = {
    supabase: {
        apiUrl: process.env.SUPABASE_API_URL,
        apiKey: process.env.SUPABASE_KEY,
        dbConnectStr: process.env.SUPABASE_DB
    },
    authenticationRequired: process.env.AUTHENTICATION_REQUIRED === 'true'
}