const mysql = require('mysql2');

const pool = mysql.createPool({
    host:'localhost',
    user:'root',
    password:'',
    database:'salon_reservation'
})

module.exports = pool.promise();