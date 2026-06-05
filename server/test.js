const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./nova.sqlite');
db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          rol TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
});
db.run("INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ('A', 'a@a.com', 'a', 'a')", function(err) {
  if (err) console.log(err);
  else console.log('OK');
});
