# NOVA - Contexto General del Proyecto (AI Memory)

Este documento contiene la memoria principal del proyecto **Nova**. Cualquier Agente de IA que trabaje en este proyecto debe leer este archivo primero para entender la arquitectura, el flujo de desarrollo, las reglas establecidas y cómo conectarse con OJS.

## 1. ¿Qué es Nova?
Nova es una plataforma de gestión de congresos universitarios. Está conectada mediante su API a **OJS 3.4 (Open Journal Systems)** (`dev.relaticpanama.org`). Su objetivo principal es ofrecer un flujo de registro para asistentes, autores (ponentes) y revisores, así como una gestión central para administradores y organizadores, sincronizando de forma transparente los congresos y ponencias (como "revistas" y "envíos" en OJS).

## 2. Stack Tecnológico & Arquitectura
- **Frontend (Cliente):** React 18, Vite, TypeScript, TailwindCSS, Lucide React. (Ubicado en `src/`).
- **Backend (Servidor/API):** Node.js, Express.js. (Ubicado en `server/`).
- **Base de Datos (Producción):** PostgreSQL (Usuario: `nova_user`, DB: `nova_db`).
- **Base de Datos (Local):** La API localmente está configurada para conectarse al PostgreSQL local, pero también cuenta con lógica adaptada mediante abstracciones, por lo que es vital no romper las consultas de base de datos (`pg`).
- **Proxy/Ingress (Producción):** Nginx actúa como reverse proxy en `eventonexus.com` interceptando tráfico en el puerto 80/443. La encriptación real hacia el usuario es manejada por **Cloudflare (SSL Flexible)**. Nginx rutea `/api` a Node.js (PM2 puerto 3001) y `/ojs-api/` a `dev.relaticpanama.org/_journals`.
- **Despliegue:** AWS EC2 (Ubuntu).

## 3. Flujo de Trabajo (Local vs. Producción)

El código fuente es idéntico, pero el comportamiento varía según el `.env`.

### 💻 Desarrollo Local (En la Mac del Usuario)
1. **Frontend:** Ejecuta `npm run dev` en una terminal. Corre en `localhost:5173` o `5174`.
2. **Backend:** En otra terminal, entra a `server/` y ejecuta `node index.js`. Corre en el puerto `3001`.
3. **Peticiones a OJS:** El frontend local hace peticiones a `/api` y a `/ojs-api`. Vite Proxy (`vite.config.ts`) se encarga de interceptar y reenviar peticiones a OJS durante el desarrollo.

### 🌐 Producción (AWS EC2 + Cloudflare)
1. **Dominio:** `https://eventonexus.com`
2. **Git:** Para subir cambios, el usuario hace `git commit` y `git push` desde su Mac. Luego, en la terminal de AWS (vía SSM Session Manager), el usuario corre `git pull`.
3. **Frontend:** Una vez hecho el `git pull`, se **DEBE** ejecutar `npm run build` en AWS para generar la carpeta `/dist`. Nginx sirve estos archivos estáticos.
4. **Backend:** El servidor Node.js es mantenido vivo por **PM2** (`pm2 status nova-backend`). Si hay cambios en los archivos de `/server`, se debe correr `pm2 restart nova-backend`. Si cambian variables de entorno, se usa `pm2 restart nova-backend --update-env`.

## 4. Reglas de Modularidad y Mejores Prácticas

> [!IMPORTANT]
> **Todo Agente de IA debe acatar estas reglas sin excepción:**

1. **Respeta los Archivos Excluidos (Git):** Nunca modifiques el historial para añadir `.env`, `.env.local`, `node_modules/`, `/dist/` o archivos `.sqlite`/`.db`. El archivo `.gitignore` ya está configurado para seguridad.
2. **Archivos `.env` Independientes:** El `.env` de Mac es solo local. El `.env` de AWS tiene las credenciales reales de la base de datos PostgreSQL de producción. Nunca sobreescribas el `.env` de AWS asumiendo valores locales.
3. **No uses Localhost en URLs del Frontend:** Todas las llamadas API desde el Frontend de React deben hacerse usando rutas relativas (ej. `/api/auth/login` o `/ojs-api/v1/...`). Nunca dejes "hardcodeado" `http://localhost:3001`.
4. **CORS y Proxies:** Si agregas integraciones externas nuevas, considera que el Frontend podría requerir Proxies (tanto en `vite.config.ts` localmente, como en `nginx.conf` en AWS) para evitar errores de CORS. Especialmente con OJS, Nginx usa un camuflaje estricto de rutas quitando `Origin` y `Referer` para evitar un Error 500 en Apache. No toques el bloque de Nginx de OJS a menos que sea estrictamente necesario.
5. **Alineación con Skills Locales:** Si creas componentes React, usa TailwindCSS y fomenta la reutilización de `Button`, `Input`, `Card` y `Select` del directorio `/src/components/common`.
6. **Mantenibilidad:** Evita crear "funciones espagueti" gigantes. Si un componente React supera las 200 líneas por lógica de negocio, extrae dicha lógica en un Custom Hook dentro de `/src/hooks/`.

## 5. Próximos Pasos (Estado Actual)
- ✅ El despliegue inicial está completo.
- ✅ El dominio `eventonexus.com` está configurado y detrás de Cloudflare (SSL Flexible).
- ✅ El CORS del backend y el Proxy hacia OJS en Nginx funcionan correctamente sin dar error 500 en producción.
- ✅ El repositorio ha sido saneado (archivo `.env` removido del tracking de Git para seguridad).
- ⏳ **Próximo:** Seguir implementando las reglas de negocio, roles, envío de trabajos al congreso, notificaciones, etc.

---
**Nota al próximo agente:** Al leer esto, ya estás en contexto. No necesitas preguntar por la arquitectura ni cómo probar el proyecto en producción. ¡Manos a la obra!
