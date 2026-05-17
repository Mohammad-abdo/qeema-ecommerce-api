import { prisma } from './prisma.js';

export async function merchantIdForUser(userId: number): Promise<number | null> {
  const m = await prisma.merchant.findUnique({ where: { user_id: userId }, select: { id: true } });
  return m?.id ?? null;
}
