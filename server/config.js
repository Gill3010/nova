module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'nova_super_secret_key_2026',
  PORT: process.env.PORT || 3001,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:5173']
};
