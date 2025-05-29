import React, { useState } from 'react';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-white via-slate-50 to-indigo-100">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden grid md:grid-cols-2">
        
        {/* Left Side - Form */}
        <div className="p-10 flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-6 text-indigo-600">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          
          <form className="space-y-5">
            {isSignUp && (
              <input
                type="text"
                placeholder="Username"
                className="w-full border border-gray-300 rounded-lg p-3"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              className="w-full border border-gray-300 rounded-lg p-3"
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full border border-gray-300 rounded-lg p-3"
            />

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700"
            >
              {isSignUp ? 'Sign Up' : 'Log In'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-500">
            {isSignUp ? 'Already have an account?' : 'New here?'}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-indigo-600 font-semibold hover:underline"
            >
              {isSignUp ? 'Log In' : 'Sign Up'}
            </button>
          </p>
        </div>

        {/* Right Side - Graphic / Branding */}
        <div className="hidden md:flex items-center justify-center bg-indigo-600 text-white px-10 py-12">
          <div className="text-center">
            <h3 className="text-4xl font-bold mb-4">PokeBinder</h3>
            <p className="text-lg">
              Track and showcase your Pokémon Master Sets with ease.
            </p>
            <p className="mt-6 text-sm opacity-70">
              Join trainers across the world organizing their legendary collections.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;