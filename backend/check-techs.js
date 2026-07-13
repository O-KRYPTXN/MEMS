import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
dotenv.config()

const prisma = new PrismaClient()

async function main() {
  const techs = await prisma.user.findMany({
    where: { role: 'TECHNICIAN' },
    include: { department: true }
  })
  console.log(techs.map(t => ({ email: t.email, dept: t.department?.name, deptId: t.departmentId })))
}
main().catch(console.error).finally(() => prisma.$disconnect())
