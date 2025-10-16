
import { NextRequest, NextResponse } from 'next/server'
import bcryptjs from 'bcryptjs'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, firstName, lastName, company, phone } = body

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, password, nome e apelido são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se já existe utilizador
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Já existe uma conta com este email' },
        { status: 400 }
      )
    }

    // Hash da password
    const hashedPassword = await bcryptjs.hash(password, 12)

    // Criar utilizador
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        company: company || null,
        phone: phone || null,
        name: `${firstName} ${lastName}`,
        credits: 1, // 1 relatório grátis
      }
    })

    // Criar notificação de boas-vindas
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'welcome',
        subject: `Bem-vind${firstName.endsWith('a') ? 'a' : 'o'} à A Maria Faz Analytics!`,
        message: `Olá ${firstName}! A tua conta foi criada com sucesso. Tens direito a 1 relatório gratuito para experimentares a nossa plataforma.`,
        emailTo: user.email,
      }
    })

    // Notificação para admin de novo registo
    await prisma.notification.create({
      data: {
        adminNotification: true,
        type: 'new_signup',
        subject: 'Novo registo na plataforma',
        message: `Novo utilizador registado: ${email} (${firstName} ${lastName})`,
        emailTo: 'admin@amariafaz.com',
      }
    })

    return NextResponse.json({
      message: 'Conta criada com sucesso',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        credits: user.credits,
      }
    })

  } catch (error) {
    console.error('Erro no signup:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
