const prisma = require('../config/database');

const generateNumber = async (prefix) => {
  const year = new Date().getFullYear();
  const counter = await prisma.sequenceCounter.upsert({
    where: { prefix_year: { prefix, year } },
    create: { id: `${prefix}-${year}`, prefix, year, counter: 1 },
    update: { counter: { increment: 1 } },
  });

  const num = String(counter.counter).padStart(5, '0');
  return `${prefix}-${year}-${num}`;
};

module.exports = { generateNumber };
