'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPassword() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (err) { setError(err.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  if (sent) return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <div className='bg-white rounded-2xl shadow p-8 text-center max-w-md w-full'>
        <div className='text-5xl mb-4'>📧</div>
        <h2 className='text-xl font-bold mb-2'>Email terkirim!</h2>
        <p className='text-gray-500 text-sm'>
          Cek email <strong>{email}</strong> dan klik link reset password.
        </p>
        <a href='/auth/login' className='mt-6 block text-green-600 hover:underline text-sm'>
          ← Kembali ke Login
        </a>
      </div>
    </div>
  )

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <div className='bg-white rounded-2xl shadow p-8 w-full max-w-md'>
        <div className='text-center mb-8'>
          <div className='text-5xl mb-3'>🔑</div>
          <h1 className='text-2xl font-bold'>Lupa Password?</h1>
          <p className='text-gray-500 text-sm mt-1'>
            Masukkan emailmu, kami kirimkan link reset.
          </p>
        </div>
        {error && (
          <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 
            rounded-lg mb-4 text-sm'>{error}</div>
        )}
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Email</label>
            <input type='email' required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='nama@email.com'
              className='w-full border border-gray-300 rounded-lg px-4 py-2.5
                focus:outline-none focus:ring-2 focus:ring-green-500'/>
          </div>
          <button type='submit' disabled={loading}
            className='w-full bg-green-600 hover:bg-green-700 disabled:opacity-50
              text-white font-semibold py-3 rounded-lg transition'>
            {loading ? 'Mengirim...' : 'Kirim Link Reset'}
          </button>
        </form>
        <a href='/auth/login' className='block text-center text-gray-500 
          hover:text-gray-700 mt-4 text-sm'>← Kembali ke Login</a>
      </div>
    </div>
  )
}