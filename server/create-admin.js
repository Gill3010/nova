const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

async function createAdmin() {
  console.log('=== Creación de Super Administrador Inicial ===');
  try {
    const nombre = await question('Nombre del administrador: ');
    const email = await question('Correo electrónico: ');
    const password = await question('Contraseña (mínimo 6 caracteres): ');

    if (!nombre || !email || password.length < 6) {
      console.error('❌ Error: Datos inválidos. Asegúrate de ingresar todos los campos y una contraseña de al menos 6 caracteres.');
      process.exit(1);
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const normalizedEmail = email.trim().toLowerCase();

    // Importamos la BD justo antes de usarla para que sus logs no ensucien el prompt
    const db = require('./db/index');

    // Nota: PostgreSQL usa $1, $2 en lugar de ?
    const query = `INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, 'admin') RETURNING id`;
    
    try {
      const { rows } = await db.query(query, [nombre.trim(), normalizedEmail, passwordHash]);
      console.log(`✅ Administrador '${nombre}' creado con éxito con el ID: ${rows[0].id}`);
      process.exit(0);
    } catch (err) {
      if (err.code === '23505' || err.message.includes('unique') || err.message.includes('UNIQUE')) {
        console.error('❌ Error: El correo electrónico ya está registrado.');
      } else {
        console.error('❌ Error al crear admin:', err.message);
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    process.exit(1);
  }
}

createAdmin();
