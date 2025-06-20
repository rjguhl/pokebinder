import React, { useState } from 'react';
import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  // Toggle between sign up and login, and clear form fields
  const toggleSignUp = () => {
    setIsSignUp((prev) => !prev);
    setEmail('');
    setPassword('');
    setError('');
  };

  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameError, setUsernameError] = useState('');

  const formatFirebaseError = (code) => {
    switch (code) {
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/invalid-credential':
        return 'Invalid login credentials.';
      case 'auth/too-many-requests':
        return 'Too many login attempts. Please try again later.';
      case 'auth/popup-closed-by-user':
        return 'Google login was closed before completion.';
      case 'auth/popup-blocked':
        return 'Popup blocked by the browser. Please allow popups and try again.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isSignUp) {
        // Check if the email is already registered before attempting to sign up
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.length > 0) {
          setError('An account with this email already exists.');
          return;
        }
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        setTempUser(userCred.user);
        setShowUsernamePrompt(true);
        return;
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        localStorage.setItem('user', email);
        window.location.href = '/profile';
      }
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please log in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters long.');
      } else if (err.code === 'auth/invalid-email') {
        setError('The email address is not valid.');
      } else {
        setError(formatFirebaseError(err.code));
      }
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
        setTempUser(user);
        setShowUsernamePrompt(true);
        return;
      }
  
      localStorage.setItem('user', user.uid);
      window.location.href = '/profile';
    } catch (err) {
      setError(formatFirebaseError(err.code));
    }
  };

  const handleUsernameSubmit = async () => {
    setUsernameError('');
    if (usernameInput.trim().length < 2) {
      setUsernameError('Username must be at least 2 characters.');
      return;
    }

    const usernameTaken = await getDocs(
      query(collection(db, 'users'), where('username', '==', usernameInput.trim()))
    );

    if (!usernameTaken.empty) {
      setUsernameError('Username is already taken.');
      return;
    }

    try {
      const userRef = doc(db, 'users', tempUser.uid);
      await setDoc(userRef, {
        uid: tempUser.uid,
        email: tempUser.email,
        username: usernameInput.trim(),
        createdAt: new Date(),
      });

      localStorage.setItem('user', tempUser.uid);
      window.location.href = '/profile';
    } catch (err) {
      setUsernameError('Failed to save username.');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-tr from-white via-slate-50 to-indigo-100`}>
      <div className={`${isSignUp ? 'w-full max-w-md' : 'w-full max-w-5xl grid md:grid-cols-2'} bg-white rounded-2xl shadow-xl overflow-hidden`}>

        <div className={`${isSignUp ? 'p-8' : 'p-10'} flex flex-col justify-center items-center`}>
          <h2 className="text-3xl font-bold mb-6 text-indigo-700 text-center">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3"
              required
            />
            <input
              id="password"
              name="password"
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
              onClick={toggleSignUp}
              className="text-indigo-600 font-semibold hover:underline"
            >
              {isSignUp ? 'Log In' : 'Sign Up'}
            </button>
          </p>
        </div>

        {!isSignUp && (
          <div className="hidden md:flex items-center justify-center bg-indigo-600 text-white px-10 py-12">
            <div className="text-center">
              <h3 className="text-4xl font-bold mb-4">PokeBinder</h3>
              <p className="text-lg">Track and showcase your Pokémon Master Sets with ease.</p>
              <p className="mt-6 text-sm opacity-70">
                Join trainers across the world organizing their legendary collections.
              </p>
            </div>
          </div>
        )}
      </div>
      {showUsernamePrompt && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center max-w-sm w-full">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Choose a Username</h2>
            <input
              type="text"
              placeholder="Enter username"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-3"
            />
            {usernameError && <p className="text-red-500 text-sm mb-2">{usernameError}</p>}
            <button
              onClick={handleUsernameSubmit}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 w-full"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;