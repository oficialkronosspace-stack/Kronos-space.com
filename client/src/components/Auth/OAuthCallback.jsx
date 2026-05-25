import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * OAuthCallback — maneja el redirect de Google/Facebook OAuth.
 *
 * El backend redirige a /auth/callback?token=<JWT>&provider=<google|facebook>
 * Este componente guarda el token en localStorage y navega al feed.
 */
function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const err = searchParams.get('error');

    if (err) {
      setError(`Error al autenticar con ${err.replace('_failed', '')}. Intenta de nuevo.`);
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (token) {
      loginWithToken(token);
      navigate('/feed', { replace: true });
    } else {
      setError('No se recibio un token de autenticacion.');
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [searchParams, navigate, loginWithToken]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md text-center">
          <div className="text-red-600 text-5xl mb-4">✗</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error de autenticacion</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md text-center">
        <div className="animate-spin text-5xl mb-4">⟳</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Autenticando...</h2>
        <p className="text-gray-600">Por favor espera un momento.</p>
      </div>
    </div>
  );
}

export default OAuthCallback;
