import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const profileRef = doc(db, 'users', firebaseUser.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          setProfile(profileSnap.data());
        }
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-6 rounded-lg shadow text-center">
      {profile ? (
        <>
          <h2 className="text-2xl font-bold text-indigo-700 mb-2">
            Hi {profile.username},
          </h2>
          <p className="text-gray-600">Welcome back to your collection tracker.</p>
        </>
      ) : (
        <p className="text-lg text-gray-500">Loading...</p>
      )}
    </div>
  );
};

export default Profile;