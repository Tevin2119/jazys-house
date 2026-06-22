import { prisma } from "@/lib/db";

export function getStatusHistory(orderId: string) {
  return prisma.orderStatusLog.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
  });
}

export function getOrderMessages(orderId: string) {
  return prisma.orderMessage.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
  });
}
