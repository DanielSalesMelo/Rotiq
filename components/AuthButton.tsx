'use client'
import { signIn, signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
export function AuthButton() {
  const { data: session, status } = useSession()
  if (status === 'loading') { return <div className="h-10 w-24 animate-pulse rounded-md bg-gray-200" /> }
  if (session) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {session.user?.image && <Image src={session.user.image} alt={session.user.name ?? 'Avatar'} width={32} height={32} className="rounded-full" />}
          <span className="text-sm font-medium text-gray-700">Olá, {session.user?.name}</span>
        </div>
        <button onClick={() => signOut()} className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600">Logout</button>
      </div>
    )
  }
  return <button onClick={() => signIn('auth0')} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700">Login</button>
}
