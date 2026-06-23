const https = require('https');
const http = require('http');
const db = require('../db');
require('dotenv').config();

// Caché en memoria para las cookies de sesión por journal.
// Formato: { "https://domain.com/index.php/journal": "OJSSID=..." }
const sessionCache = {};

/**
 * Fusiona cabeceras de cookies existentes con nuevas cookies devueltas en set-cookie
 */
const mergeCookies = (oldCookieHeader, newSetCookies) => {
  const cookieMap = {};
  if (oldCookieHeader) {
    oldCookieHeader.split(';').forEach(c => {
      const parts = c.split('=');
      if (parts.length >= 2) {
        cookieMap[parts[0].trim()] = parts.slice(1).join('=').trim();
      }
    });
  }
  if (newSetCookies) {
    newSetCookies.forEach(c => {
      const firstPart = c.split(';')[0];
      const parts = firstPart.split('=');
      if (parts.length >= 2) {
        cookieMap[parts[0].trim()] = parts.slice(1).join('=').trim();
      }
    });
  }
  return Object.entries(cookieMap).map(([k, v]) => `${k}=${v}`).join('; ');
};

/**
 * Realiza una petición HTTPS/HTTP envuelta en una Promesa, con soporte opcional para seguir redirecciones
 */
const makeRequest = (url, options, postData = null, redirectCount = 0) => {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      return reject(new Error('Demasiados redireccionamientos (max 5)'));
    }

    const isHttps = url.startsWith('https:');
    const requestModule = isHttps ? https : http;

    const req = requestModule.request(url, options, (res) => {
      // Manejar redirecciones si followRedirects está habilitado en las opciones
      if (options.followRedirects && [301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http:') && !redirectUrl.startsWith('https:')) {
          const parsedUrl = new URL(url);
          redirectUrl = parsedUrl.origin + redirectUrl;
        }

        // Acumular cookies obtenidas durante la redirección
        const newCookies = res.headers['set-cookie'];
        const mergedCookie = mergeCookies(options.headers?.['Cookie'], newCookies);

        const newOptions = {
          ...options,
          method: 'GET', // Cambiar método a GET tras redirect
          headers: {
            ...options.headers,
            'Cookie': mergedCookie
          }
        };
        // Eliminar headers de cuerpo para el redirect
        delete newOptions.headers['Content-Type'];
        delete newOptions.headers['Content-Length'];

        res.on('data', () => {});
        res.on('end', () => {
          makeRequest(redirectUrl, newOptions, null, redirectCount + 1)
            .then(resolve)
            .catch(reject);
        });
        return;
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const accumulatedCookie = options.headers?.['Cookie'] || '';
        const finalCookie = mergeCookies(accumulatedCookie, res.headers['set-cookie']);
        resolve({
          status: res.statusCode,
          headers: {
            ...res.headers,
            'x-accumulated-cookie': finalCookie,
            'x-final-url': url
          },
          data
        });
      });
    });

    req.on('error', reject);
    
    if (postData && options.method !== 'GET') {
      req.write(postData);
    }
    req.end();
  });
};

/**
 * Extrae el token CSRF del HTML de la página de login de OJS.
 * Intenta buscar en <meta name="csrf-token"> y luego en <input type="hidden" name="csrfToken">.
 * @param {string} html - HTML de la respuesta
 * @returns {string} El token CSRF extraído
 * @throws {Error} Si no encuentra ningún token
 */
const extractCsrfToken = (html) => {
  if (!html) throw new Error('El HTML proporcionado está vacío.');

  // Intento 1: <meta name="csrf-token" content="...">
  const metaMatch = html.match(/<meta[^>]*name="csrf-token"[^>]*content="([^"]+)"/i);
  if (metaMatch && metaMatch[1]) {
    return metaMatch[1];
  }

  // Intento 2: <input type="hidden" name="csrfToken" value="...">
  const inputMatch = html.match(/<input[^>]*name="csrfToken"[^>]*value="([^"]+)"/i);
  if (inputMatch && inputMatch[1]) {
    return inputMatch[1];
  }

  throw new Error('No se pudo encontrar el token CSRF en la página de login de OJS.');
};

/**
 * Valida si el login en OJS fue realmente exitoso basándose en la respuesta HTTP.
 * @param {number} statusCode - Código de estado HTTP de la respuesta al POST /signIn
 * @param {string} html - Cuerpo (HTML) de la respuesta
 * @throws {Error} Si se detecta que el login falló (sesión invitada, credenciales inválidas, etc)
 */
const validateLoginSuccess = (statusCode, html) => {
  // OJS generalmente responde con 302 Redirect tras un login exitoso
  if (statusCode === 302 || statusCode === 303) {
    return true;
  }

  // Si responde 200, generalmente significa que la autenticación falló y recargó la vista de login
  if (statusCode === 200) {
    if (html && html.includes('formError')) {
      throw new Error('[OJS-AUTH] Credenciales inválidas. Verifica OJS_SERVICE_USER y OJS_SERVICE_PASSWORD.');
    }
    
    // Si la página incluye un formulario con csrfToken otra vez, es evidencia de sesión fallida/invitada
    if (html && html.includes('name="csrfToken"')) {
      throw new Error('[OJS-AUTH] Login falló: posible sesión invitada. OJS recargó la página de login en lugar de redireccionar.');
    }
  }

  if (statusCode >= 400) {
    throw new Error(`[OJS-AUTH] Login falló con código HTTP ${statusCode}.`);
  }

  return true;
};

