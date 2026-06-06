import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { Role } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';

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

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin 
      ? { email, password } 
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
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 mb-4">
            <Lock className="h-5 w-5" aria-hidden="true" />
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
              <option value="admin">Súper Administrador</option>
            </Select>
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
