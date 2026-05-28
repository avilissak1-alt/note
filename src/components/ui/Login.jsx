import React, { useState } from 'react';

function Login({ onLogin, theme }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const VALID_CREDENTIALS = {
    email: "prof@ecole.fr",
    password: "prof1234"
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (email === VALID_CREDENTIALS.email && password === VALID_CREDENTIALS.password) {
      setError('');
      onLogin();
    } else {
      setError('Email ou mot de passe incorrect');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" 
         style={{ background: 'linear-gradient(to bottom right, var(--blue-500), var(--purple-600))' }}>
      <div className="rounded-lg shadow-xl p-8 w-96" 
           style={{ backgroundColor: 'var(--bg-primary)' }}>
        <h1 className="text-3xl font-bold text-center mb-8" 
            style={{ color: 'var(--text-primary)' }}>
          Gestion des Notes
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" 
                   className="block text-sm font-medium mb-2" 
                   style={{ color: 'var(--text-secondary)' }}>
              Email
            </label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ 
                backgroundColor: 'var(--input-bg)', 
                borderColor: 'var(--border-color)', 
                color: 'var(--input-text)' 
              }}
              placeholder="professeur@ecole.fr"
            />
          </div>
          <div>
            <label htmlFor="password" 
                   className="block text-sm font-medium mb-2" 
                   style={{ color: 'var(--text-secondary)' }}>
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ 
                backgroundColor: 'var(--input-bg)', 
                borderColor: 'var(--border-color)', 
                color: 'var(--input-text)' 
              }}
              placeholder="••••••"
            />
          </div>
          {error && (
            <div className="px-4 py-3 rounded" 
                 style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full py-2 px-4 rounded-lg transition duration-200 font-medium text-white"
            style={{ backgroundColor: 'var(--blue-500)' }}
          >
            Se connecter
          </button>
          <div className="mt-4 text-center text-sm" 
               style={{ color: 'var(--text-secondary)' }}>
            Identifiants de test :<br />
            <span className="font-mono">prof@ecole.fr</span> / <span className="font-mono">prof1234</span>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
