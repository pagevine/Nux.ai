import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { validateEmail, validatePassword } from '../services/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'signin' 
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const { signIn, signUp, forgotPassword, isLoading, error, clearError } = useAuth();

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: ''
    });
    setValidationErrors([]);
    setResetEmailSent(false);
    clearError();
  };

  const handleClose = () => {
    resetForm();
    setMode(initialMode);
    onClose();
  };

  const validateForm = (): boolean => {
    const errors = [];

    // Email validation
    if (!formData.email) {
      errors.push('E-Mail ist erforderlich');
    } else if (!validateEmail(formData.email)) {
      errors.push('Ungültige E-Mail-Adresse');
    }

    // Password validation (not needed for forgot password)
    if (mode !== 'forgot') {
      if (!formData.password) {
        errors.push('Passwort ist erforderlich');
      } else if (mode === 'signup') {
        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.isValid) {
          errors.push(...passwordValidation.errors);
        }
      }

      // Confirm password for signup
      if (mode === 'signup') {
        if (!formData.name.trim()) {
          errors.push('Name ist erforderlich');
        }
        
        if (formData.password !== formData.confirmPassword) {
          errors.push('Passwörter stimmen nicht überein');
        }
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      let result;
      
      if (mode === 'signup') {
        result = await signUp(formData.email, formData.password, formData.name);
      } else if (mode === 'signin') {
        result = await signIn(formData.email, formData.password);
      } else if (mode === 'forgot') {
        result = await forgotPassword(formData.email);
        if (result.success) {
          setResetEmailSent(true);
          return;
        }
      }

      if (result?.success) {
        handleClose();
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  const switchMode = (newMode: 'signin' | 'signup' | 'forgot') => {
    setMode(newMode);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {mode === 'forgot' && (
              <button
                onClick={() => switchMode('signin')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isLoading}
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'signin' && 'Anmelden'}
              {mode === 'signup' && 'Registrieren'}
              {mode === 'forgot' && 'Passwort zurücksetzen'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Success message for password reset */}
          {mode === 'forgot' && resetEmailSent && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700">
                Wir haben dir eine E-Mail mit Anweisungen zum Zurücksetzen deines Passworts gesendet. 
                Bitte überprüfe dein Postfach.
              </p>
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="mt-2 text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Zurück zur Anmeldung
              </button>
            </div>
          )}

          {/* Name field for signup */}
          {mode === 'signup' && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Dein Name"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Email field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              E-Mail
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="deine@email.de"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password field (not shown for forgot password) */}
          {mode !== 'forgot' && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Passwort
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm password for signup */}
          {mode === 'signup' && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Passwort bestätigen
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Forgot password link for signin */}
          {mode === 'signin' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                disabled={isLoading}
                className="text-sm text-blue-500 hover:text-blue-600 disabled:opacity-50"
              >
                Passwort vergessen?
              </button>
            </div>
          )}

          {/* Error messages */}
          {(validationErrors.length > 0 || error) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              {validationErrors.map((err, index) => (
                <p key={index} className="text-sm text-red-600">• {err}</p>
              ))}
              {error && <p className="text-sm text-red-600">• {error}</p>}
            </div>
          )}

          {/* Submit button */}
          {!(mode === 'forgot' && resetEmailSent) && (
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {mode === 'signin' && 'Anmeldung...'}
                  {mode === 'signup' && 'Registrierung...'}
                  {mode === 'forgot' && 'E-Mail wird gesendet...'}
                </>
              ) : (
                <>
                  {mode === 'signin' && 'Anmelden'}
                  {mode === 'signup' && 'Registrieren'}
                  {mode === 'forgot' && 'Passwort zurücksetzen'}
                </>
              )}
            </button>
          )}

          {/* Mode switch */}
          {mode !== 'forgot' && (
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                {mode === 'signin' ? 'Noch kein Konto?' : 'Bereits registriert?'}
                {' '}
                <button
                  type="button"
                  onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                  disabled={isLoading}
                  className="text-blue-500 hover:text-blue-600 font-medium disabled:opacity-50"
                >
                  {mode === 'signin' ? 'Jetzt registrieren' : 'Hier anmelden'}
                </button>
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};