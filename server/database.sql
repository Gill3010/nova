-- Script para crear la estructura de la base de datos PostgreSQL

-- 1. Crear la base de datos (puedes ejecutar esto o usar una existente)
-- CREATE DATABASE nova_db;

-- 2. Crear la tabla de congresos
CREATE TABLE IF NOT EXISTS congresos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_celebracion DATE,
    sede VARCHAR(255),
    modalidad VARCHAR(50),
    nivel_academico VARCHAR(50),
    linea_investigacion VARCHAR(255),
    aula_canal VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Crear la tabla de envíos OJS relacionados al congreso
CREATE TABLE IF NOT EXISTS envios_ojs (
    id SERIAL PRIMARY KEY,
    congreso_id INTEGER REFERENCES congresos(id) ON DELETE CASCADE,
    ojs_submission_id INTEGER NOT NULL,
    ojs_publication_id INTEGER,
    categoria VARCHAR(50),
    autor_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
