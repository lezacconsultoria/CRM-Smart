import React, { useState } from 'react';
import { User } from '../types';
import { nocoService } from '../services/nocoService';

interface LoginProps {
  onLogin: (user: User, rememberMe: boolean) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryInfo, setRetryInfo] = useState(''); // e.g. "Reintentando (2/4)..."

  // Pre-warm: try to establish the NocoDB connection in the background
  // so it's often ready before the user even clicks the button
  useEffect(() => {
    nocoService.masterLogin().catch(() => {
      // Silently ignore — it will retry when the user submits
    });
  }, []);

  const attemptLogin = async (attempt: number): Promise<User | null> => {
    try {
      return await nocoService.loginUser(email, password);
    } catch (err: any) {
      const isNetwork = err.code === 'ERR_NETWORK' || err.message === 'ERR_NETWORK' || err.message === 'Network Error';
      const MAX_ATTEMPTS = 4;
      if (isNetwork && attempt < MAX_ATTEMPTS) {
        const delay = 800 * attempt; // 800ms, 1600ms, 2400ms...
        setRetryInfo(`Problema de red — Reintentando (${attempt}/${MAX_ATTEMPTS - 1})...`);
        await new Promise(res => setTimeout(res, delay));
        nocoService.resetToken(); // Force a fresh token on every retry
        return attemptLogin(attempt + 1);
      }
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setRetryInfo('');
    
    try {
      const user = await attemptLogin(1);
      
      if (user) {
        onLogin(user, rememberMe);
      } else {
        setError('Credenciales inválidas. Intente con: admin1@lezac.com, admin2@lezac.com o roberto@lezac.com');
      }
    } catch (err: any) {
      console.error('Submit Login Error:', err);
      setError('No se pudo conectar al servidor después de varios intentos. Verifique su conexión a internet.');
    } finally {
      setIsSubmitting(false);
      setRetryInfo('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 obsidian-gradient font-body selection:bg-primary/30 selection:text-primary">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-secondary-container/5 blur-[100px] rounded-full"></div>
      </div>
      
      {/* Login Container */}
      <main className="relative w-full max-w-[440px] z-10">
        {/* Brand Identity */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-surface-container-high mb-6 border border-outline-variant/10 shadow-2xl">
            <span className="material-symbols-outlined text-primary text-3xl">hub</span>
          </div>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface mb-2">
            CRM Smart
          </h1>
          <p className="font-body text-outline text-sm tracking-wide">
            Gestión comercial estratégica para equipos de alto nivel
          </p>
        </div>
        
        {/* Login Card */}
        <div className="bg-surface-container-low/40 backdrop-blur-xl rounded-xl p-8 md:p-10 border border-outline-variant/15 shadow-2xl shadow-black/40">
          
          {error && (
            <div className="mb-6 p-3 bg-error/10 border border-error/50 rounded-lg text-error text-center text-xs font-bold font-mono">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-outline uppercase tracking-widest ml-1" htmlFor="email">
                Email
              </label>
              <div className="relative group executive-glow rounded-lg transition-all duration-300">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-xl group-focus-within:text-primary transition-colors">alternate_email</span>
                </div>
                <input 
                  className="block w-full pl-12 pr-4 py-3.5 bg-surface-container-lowest border-none rounded-lg text-on-surface placeholder:text-outline/40 focus:ring-1 focus:ring-primary/50 transition-all text-sm outline-none" 
                  id="email" 
                  name="email" 
                  placeholder="admin1 / admin2 / roberto @lezac.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  type="email"
                />
              </div>
            </div>
            
            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="block text-xs font-semibold text-outline uppercase tracking-widest" htmlFor="password">
                  Contraseña
                </label>
                <a className="text-[11px] font-medium text-primary-fixed-dim hover:text-primary transition-colors uppercase tracking-wider" href="#">
                  Olvidé mi contraseña
                </a>
              </div>
              <div className="relative group executive-glow rounded-lg transition-all duration-300">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-xl group-focus-within:text-primary transition-colors">lock</span>
                </div>
                <input 
                  className="block w-full pl-12 pr-4 py-3.5 bg-surface-container-lowest border-none rounded-lg text-on-surface placeholder:text-outline/40 focus:ring-1 focus:ring-primary/50 transition-all text-sm outline-none" 
                  id="password" 
                  name="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Cualquier contraseña funcionará por ahora" 
                  required 
                  type="password"
                />
              </div>
            </div>
            
            {/* Remember Me */}
            <div className="flex items-center space-x-3 ml-1">
              <div className="flex items-center h-5">
                <input 
                  className="w-4 h-4 rounded border-outline-variant bg-surface-container-lowest text-primary focus:ring-primary/20 focus:ring-offset-0 transition-all cursor-pointer" 
                  id="remember" 
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
              </div>
              <label className="text-xs text-on-surface-variant font-medium cursor-pointer" htmlFor="remember">
                Mantener sesión iniciada
              </label>
            </div>
            
            {/* Submit Button */}
            <button 
              className="group relative w-full flex justify-center py-4 px-4 bg-gradient-to-br from-primary to-primary-container text-on-primary-container text-sm font-bold rounded-lg overflow-hidden shadow-lg shadow-primary/10 hover:shadow-primary/20 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
              type="submit"
              disabled={isSubmitting}
            >
              <span className="relative z-10 flex items-center">
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin mr-2">refresh</span>
                    {retryInfo || 'Verificando...'}
                  </>
                ) : (
                  <>
                    Acceder al CRM
                    <span className="material-symbols-outlined ml-2 text-lg transition-transform group-hover:translate-x-1">arrow_forward</span>
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </form>
          
          {/* Bottom Note */}
          <div className="mt-10 pt-8 border-t border-outline-variant/10 text-center">
            <p className="text-xs text-outline font-medium">
              ¿No tienes acceso? <a className="text-on-surface hover:text-primary transition-colors font-bold" href="#">Solicitar a Administración</a>
            </p>
          </div>
        </div>
        
        {/* Trust Footer */}
        <footer className="mt-12 flex flex-col items-center space-y-4 opacity-40 hover:opacity-100 transition-opacity duration-500">
          <div className="flex items-center space-x-6">
            <div className="flex items-center text-[10px] uppercase tracking-[0.2em] font-bold text-outline">
              <span className="material-symbols-outlined text-sm mr-2">verified_user</span>
              Encriptación Enterprise
            </div>
            <div className="h-1 w-1 bg-outline rounded-full"></div>
            <div className="flex items-center text-[10px] uppercase tracking-[0.2em] font-bold text-outline">
              <span className="material-symbols-outlined text-sm mr-2">security</span>
              SLA 99.9%
            </div>
          </div>
          <p className="text-[10px] text-outline/60 font-medium">© 2024 Strategic Intelligence Systems. Todos los derechos reservados.</p>
        </footer>
      </main>
      
      {/* Side Graphic for Visual Balance (Desktop Only) */}
      <div className="hidden lg:block fixed right-12 bottom-12 w-64 h-64 opacity-20 select-none">
        <div className="relative w-full h-full">
          <div className="absolute inset-0 border border-primary/30 rounded-full animate-pulse"></div>
          <div className="absolute inset-8 border border-secondary-container/20 rounded-full"></div>
          <div className="absolute inset-16 border border-outline/10 rounded-full"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary/40 text-4xl">auto_graph</span>
          </div>
        </div>
      </div>
    </div>
  );
}
