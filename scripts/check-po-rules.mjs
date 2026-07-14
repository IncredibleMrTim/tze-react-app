import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const rules = await prisma.poRule.findMany({
    orderBy: { priority: 'asc' }
  });

  console.log(`\n📋 Found ${rules.length} PO rules in database:\n`);

  if (rules.length === 0) {
    console.log('❌ No rules found - table is empty\n');
  } else {
    rules.forEach(rule => {
      console.log(`---`);
      console.log(`ID: ${rule.id}`);
      console.log(`Account: ${rule.contactAccount}`);
      console.log(`Type: ${rule.ruleType}`);
      console.log(`Priority: ${rule.priority}`);
      console.log(`Rules:\n${rule.scanningRules.substring(0, 200)}...`);
      console.log();
    });
  }

  await prisma.$disconnect();
}

main().catch(console.error);
