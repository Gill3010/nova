-- Script para crear la estructura de la base de datos PostgreSQL en AWS RDS

-- 1. Crear la base de datos (ejecutar por separado si es necesario)
-- CREATE DATABASE nova_db;

-- Conectarse a la base de datos antes de ejecutar lo siguiente:
-- \c nova_db;

-- 2. Crear la tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Crear la tabla de espacios y ubicaciones
CREATE TABLE IF NOT EXISTS espacios (
    id SERIAL PRIMARY KEY,
    creador_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(255),
    descripcion TEXT,
    capacidad INTEGER,
    equipamiento TEXT, -- Se almacena como JSON string
    enlace_virtual TEXT,
    observaciones TEXT,
    estado VARCHAR(50) DEFAULT 'Activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Crear la tabla de congresos
CREATE TABLE IF NOT EXISTS congresos (
    id SERIAL PRIMARY KEY,
    creador_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    nombre VARCHAR(255) NOT NULL,
    lema VARCHAR(500),
    descripcion TEXT,
    fecha_celebracion VARCHAR(100), -- Almacenado como texto flexible para compatibilidad con la lógica actual
    fecha_finalizacion VARCHAR(100),
    sede VARCHAR(255),
    modalidad VARCHAR(100),
    nivel_academico VARCHAR(100),
    linea_investigacion VARCHAR(255),
    aula_canal VARCHAR(255),
    ojs_url TEXT,
    ojs_api_key TEXT,
    ojs_journal_path VARCHAR(255),
    ojs_submission_id INTEGER,
    ojs_publication_id INTEGER,
    espacio_id INTEGER REFERENCES espacios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Crear la tabla de envíos OJS relacionados a los congresos
CREATE TABLE IF NOT EXISTS envios_ojs (
    id SERIAL PRIMARY KEY,
    congreso_id INTEGER REFERENCES congresos(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    ojs_submission_id INTEGER NOT NULL,
    ojs_publication_id INTEGER,
    titulo_articulo TEXT,
    resumen TEXT,
    palabras_claves TEXT,
    colaboradores TEXT, -- Almacena JSON string o texto según sea enviado por el frontend
    revista_destino VARCHAR(255),
    categoria VARCHAR(100),
    autor_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Relación N:M entre Congresos y Múltiples Sedes
CREATE TABLE IF NOT EXISTS congreso_sedes (
    congreso_id INTEGER REFERENCES congresos(id) ON DELETE CASCADE,
    espacio_id INTEGER REFERENCES espacios(id) ON DELETE CASCADE,
    es_sede_principal BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (congreso_id, espacio_id)
);

-- 7. Tabla de Actividades (Agenda del Congreso por Sede)
CREATE TABLE IF NOT EXISTS actividades (
    id SERIAL PRIMARY KEY,
    congreso_id INTEGER REFERENCES congresos(id) ON DELETE CASCADE,
    espacio_id INTEGER REFERENCES espacios(id) ON DELETE SET NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha VARCHAR(100), -- YYYY-MM-DD
    hora_inicio VARCHAR(10), -- HH:mm
    hora_fin VARCHAR(10), -- HH:mm
    enlace_virtual TEXT,
    estado VARCHAR(50) DEFAULT 'Programada',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Portales OJS (credenciales del portal)
CREATE TABLE IF NOT EXISTS portales_ojs (
    id SERIAL PRIMARY KEY,
    ojs_url TEXT NOT NULL,
    ojs_api_key TEXT NOT NULL,
    nombre VARCHAR(255),
    habilitado BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ojs_url)
);

-- 9. Revistas OJS (revistas dentro de un portal)
CREATE TABLE IF NOT EXISTS revistas_ojs (
    id SERIAL PRIMARY KEY,
    portal_ojs_id INTEGER NOT NULL REFERENCES portales_ojs(id) ON DELETE CASCADE,
    ojs_journal_path VARCHAR(255) NOT NULL,
    ojs_journal_id INTEGER,
    nombre VARCHAR(255),
    url TEXT,
    habilitada BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(portal_ojs_id, ojs_journal_path)
);

-- 10. Relación N:M Congreso ↔ Portal OJS
CREATE TABLE IF NOT EXISTS congreso_portal_ojs (
    congreso_id INTEGER NOT NULL REFERENCES congresos(id) ON DELETE CASCADE,
    portal_ojs_id INTEGER NOT NULL REFERENCES portales_ojs(id) ON DELETE CASCADE,
    PRIMARY KEY (congreso_id, portal_ojs_id)
);

-- 11. FK de envios_ojs a revistas_ojs (nullable para retrocompatibilidad)
ALTER TABLE envios_ojs ADD COLUMN IF NOT EXISTS revista_ojs_id INTEGER REFERENCES revistas_ojs(id) ON DELETE SET NULL;
