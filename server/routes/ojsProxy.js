const express = require('express');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const { getOjsSessionCookie, invalidateOjsSessionCookie } = require('../services/ojsAuthService');

const router = express.Router();

/**
 * Proxy universal para peticiones a OJS.
 * Resuelve el problema de CORS y de SNI/Domain Fronting de Vite.
 * Soporta GET, POST, PUT, DELETE y subida de archivos (multipart/form-data) vía streams.
 */
router.all('/', async (req, res) => {
  // El frontend pasa la URL final exacta que desea consultar en este header
  const targetUrlStr = req.headers['x-ojs-target-url'];

  if (!targetUrlStr) {
    return res.status(400).json({ error: 'Falta el header x-ojs-target-url' });
  }

  try {
    const targetUrl = new URL(targetUrlStr);
    const isLegacyDownload = targetUrl.pathname.includes('$$$call$$$');
    const journalBaseUrl = targetUrl.origin + targetUrl.pathname.split('/$$$call$$$')[0];

    const executeProxy = async (isRetry = false) => {
      // Preparar opciones nativas para la petición saliente
      const options = {
        hostname: targetUrl.hostname,
        port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
        path: targetUrl.pathname + targetUrl.search,
        method: req.method,
        headers: { ...req.headers }
      };

      // Remover headers problemáticos o específicos de nuestro servidor local
      delete options.headers['host']; // Importante: Permite que Node genere el Host y SNI correctos
      delete options.headers['x-ojs-target-url'];
      delete options.headers['x-ojs-base-url'];
      delete options.headers['origin'];
      delete options.headers['referer'];

      // INYECCIÓN DE COOKIE: Solo para descargas de archivos (legacy endpoints)
      if (isLegacyDownload) {
        try {
          const sessionCookie = await getOjsSessionCookie(journalBaseUrl);

          // En modo legacy download, OJS es sumamente estricto. Limpiamos TODOS los headers 
          // que manda el navegador del usuario (como Accept, Sec-Fetch, User-Agent) 
          // y armamos una petición HTTP "pura" solo con la cookie de sesión.
          options.headers = {
            'cookie': sessionCookie
          };

        } catch (err) {
          console.error('[OJS-PROXY] Error obteniendo cookie de sesión:', err.message);
        }
      }

      const requestModule = targetUrl.protocol === 'https:' ? https : http;

      // 🔍 DIAGNOSTIC LOG — TEMPORARY
      console.log(`\n[OJS-PROXY-DIAG] → ${req.method} ${targetUrl.pathname}${targetUrl.search} ${isRetry ? '(RETRY)' : ''}`);
      if (isLegacyDownload) {
        console.log(`[OJS-PROXY-HEADERS] Enviando a OJS:`, JSON.stringify(options.headers, null, 2));
      }

      // Crear la petición hacia OJS
      const proxyReq = requestModule.request(options, (proxyRes) => {
        // 🔍 DIAGNOSTIC LOG — TEMPORARY
        console.log(`[OJS-PROXY-DIAG] ← ${proxyRes.statusCode} ${proxyRes.statusMessage} | content-type: ${proxyRes.headers['content-type']} | target: ${targetUrl.pathname}`);

        // AUTO-HEAL: Detectar si es un error de sesión en descargas legacy
        const contentType = proxyRes.headers['content-type'] || '';
        const isJsonError = isLegacyDownload && contentType.includes('application/json');
        const isAuthError = proxyRes.statusCode === 401 || proxyRes.statusCode === 403;

        if (!isRetry && isLegacyDownload && (isJsonError || isAuthError)) {
          console.log(`[OJS-PROXY] Detectada sesión expirada o denegada en descarga. Invalidando caché y reintentando...`);
          invalidateOjsSessionCookie(journalBaseUrl);

          // Importante: consumir el stream de la respuesta fallida para liberar memoria antes de reintentar
          proxyRes.on('data', () => { });
          proxyRes.on('end', () => {
            executeProxy(true); // Reintentar
          });
          return;
        }

        // Si no es un error que requiere reintento, simplemente pipeamos la respuesta al frontend
        res.status(proxyRes.statusCode);

        // Reenviar todos los headers de respuesta de OJS al frontend
        Object.keys(proxyRes.headers).forEach(key => {
          // Evitar duplicar headers de CORS si OJS los manda, ya que nuestro server tiene su propio CORS
          if (!key.toLowerCase().startsWith('access-control-')) {
            res.setHeader(key, proxyRes.headers[key]);
          }
        });

        // Stream de los datos de respuesta al cliente (Frontend)
        proxyRes.pipe(res);
      });

      proxyReq.on('error', (err) => {
        console.error('Error en OJS Proxy:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Fallo al conectar con OJS desde el backend', details: err.message });
        }
      });

      // Stream del cuerpo de la petición.
      // Si es un reintento (que solo ocurriría en GET para descargas), el req ya fue consumido.
      if (!isRetry) {
        req.pipe(proxyReq);
      } else {
        proxyReq.end();
      }
    };

    await executeProxy();

  } catch (error) {
    console.error('Proxy Error: URL inválida', targetUrlStr, error);
    if (!res.headersSent) {
      res.status(400).json({ error: 'URL destino inválida', details: error.message });
    }
  }
});

module.exports = router;
