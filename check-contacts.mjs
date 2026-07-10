import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkContacts() {
  try {
    const allContacts = await prisma.contact.findMany({
      select: { account: true, name: true }
    });

    console.log('\nAll contacts:');
    allContacts.forEach(c => console.log(`  ${c.account} - ${c.name}`));

    const patchellContacts = allContacts.filter(c =>
      c.name.toLowerCase().includes('patchell') ||
      c.account.toLowerCase().includes('patchell')
    );

    if (patchellContacts.length > 0) {
      console.log('\nPatchell contacts found:');
      patchellContacts.forEach(c => console.log(`  ${c.account} - ${c.name}`));
    } else {
      console.log('\nNo Patchell contacts found');
    }

    const poRules = await prisma.poRule.findMany({
      select: { contactAccount: true, ruleType: true, priority: true }
    });

    console.log(`\nPO Rules in database: ${poRules.length}`);
    if (poRules.length > 0) {
      poRules.forEach(r => console.log(`  ${r.contactAccount} - ${r.ruleType} (p${r.priority})`));
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkContacts();
