/**
 * storage.service.js
 *
 * Interfaz unificada de almacenamiento de archivos.
 * - Si las variables de entorno AWS están configuradas → usa Amazon S3.
 * - Si no → guarda en `server/uploads/` para desarrollo local.
 */

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Directorio local de uploads (relativo al servidor)
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Asegurar que exista el directorio local
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ─── Detectar si S3 está configurado ──────────────────────────────────────────
const isS3Configured = () =>
  !!(process.env.AWS_ACCESS_KEY_ID &&
     process.env.AWS_SECRET_ACCESS_KEY &&
     process.env.AWS_S3_BUCKET);

// ─── Almacenamiento Local ─────────────────────────────────────────────────────
const saveLocally = (buffer, fileName) => {
  const destPath = path.join(UPLOADS_DIR, fileName);
  fs.writeFileSync(destPath, buffer);
  return fileName; // La clave es el nombre del archivo
};

const readLocally = (fileKey) => {
  const filePath = path.join(UPLOADS_DIR, fileKey);
  if (!fs.existsSync(filePath)) {
    const error = new Error('Archivo no encontrado en almacenamiento local');
    error.statusCode = 404;
    throw error;
  }
  return fs.readFileSync(filePath);
};

const deleteLocally = (fileKey) => {
  const filePath = path.join(UPLOADS_DIR, fileKey);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// ─── Almacenamiento S3 ────────────────────────────────────────────────────────
// Se importa de forma lazy para no romper si el SDK no está instalado en local
const getS3Client = () => {
  try {
    const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
    const client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
    return { client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand };
  } catch {
    throw new Error('AWS SDK no está instalado. Ejecuta: npm install @aws-sdk/client-s3');
  }
};

const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });

const saveToS3 = async (buffer, fileKey, mimeType) => {
  const { client, PutObjectCommand } = getS3Client();
  await client.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileKey,
    Body: buffer,
    ContentType: mimeType || 'application/octet-stream',
  }));
  logger.info('Archivo subido a S3', { bucket: process.env.AWS_S3_BUCKET, key: fileKey });
  return fileKey;
};

const readFromS3 = async (fileKey) => {
  const { client, GetObjectCommand } = getS3Client();
  const response = await client.send(new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileKey,
  }));
  return streamToBuffer(response.Body);
};

const deleteFromS3 = async (fileKey) => {
  const { client, DeleteObjectCommand } = getS3Client();
  await client.send(new DeleteObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileKey,
  }));
  logger.info('Archivo eliminado de S3', { key: fileKey });
};

// ─── API Pública ──────────────────────────────────────────────────────────────

/**
 * Guarda un archivo. Retorna el `fileKey` para persistir en la BD.
 * @param {Buffer} buffer - El buffer del archivo
 * @param {string} fileKey - Nombre único del archivo (ej. `envio-42-1718820000000.pdf`)
 * @param {string} mimeType - MIME type del archivo
 */
const saveFile = async (buffer, fileKey, mimeType) => {
  if (isS3Configured()) {
    return saveToS3(buffer, fileKey, mimeType);
  }
  return saveLocally(buffer, fileKey);
};

/**
 * Lee y retorna el buffer de un archivo.
 * @param {string} fileKey - La clave del archivo guardada en BD
 */
const readFile = async (fileKey) => {
  if (isS3Configured()) {
    return readFromS3(fileKey);
  }
  return readLocally(fileKey);
};

/**
 * Elimina un archivo del almacenamiento.
 * @param {string} fileKey - La clave del archivo guardada en BD
 */
const deleteFile = async (fileKey) => {
  if (isS3Configured()) {
    return deleteFromS3(fileKey);
  }
  return deleteLocally(fileKey);
};

module.exports = { saveFile, readFile, deleteFile, isS3Configured };
