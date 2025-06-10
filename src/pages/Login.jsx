import React, { useState } from 'react';
import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      localStorage.setItem('user', email);
      window.location.href = '/profile';
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
  
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
  
      if (!userSnap.exists()) {
        const username = prompt('Choose a username:');
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          username: username || user.displayName || user.email,
          createdAt: new Date(),
        });
      }
  
      localStorage.setItem('user', user.uid);
      window.location.href = '/profile';
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-white via-slate-50 to-indigo-100">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden grid md:grid-cols-2">
        {/* Left Side - Form */}
        <div className="p-10 flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-6 text-indigo-600">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3"
              required
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700"
            >
              {isSignUp ? 'Sign Up' : 'Log In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 bg-white text-gray-800 border border-gray-300 rounded-lg py-2 hover:bg-gray-50 shadow"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"
                alt="Google G"
                className="w-5 h-5"
                />
              Continue with Google
            </button>
          </div>

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

        {/* Right Side - Branding */}
        <div className="hidden md:flex items-center justify-center bg-indigo-600 text-white px-10 py-12">
          <div className="text-center">
            <h3 className="text-4xl font-bold mb-4">PokeBinder</h3>
            <p className="text-lg">Track and showcase your Pokémon Master Sets with ease.</p>
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