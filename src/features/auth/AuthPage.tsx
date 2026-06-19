import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import type { Role } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
        }
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

export const AuthPage: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  
  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState<Role>('speaker');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Turnstile state and ref
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!isLogin) {
      setTurnstileToken(null);
      return;
    }

    let script = document.querySelector('script[src*="challenges.cloudflare.com/turnstile/v0/api.js"]') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    let widgetId: string | null = null;

    const initializeTurnstile = () => {
      if (window.turnstile && turnstileContainerRef.current) {
        try {
          turnstileContainerRef.current.innerHTML = '';
          const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          const sitekey = isLocal ? '1x00000000000000000000AA' : '0x4AAAAAADkGz5Ytsx8cDm1w';

          widgetId = window.turnstile.render(turnstileContainerRef.current, {
            sitekey,
            callback: (token: string) => {
              setTurnstileToken(token);
              setError('');
            },
            'error-callback': () => {
              setTurnstileToken(null);
              setError('Error de verificación. Por favor, reintente.');
            },
            'expired-callback': () => {
              setTurnstileToken(null);
              setError('La verificación ha expirado. Por favor, reintente.');
            }
          });
        } catch (e) {
          console.error("Turnstile render error:", e);
        }
      }
    };

    if (window.turnstile) {
      initializeTurnstile();
    } else {
      script.addEventListener('load', initializeTurnstile);
    }

    return () => {
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch (e) {
          console.error("Turnstile remove error:", e);
        }
      }
      if (script) {
        script.removeEventListener('load', initializeTurnstile);
      }
    };
  }, [isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (isLogin && !turnstileToken) {
      setError('Por favor, completa la verificación de seguridad.');
      setIsLoading(false);
      return;
    }

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin 
      ? { email, password, 'cf-turnstile-response': turnstileToken } 
      : { email, password, nombre, rol };

    try {
      const API_URL = import.meta.env.PROD ? endpoint : `http://localhost:3001${endpoint}`;
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error en la autenticación');
      }

      if (isLogin) {
        login(data.token, data.user);
      } else {
        // Si se registró exitosamente, loguearlo automáticamente o pedir que inicie sesión
        setIsLogin(true);
        setError('Registro exitoso. Por favor, inicia sesión.');
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md p-8 animate-fade-in shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <img src="/logo_nexus.jpg" alt="Nova Logo" className="h-16 object-contain rounded-xl shadow-sm" />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            {isLogin
              ? 'Ingresa tus credenciales para acceder'
              : 'Crea tu cuenta en la plataforma académica'}
          </p>
        </div>

        {error && (
          <div role="alert" className={`p-3 mb-6 rounded-lg text-sm font-medium ${
            error.includes('exitoso') 
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
          }`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <Input
              id="nombre"
              label="Nombre Completo"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              placeholder="Ej: Dra. María López"
            />
          )}

          <Input
            id="email"
            label="Correo Electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="correo@universidad.edu"
            autoComplete="email"
          />

          <Input
            id="password"
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />

          {!isLogin && (
            <Select
              id="rol"
              label="Tipo de Cuenta (Rol)"
              value={rol}
              onChange={(e) => setRol(e.target.value as Role)}
            >
              <option value="speaker">Ponente (Para enviar artículos)</option>
              <option value="organizer">Organizador (Para gestionar congresos)</option>
              <option value="attendee">Asistente / Público General</option>
              <option value="reviewer">Revisor (Para evaluar envíos)</option>
            </Select>
          )}

          {isLogin && (
            <div 
              ref={turnstileContainerRef} 
              className="cf-turnstile my-2 flex justify-center"
            />
          )}

          <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
            {isLogin ? 'Ingresar al Portal' : 'Registrarse'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          {isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="ml-2 font-semibold text-zinc-900 dark:text-zinc-100 hover:underline underline-offset-2"
          >
            {isLogin ? 'Regístrate aquí' : 'Inicia Sesión'}
          </button>
        </div>
      </Card>
  );
};
