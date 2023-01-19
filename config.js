const { Pool } = require('pg');

const db = new Pool({
    user: "hos",
    host: "192.168.0.12",
    password:  "sswhosxp2020",
    database: "hosxp_ssw",
    port:  '6432',
});


module.exports = db;