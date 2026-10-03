import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Briefcase } from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'forgot';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'worker' | 'employer'>('worker');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      setLoading(false);
      if (error) {
        setError(error.message);
      } else {
        setResetSent(true);
      }
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your name');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, name.trim(), role);
      if (error) {
        setError(error);
        setLoading(false);
        return;
      }
      setLoading(false);
      return;
    }

    const { error } = await signIn(email, password);
    if (error) {
      setError(error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-olive flex items-center justify-center mb-3">
            <Briefcase className="w-7 h-7 text-cream-white" />
          </div>
          <h1 className="text-2xl font-bold text-kaam-text">Kaam</h1>
          <p className="text-sm text-kaam-muted mt-0.5">Find Work. Find People.</p>
        </div>

        {resetSent ? (
          <div className="clay-card p-5 text-center">
            <p className="text-sm text-kaam-text mb-3">
              Password reset instructions have been sent to your email.
            </p>
            <button
              onClick={() => { setMode('login'); setResetSent(false); }}
              className="btn-primary w-full"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="clay-card p-5 space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-kaam-muted mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="Enter your name"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-kaam-muted mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-xs font-medium text-kaam-muted mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                />
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-kaam-muted mb-1.5">I want to</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('worker')}
                    className={`option-box ${role === 'worker' ? '!bg-olive-lighter !border-olive' : ''}`}
                    style={{ minHeight: '48px' }}
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold text-kaam-text">Find Work</span>
                      <span className="text-xs text-kaam-muted">I'm looking for jobs</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('employer')}
                    className={`option-box ${role === 'employer' ? '!bg-olive-lighter !border-olive' : ''}`}
                    style={{ minHeight: '48px' }}
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold text-kaam-text">Hire Workers</span>
                      <span className="text-xs text-kaam-muted">I have jobs</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Please wait...' : mode === 'login' ? 'Login' : mode === 'signup' ? 'Sign Up' : 'Send Reset Link'}
            </button>

            <div className="text-center text-sm text-kaam-muted">
              {mode === 'login' && (
                <>
                  <button type="button" onClick={() => { setMode('signup'); setError(null); }} className="text-olive-deep font-medium">
                    Don't have an account? Sign up
                  </button>
                  <br />
                  <button type="button" onClick={() => { setMode('forgot'); setError(null); }} className="text-kaam-muted text-xs mt-2">
                    Forgot password?
                  </button>
                </>
              )}
              {mode === 'signup' && (
                <button type="button" onClick={() => { setMode('login'); setError(null); }} className="text-olive-deep font-medium">
                  Already have an account? Login
                </button>
              )}
              {mode === 'forgot' && (
                <button type="button" onClick={() => { setMode('login'); setError(null); }} className="text-olive-deep font-medium">
                  Back to login
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
