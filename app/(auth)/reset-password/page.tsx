'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [konfirm, setKonfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      setError('Kata sandi minimal 8 karakter')
      return
    }
    if (password !== konfirm) {
      setError('Konfirmasi kata sandi tidak cocok')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    alert('Kata sandi berhasil diubah. Silakan masuk kembali.')
    router.push('/login')
  }

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <div className='bg-white rounded-2xl shadow p-8 w-full max-w-md'>
        <div className='text-center mb-8'>
          <div className='text-3xl font-bold text-green-600 mb-3'>CS</div>
          <h1 className='text-2xl font-bold'>Buat Kata Sandi Baru</h1>
        </div>

        {error && (
          <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm'>
            {error}
          </div>
        )}

        <form onSubmit={handleReset} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Kata Sandi Baru</label>
            <input
              type='password'
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Minimal 8 karakter'
              className='w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Konfirmasi Kata Sandi</label>
            <input
              type='password'
              required
              value={konfirm}
              onChange={(e) => setKonfirm(e.target.value)}
              placeholder='Ulangi kata sandi baru'
              className='w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500'
            />
          </div>

          <button
            type='submit'
            disabled={loading}
            className='w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition'
          >
            {loading ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
          </button>
        </form>
      </div>
    </div>
  )
}
