const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('Checking database...')
    
    const teams = await prisma.team.findMany()
    console.log('Teams:', teams.length)
    teams.forEach(team => console.log(`- ${team.name} (ID: ${team.id})`))
    
    const players = await prisma.player.findMany({
      include: {
        team: true,
        plateAppearances: true
      }
    })
    console.log('\nPlayers:', players.length)
    players.forEach(player => {
      console.log(`- ${player.name} (Team: ${player.team?.name || 'None'}, PAs: ${player.plateAppearances.length})`)
    })
    
    const plateAppearances = await prisma.plateAppearance.findMany()
    console.log('\nPlate Appearances:', plateAppearances.length)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase() 