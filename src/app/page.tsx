'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-dvh p-2 place-items-center">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">Welcome to Synapse</h1>
        <p className="text-lg text-gray-600 mb-6">
          Connect your ideas, control your time. Sign in to get started with your productivity journey.
        </p>
        <div className="flex gap-4 justify-center">
          {!isSignedIn && (
            <>
              <button 
                onClick={() => router.push('/sign-in')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Sign In
              </button>
              <button 
                onClick={() => router.push('/sign-up')}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}