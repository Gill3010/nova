const bcrypt = require('bcryptjs');
const db = require('../db'); // Ahora es el pool de Postgres
const logger = require('../utils/logger');

class AuthService {
  async findByEmail(email) {
    const normalizedEmail = email.trim().toLowerCase();
    const query = `SELECT * FROM usuarios WHERE email = $1`;
    
    const { rows } = await db.query(query, [normalizedEmail]);
    return rows[0];
  }

  async createUser({ nombre, email, password, rol }) {
    const normalizedEmail = email.trim().toLowerCase();
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const query = `INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING id`;
    
    try {
      const { rows } = await db.query(query, [nombre.trim(), normalizedEmail, passwordHash, rol]);
      return { id: rows[0].id, nombre, email: normalizedEmail, rol };
    } catch (err) {
      if (err.code === '23505' || err.message.includes('unique') || err.message.includes('UNIQUE')) {
        const uniqueError = new Error('El correo electrónico ya está registrado');
        uniqueError.code = 'UNIQUE_CONSTRAINT';
        throw uniqueError;
      }
      throw err;
    }
  }

  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = new AuthService();
