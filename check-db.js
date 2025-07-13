const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPlayers() {
  try {
    const players = await prisma.player.findMany({
      include: {
        team: true,
        plateAppearances: true,
      },
      take: 20,
    });

    console.log('Players in database:');
    players.forEach(player => {
      console.log(`ID: ${player.id}, Name: "${player.name}", Canonical: "${player.canonical}", Team: "${player.team?.name}", PA Count: ${player.plateAppearances.length}`);
    });

    console.log('\nTotal players:', players.length);

    // Check plate appearances
    const plateAppearances = await prisma.plateAppearance.findMany({
      include: {
        player: true,
      },
      take: 10,
    });

    console.log('\nPlate Appearances in database:');
    plateAppearances.forEach(pa => {
      console.log(`ID: ${pa.id}, Player: "${pa.player.name}", Result: "${pa.result}"`);
    });

    console.log('\nTotal plate appearances:', plateAppearances.length);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlayers(); 