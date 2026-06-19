# 📋 Nova — Sistema de Gestión de Congresos Universitarios

## ¿Qué es este proyecto?
Aplicación web en **React + TypeScript + Vite** que permite gestionar congresos académicos
y sincronizarlos con una instalación real de **OJS 3.4** (Open Journal Systems).

---

## 🚀 Cómo arrancar el proyecto

```bash
cd /Users/israelsamuels/nova
npm run dev
```
Abre el navegador en: **http://localhost:5174/**

---

## 🔗 Conexión con OJS (ya configurada y funcionando)

| Campo | Valor |
|---|---|
| **OJS Portal URL** | `https://dev.relaticpanama.org/_journals/` |
| **API Key** | La guardas tú (no se guarda en el código por seguridad) |
| **Servidor** | `dev.relaticpanama.org` |
| **Selección de Revista** | Dinámica — se listan automáticamente al conectar |

> **IMPORTANTE:** Cada vez que abras la app debes volver a pegar la API Key en el campo
> "API Key (Token de OJS 3.4)" porque no se guarda en el código.
>
> **FLUJO:** Ingresa la URL del portal → Ingresa el API Key → Clic en «Probar Conexión OJS» → Selecciona la revista del desplegable → Opera normalmente.

---

## ⚙️ Arquitectura técnica

```
Nova (React) → Vite Proxy (/ojs-api) → OJS REST API → Base de datos MySQL
```

El proxy está configurado en `vite.config.ts` para evitar errores de CORS.
**NO necesitas la extensión "Allow CORS" del navegador.**

---

## 📁 Archivos clave

| Archivo | Para qué sirve |
|---|---|
| `src/App.tsx` | Toda la lógica de la aplicación |
| `src/App.css` | Todos los estilos |
| `src/types.ts` | Tipos TypeScript del proyecto |
| `vite.config.ts` | Configuración del proxy OJS (clave para la integración) |

---

## 🧑‍💼 Roles del sistema

| Rol | Qué puede hacer |
|---|---|
| **Administrador/Organizador** | Crear congresos y registrarlos en OJS como Submissions |
| **Ponente** | Subir archivos (PDF, audio, póster, video) vinculados a su ponencia |
| **Asistente** | Registrar pago de inscripción |
| **Revisor** | Evaluar ponencias con rúbrica de calificación |

---

## ✅ Lo que ya funciona (integración REAL con OJS)

- [x] Conexión autenticada con OJS via Bearer Token
- [x] Proxy Vite sin CORS (`/ojs-api` → `dev.relaticpanama.org`)
- [x] Lista dinámica de revistas del portal RELATIC (7 revistas detectadas)
- [x] Selector de revista: el usuario elige la revista antes de operar
- [x] Creación de Submissions reales en OJS (probado: Submission ID 194)
- [x] Los datos se guardan en la BD MySQL del servidor

---

## ❌ Limitaciones conocidas de la API REST de OJS 3.4

- `POST /api/v1/issues` **NO existe** — los Issues (números) solo se crean desde el panel web de OJS
- Los Issues se crean manualmente en: `https://dev.relaticpanama.org/_journals/index.php/dialogoseducativos/editor/issues`

---

## 🔍 Verificar datos en la base de datos OJS

```sql
-- Ver el congreso registrado (Submission ID 194)
SELECT s.submission_id, s.date_submitted, ps.setting_value AS titulo
FROM submissions s
JOIN publications p ON p.submission_id = s.submission_id
JOIN publication_settings ps ON ps.publication_id = p.publication_id
    AND ps.setting_name = 'title' AND ps.locale = 'es'
WHERE s.submission_id = 194;
```

Ver en el panel web: `https://dev.relaticpanama.org/_journals/index.php/dialogoseducativos/submissions`

---

## 📌 Para continuar el desarrollo mañana

Simplemente dile al agente:
> *"Continúa el proyecto Nova en `/Users/israelsamuels/nova`. Lee el archivo PROYECTO.md para el contexto completo."*
