const mysql = require("mysql2");

const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "root",
  password: "123456",
  database: "salon_reservation",
});

module.exports = pool.promise();
