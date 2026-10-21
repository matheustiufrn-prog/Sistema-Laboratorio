import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@afimlab.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@afimlab.com',
      password: hashedPassword,
      role: 'ADMIN'
    }
  })

  console.log('Usuário admin criado com sucesso:', admin.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })