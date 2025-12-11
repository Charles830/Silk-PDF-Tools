import React, { useState } from 'react';
import { X, User, Lock, ArrowRight } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    setAuthModalOpen, 
    authModalTab, 
    setAuthModalTab, 
    login, 
    register,
    t 
  } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (authModalTab === 'login') {
      const isSuccess = login(username, password);
      if (isSuccess) {
        setAuthModalOpen(false);
        setUsername('');
        setPassword('');
      } else {
        setError(t.auth.errorInvalid);
      }
    } else {
      if (password !== confirmPassword) {
        setError(t.auth.errorMismatch);
        return;
      }
      const isCreated = register(username, password);
      if (isCreated) {
        setSuccess(t.auth.successSignup);
        setTimeout(() => {
          setAuthModalTab('login');
          setSuccess('');
          setUsername('');
          setPassword('');
          setConfirmPassword('');
        }, 1500);
      } else {
        setError(t.auth.errorExists);
      }
    }
  };

  const switchTab = (tab: 'login' | 'signup') => {
    setAuthModalTab(tab);
    setError('');
    setSuccess('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative border border-slate-100 dark:border-slate-700">
        
        {/* Close Button */}
        <button 
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              {authModalTab === 'login' ? t.auth.loginTitle : t.auth.signupTitle}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 ml-1">
                {t.auth.username}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-slate-800 dark:text-white transition-all"
                  placeholder={t.auth.username}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 ml-1">
                {t.auth.password}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-slate-800 dark:text-white transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {authModalTab === 'signup' && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 ml-1">
                  {t.auth.confirmPassword}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-slate-800 dark:text-white transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{error}</p>
            )}
            
            {success && (
              <p className="text-green-500 text-sm text-center bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">{success}</p>
            )}

            <button
              type="submit"
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold text-lg hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
            >
              {authModalTab === 'login' ? t.auth.submitLogin : t.auth.submitSignup}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => switchTab(authModalTab === 'login' ? 'signup' : 'login')}
              className="text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 text-sm font-medium transition-colors"
            >
              {authModalTab === 'login' ? t.auth.switchNoAccount : t.auth.switchHasAccount}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;