const mysql = require('mysql');
const connection = mysql.createPool({
  host : 'localhost',
  user : 'root',
  password : '2ehguq',
  database : 'board',
  port : 3306
});

module.exports = {connection: connection};