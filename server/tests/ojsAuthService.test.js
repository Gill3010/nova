const { extractCsrfToken, validateLoginSuccess } = require('../services/ojsAuthService');

jest.mock('../db', () => ({
  query: jest.fn(),
  pool: { end: jest.fn() }
}));

describe('ojsAuthService', () => {
  describe('extractCsrfToken', () => {
    it('debe extraer el token de una etiqueta <meta>', () => {
      const html = `
        <html>
          <head>
            <meta name="csrf-token" content="token_desde_meta_123">
          </head>
          <body></body>
        </html>
      `;
      expect(extractCsrfToken(html)).toBe('token_desde_meta_123');
    });

    it('debe extraer el token de un <input type="hidden">', () => {
      const html = `
        <html>
          <body>
            <form>
              <input type="hidden" name="csrfToken" value="token_desde_input_456" />
            </form>
          </body>
        </html>
      `;
      expect(extractCsrfToken(html)).toBe('token_desde_input_456');
    });

    it('debe priorizar el <meta> si ambos existen', () => {
      const html = `
        <html>
          <head>
            <meta name="csrf-token" content="token_desde_meta_123">
          </head>
          <body>
            <input type="hidden" name="csrfToken" value="token_desde_input_456" />
          </body>
        </html>
      `;
      expect(extractCsrfToken(html)).toBe('token_desde_meta_123');
    });

    it('debe lanzar un error si no encuentra ningún token', () => {
      const html = `<html><body>Sin token aqui</body></html>`;
      expect(() => extractCsrfToken(html)).toThrow('No se pudo encontrar el token CSRF');
    });

    it('debe lanzar un error si el HTML está vacío', () => {
      expect(() => extractCsrfToken('')).toThrow('El HTML proporcionado está vacío');
      expect(() => extractCsrfToken(null)).toThrow('El HTML proporcionado está vacío');
    });
  });

  describe('validateLoginSuccess', () => {
    it('debe retornar true si el código HTTP es 302 (redirección exitosa)', () => {
      expect(validateLoginSuccess(302, '<html>Redirecting...</html>')).toBe(true);
    });

    it('debe lanzar error de credenciales si el HTML contiene formError (código 200)', () => {
      const html = '<html><body><div class="formError">Credenciales incorrectas</div></body></html>';
      expect(() => validateLoginSuccess(200, html)).toThrow('Credenciales inválidas');
    });

    it('debe lanzar error de sesión invitada si el HTML contiene name="csrfToken" de nuevo (código 200)', () => {
      const html = '<html><body><input type="hidden" name="csrfToken" value="abc" /></body></html>';
      expect(() => validateLoginSuccess(200, html)).toThrow('Login falló: posible sesión invitada');
    });

    it('debe retornar true para código 200 si no hay signos de error ni de formulario de login (comportamiento legacy de éxito)', () => {
      const html = '<html><body>Bienvenido Administrador</body></html>';
      expect(validateLoginSuccess(200, html)).toBe(true);
    });

    it('debe lanzar error para códigos 4xx o 5xx', () => {
      expect(() => validateLoginSuccess(403, 'Forbidden')).toThrow('Login falló con código HTTP 403');
      expect(() => validateLoginSuccess(500, 'Internal Server Error')).toThrow('Login falló con código HTTP 500');
    });
  });
});