/**
 * Obtiene la cookie de sesión vigente para un journal específico.
 * Si no existe o se invalidó, hace login usando las credenciales del servicio.
 * @param {string} journalBaseUrl - URL base del journal (ej. https://.../index.php/journalPath)
 * @returns {Promise<string>} - La cookie de sesión (ej. "OJSSID=...")
 */
const getOjsSessionCookie = async (journalBaseUrl) => {
  // Retornar de caché si existe
  if (sessionCache[journalBaseUrl]) {
    return sessionCache[journalBaseUrl];
  }

  // Extraer las credenciales dinámicamente de la base de datos para este portal específico
  let username = null;
  let password = null;

  try {
    const { rows } = await db.query(`
      SELECT ojs_service_user, ojs_service_password 
      FROM portales_ojs 
      WHERE $1 LIKE ojs_url || '%' 
      LIMIT 1;
    `, [journalBaseUrl]);

    if (rows.length > 0) {
      username = rows[0].ojs_service_user;
      password = rows[0].ojs_service_password;
    }
  } catch (err) {
    throw new Error(`[OJS-AUTH] Error consultando credenciales en base de datos: ${err.message}`);
  }

  if (!username || !password) {
    throw new Error(`Credenciales de servicio (usuario o contraseña) no configuradas en la BD para el portal que contiene: ${journalBaseUrl}. Por favor, configúrelas en el panel de administración de Nova.`);
  }

  console.log(`[OJS-AUTH] Iniciando nuevo login de servicio para: ${journalBaseUrl} (Usuario BD: ${username})`);

  let sessionCookie = '';
  let csrfToken = '';
  let finalLoginUrl = '';

  // PASO 1: Petición GET a la página de login para obtener CSRF y cookie inicial
  try {
    const loginUrl = `${journalBaseUrl}/login`;
    const loginRes = await makeRequest(loginUrl, { method: 'GET', followRedirects: true });

    // Extraer cookies acumuladas (incluye las de redirecciones y la respuesta final)
    sessionCookie = loginRes.headers['x-accumulated-cookie'] || '';
    finalLoginUrl = loginRes.headers['x-final-url'] || loginUrl;

    // Usar la función modularizada para extraer el token CSRF
    csrfToken = extractCsrfToken(loginRes.data);

  } catch (err) {
    throw new Error(`[OJS-AUTH] Error al obtener página de login: ${err.message}`);
  }

  // PASO 2: POST a /login/signIn para autenticar
  try {
    let signInUrl;
    const lastLoginIndex = finalLoginUrl.lastIndexOf('/login');
    if (lastLoginIndex !== -1) {
      signInUrl = finalLoginUrl.substring(0, lastLoginIndex) + '/login/signIn' + finalLoginUrl.substring(lastLoginIndex + 6);
    } else {
      signInUrl = `${journalBaseUrl}/login/signIn`;
    }
    const postData = new URLSearchParams({
      csrfToken: csrfToken,
      source: '',
      username: username,
      password: password
    }).toString();

    const signInOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'Cookie': sessionCookie
      }
    };

    const signInRes = await makeRequest(signInUrl, signInOptions, postData);

    // Actualizar cookie si fue rotada durante el login (muy común en OJS)
    const newCookies = signInRes.headers['x-accumulated-cookie'];
    if (newCookies) {
      sessionCookie = newCookies;
    } else {
      const setCookie = signInRes.headers['set-cookie'];
      if (setCookie) {
        sessionCookie = setCookie.map(c => c.split(';')[0]).join('; ');
      }
    }

    // Validación real de que el login funcionó y no estamos en una sesión invitada
    validateLoginSuccess(signInRes.status, signInRes.data);

    console.log(`[OJS-AUTH] Login exitoso. Sesión en caché para: ${journalBaseUrl}`);
    
    // Guardar en caché
    sessionCache[journalBaseUrl] = sessionCookie;
    return sessionCookie;

  } catch (err) {
    throw new Error(`[OJS-AUTH] Error en petición de autenticación: ${err.message}`);
  }
};

/**
 * Invalida la sesión en caché para un journal. Útil para el auto-heal cuando la sesión expira.
 * @param {string} journalBaseUrl 
 */
const invalidateOjsSessionCookie = (journalBaseUrl) => {
  console.log(`[OJS-AUTH] Invalidando caché de sesión para: ${journalBaseUrl}`);
  delete sessionCache[journalBaseUrl];
};

module.exports = {
  getOjsSessionCookie,
  invalidateOjsSessionCookie,
  // Exportados para tests
  extractCsrfToken,
  validateLoginSuccess
};
