'use client';
import Image from 'next/image';

export default function SignUpPage() {
  async function handleGoogle() {
    // use signIn('google') if you want google signup
  }

  async function handleRegister(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value;
    const email = form.email.value;
    const password = form.password.value;
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
      headers: { 'Content-Type': 'application/json' }
    });
    const json = await res.json();
    if (json.ok) {
      window.location.href = '/sign-in';
    } else {
      alert(json.error || 'Error');
    }
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
            <h1 className="text-3xl font-semibold mt-6">You're one click away from less busywork</h1>
          </div>

          <div className="space-y-4">
            <button onClick={handleGoogle} className="w-full border rounded-xl py-3 flex items-center justify-center gap-2 shadow-sm">
              <img src="/google-icon.svg" alt="g" className="w-5 h-5" />
              <span className="font-medium">Sign Up with Google</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-200" />
              <div className="text-sm text-gray-400">Or</div>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <label className="text-xs font-medium text-gray-600">Full Name</label>
              <input name="name" placeholder="John Doe" className="w-full px-4 py-3 border rounded-xl" required />

              <label className="text-xs font-medium text-gray-600">Email Address</label>
              <input name="email" type="email" placeholder="Example@site.com" className="w-full px-4 py-3 border rounded-xl" required />

              <label className="text-xs font-medium text-gray-600">Password</label>
              <input name="password" type="password" placeholder="Minimum 8 Characters" className="w-full px-4 py-3 border rounded-xl" required />

              <label className="flex items-center gap-2 text-gray-500">
                <input type="checkbox" required /> Agree to Terms of Service and Privacy Policy
              </label>

              <button type="submit" className="w-full bg-brand text-white rounded-xl py-3 mt-1">Get Started</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
