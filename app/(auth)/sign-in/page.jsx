'use client';
import Image from 'next/image';
import { signIn } from 'next-auth/react';

export default function SignInPage() {
  async function handleGoogle() {
    await signIn('google',{ callbackUrl: '/dashboard' });
  }

  async function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;
    await signIn('credentials');
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden md:block w-1/2 relative">
        <Image src="/hero.jpg" alt="hero" fill style={{ objectFit: 'cover' }} />
      </div>

      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="w-full max-w-md p-8">
          <div className="text-center mb-6">
            <img src="/logo.svg" alt="logo" className="mx-auto w-28" />
            <h1 className="text-3xl font-semibold mt-6">Welcome to GGTodo</h1>
            <p className="text-sm text-gray-500 mt-2">To get started, please sign in</p>
          </div>

          <div className="space-y-4">
            <button onClick={handleGoogle} className="w-full border rounded-xl py-3 flex items-center justify-center gap-2 shadow-sm">
              <img src="/google-icon.svg" alt="g" className="w-5 h-5" />
              <span className="font-medium">Log In with Google</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-200" />
              <div className="text-sm text-gray-400">Or</div>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <label className="text-xs font-medium text-gray-600">Email Address</label>
              <input name="email" type="email" placeholder="Enter your registered email" className="w-full px-4 py-3 border rounded-xl" required />

              <label className="text-xs font-medium text-gray-600">Password</label>
              <input name="password" type="password" placeholder="Enter your password" className="w-full px-4 py-3 border rounded-xl" required />

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-500">
                  <input type="checkbox" className="w-4 h-4" /> Remember me
                </label>
                <a className="text-brand font-medium" href="#">Forgot Password</a>
              </div>

              <button type="submit" className="w-full bg-brand text-white rounded-xl py-3 mt-1">Login</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
