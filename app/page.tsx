import Link from 'next/link'
export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-5xl font-bold text-gray-800">Bem-vindo ao Rotiq</h1>
      <p className="mt-4 text-lg text-gray-600">Sua plataforma de gestão inteligente.</p>
      <Link href="/companies" className="mt-8 inline-block rounded-md bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700">
        Gerenciar Empresas
      </Link>
    </div>
  )
}
