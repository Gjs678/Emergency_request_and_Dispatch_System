const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { redisClient } = require('./config/redis');
const logger = require('./utils/logger');

const defaultResponders = [
  {
    name: '108 Ambulance - KMC Hospital',
    type: 'AMBULANCE',
    status: 'AVAILABLE',
    lat: 12.8718,
    lng: 74.8430,
  },
  {
    name: 'Kadri Fire & Rescue Engine',
    type: 'FIRE_ENGINE',
    status: 'AVAILABLE',
    lat: 12.8858,
    lng: 74.8572,
  },
  {
    name: 'Pandeshwar PCR Van (112)',
    type: 'POLICE_UNIT',
    status: 'AVAILABLE',
    lat: 12.8597,
    lng: 74.8385,
  },
  {
    name: 'Barkhe Police Control Vehicle',
    type: 'POLICE_UNIT',
    status: 'AVAILABLE',
    lat: 12.8750,
    lng: 74.8400,
  },
  {
    name: 'Wenlock Emergency Ambulance',
    type: 'AMBULANCE',
    status: 'AVAILABLE',
    lat: 12.8660,
    lng: 74.8420,
  },
];

const sampleIncidents = [
  {
    userId: 'DISPATCHER-112',
    description: 'Vehicle collision near Hampankatta Circle, multiple victims injured',
    priorityScore: 5,
    riskFactors: ['TRAFFIC_ACCIDENT', 'MULTIPLE_INJURIES', 'HIGH_URGENCY'],
    status: 'PENDING',
    lat: 12.8700,
    lng: 74.8420,
  },
];

async function main() {
  try {
    logger.info('Starting Emergency System DB & Redis seeding...');

    // Clear existing records
    await prisma.dispatchLog.deleteMany({});
    await prisma.emergencyRequest.deleteMany({});
    await prisma.responder.deleteMany({});

    // Seed Responders
    for (const responder of defaultResponders) {
      const created = await prisma.responder.create({
        data: responder,
      });
      logger.info(`Seeded responder: ${created.name}`);
    }

    // Seed Sample Incidents & Push to Redis Sorted Set
    for (const incidentData of sampleIncidents) {
      const incident = await prisma.emergencyRequest.create({
        data: incidentData,
      });

      await redisClient.zadd(
        'emergency:priority_queue',
        incident.priorityScore,
        JSON.stringify({
          id: incident.id,
          description: incident.description,
          priority_score: incident.priorityScore,
          lat: incident.lat,
          lng: incident.lng,
          created_at: incident.createdAt,
        })
      );
    }

    logger.info('Database & Redis seeding complete for Mangalore Region.');
  } catch (error) {
    logger.error(`Seed failed: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

main();