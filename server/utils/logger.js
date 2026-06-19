const log = (level, message, meta = {}) => {
  const logObj = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta
  };
  if (level === 'error') {
    console.error(JSON.stringify(logObj));
  } else {
    console.log(JSON.stringify(logObj));
  }
};

module.exports = {
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta)
};
