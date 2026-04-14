'use server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
export async function createCompany(formData: FormData) {
  const name = formData.get('name') as string
  if (!name) return
  await prisma.company.create({ data: { name } })
  revalidatePath('/companies')
}
export async function deleteCompany(id: string) {
  await prisma.company.delete({ where: { id } })
  revalidatePath('/companies')
}
