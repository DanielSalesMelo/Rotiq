'use client'
import { deleteCompany } from '../actions'
import { toast } from 'react-hot-toast'
type Company = { id: string; name: string }
export function CompanyList({ companies }: { companies: Company[] }) {
  async function handleDelete(id: string) {
    if (confirm('Tem certeza que deseja deletar esta empresa?')) {
      await deleteCompany(id)
      toast.success('Empresa deletada com sucesso!')
    }
  }
  return (
    <ul className="space-y-2">
      {companies.map((company) => (
        <li key={company.id} className="flex items-center justify-between rounded-md border p-2">
          <span>{company.name}</span>
          <button onClick={() => handleDelete(company.id)} className="text-red-500">Deletar</button>
        </li>
      ))}
    </ul>
  )
}
