// =================================================================
// ARQUIVO: app/companies/page.tsx (VERSÃO COM CAMINHO RELATIVO)
// =================================================================

import prisma from '@/lib/prisma'
import { CompanyForm } from './_components/CompanyForm'
import { CompanyList } from './_components/CompanyList'
import { getServerSession } from 'next-auth'
// A linha abaixo foi corrigida para usar o caminho relativo, que é infalível.
import { authOptions } from '../api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'

export default async function CompaniesPage() {
  const session = await getServerSession(authOptions)

  // Se não houver sessão, redireciona para a página inicial
  if (!session) {
    redirect('/')
  }

  const companies = await prisma.company.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <div className="bg-gray-50 p-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-800">
        Gestão de Empresas
      </h1>
      <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
        <div className="md:col-span-1">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Nova Empresa</h2>
            <CompanyForm />
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Empresas Cadastradas</h2>
            <CompanyList companies={companies} />
          </div>
        </div>
      </div>
    </div>
  )
}
