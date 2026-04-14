'use client'
import { createCompany } from '../actions'
import { useRef } from 'react'
import { toast } from 'react-hot-toast'
export function CompanyForm() {
  const formRef = useRef<HTMLFormElement>(null)
  async function action(formData: FormData) {
    const name = formData.get('name')
    if (!name) {
      toast.error('O nome da empresa é obrigatório.')
      return
    }
    await createCompany(formData)
    formRef.current?.reset()
    toast.success('Empresa criada com sucesso!')
  }
  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      <input type="text" name="name" placeholder="Nome da empresa" required className="rounded-md border p-2" />
      <button type="submit" className="rounded-md bg-green-600 p-2 text-white">Salvar</button>
    </form>
  )
}
