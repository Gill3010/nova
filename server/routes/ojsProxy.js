const express = require('express');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const router = express.Router();

/**
 * Proxy universal para peticiones a OJS.
 * Resuelve el problema de CORS y de SNI/Domain Fronting de Vite.
 * Soporta GET, POST, PUT, DELETE y subida de archivos (multipart/form-data) vía streams.
 */
router.all('/', (req, res) => {
  // El frontend pasa la URL final exacta que desea consultar en este header
  const targetUrlStr = req.headers['x-ojs-target-url'];
  
  if (!targetUrlStr) {
    return res.status(400).json({ error: 'Falta el header x-ojs-target-url' });
  }

  try {
    const targetUrl = new URL(targetUrlStr);
    
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

    const requestModule = targetUrl.protocol === 'https:' ? https : http;

    // Crear la petición hacia OJS
    const proxyReq = requestModule.request(options, (proxyRes) => {
      // Reenviar status code
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

    // Stream del cuerpo de la petición (soporta JSON y archivos/FormData pesados sin agotar RAM)
    req.pipe(proxyReq);

  } catch (error) {
    console.error('Proxy Error: URL inválida', targetUrlStr);
    res.status(400).json({ error: 'URL destino inválida', details: error.message });
  }
});

module.exports = router;
