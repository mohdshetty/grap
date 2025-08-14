
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BOSU_LOGO_BASE64 } from '../constants';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage('Please enter your email address.');
      return;
    }
    // In a real application, you would make an API call here.
    // For this demo, we'll just show a success message.
    setMessage('If an account with this email exists, a password reset link has been sent.');
    setEmail(''); // Optionally clear the input
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-purple-bg px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm">
        <div className="bg-white p-8 shadow-2xl rounded-2xl">
          <div className="text-center mb-8">
            <img className="mx-auto h-24 w-auto" src={BOSU_LOGO_BASE64} alt="Borno State University" />
            <h2 className="mt-6 text-center text-xl font-bold tracking-tight text-bosu-blue">
              PASSWORD RECOVERY
            </h2>
          </div>
          
          <form className="space-y-6" onSubmit={handleResetPassword}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-bosu-blue">
                Registered Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="appearance-none block w-full px-4 py-3 border-2 border-accent-orange rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {message && (
              <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 rounded" role="alert">
                <p className="text-sm">{message}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-950 hover:bg-bosu-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-500/20"
              >
                RESET PASSWORD
              </button>
            </div>
          </form>

          <div className="mt-6">
            <Link
              to="/login"
              className="w-full flex justify-center py-3 px-4 text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
            >
              Back to Login
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
