module.exports = {
    PORT: process.env.PORT || 3000,
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/egghunt',
    ADMIN_TOKEN: process.env.ADMIN_TOKEN || 'FAKE TOKEN'
}
