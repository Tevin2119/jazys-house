const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin1234", 10);
  const tenants = await prisma.tenant.findMany();
  const tenant = tenants[0]; // Jazy's House Tokyo

  // 5 fake customers
  const customers = [
    { name: "Aminata Diallo", email: "aminata@email.com" },
    { name: "Yuki Tanaka", email: "yuki@email.jp" },
    { name: "Grace Okafor", email: "grace@email.com" },
    { name: "Kwame Mensah", email: "kwame@email.gh" },
    { name: "Sofia Rossi", email: "sofia@email.it" },
  ];

  for (const c of customers) {
    await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: { email: c.email, name: c.name, role: "CUSTOMER", passwordHash, tenantId: tenant.id },
    });
    console.log(`  ✓ ${c.name}`);
  }

  // Create fake orders for each customer
  const products = await prisma.product.findMany({ where: { tenantId: tenant.id }, take: 10 });
  
  for (const c of customers) {
    const user = await prisma.user.findUnique({ where: { email: c.email } });
    const orderCount = Math.floor(Math.random() * 3) + 1; // 1-3 orders each
    
    for (let i = 0; i < orderCount; i++) {
      const items = products.slice(0, Math.floor(Math.random() * 3) + 1);
      const total = items.reduce((s: number, p: { price: number }) => s + p.price, 0);
      const statuses = ["DELIVERED", "PROCESSING", "SHIPPED", "PENDING"];
      
      const order = await prisma.order.create({
        data: {
          tenantId: tenant.id,
          email: c.email,
          name: c.name,
          total,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          currency: "gbp",
          items: {
            create: items.map((p: { id: string; price: number }) => ({
              tenantId: tenant.id,
              productId: p.id,
              quantity: Math.floor(Math.random() * 2) + 1,
              price: p.price,
            })),
          },
        },
      });
      console.log(`  📦 Order ${order.id} — £${(total/100).toFixed(2)} — ${order.status}`);
    }
  }
  
  console.log(`\nSeeded ${customers.length} customers with orders.`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
