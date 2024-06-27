import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';

// importing MONGOHQ_URL so we can mock it in testing.
import { MONGOHQ_URL } from '../utils/env';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: ReturnType<typeof getExtendedClient>;
  }
}

const prismaPlugin: FastifyPluginAsync = fp(async (server, _options) => {
  const prisma = getExtendedClient();

  await prisma.$connect();

  server.decorate('prisma', prisma);

  server.addHook('onClose', async server => {
    await server.prisma.$disconnect();
  });
});

// TODO: It would be nice to split this up into multiple update functions,
//       but the types are a pain.
// TODO: Multiple extended clients can be used for different restrictions (e.g. session vs non-session users)
// TODO: Could be used to add other _easily forgotten_ fields like `progressTimestamp`
function getExtendedClient() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: MONGOHQ_URL
      }
    }
  }).$extends({
    query: {
      user: {
        async update({ args, query }) {
          args.data.lastUpdated = Date.now();
          return query(args);
        },
        async updateMany({ args, query }) {
          args.data.lastUpdated = Date.now();
          return query(args);
        },
        async upsert({ args, query }) {
          const lastUpdated = Date.now();
          args.update.lastUpdated = lastUpdated;
          args.create.lastUpdated = lastUpdated;
          return query(args);
        },
        async create({ args, query }) {
          args.data.lastUpdated = Date.now();
          return query(args);
        },
        async createMany({ args, query }) {
          const data = args.data;
          const lastUpdated = Date.now();
          if (Array.isArray(data)) {
            data.forEach(data => {
              data.lastUpdated = lastUpdated;
            });
          } else {
            data.lastUpdated = lastUpdated;
          }

          return query(args);
        }
        // NOTE: raw ops are untouched, as it is meant to be a direct passthrough to mongodb
        // async findRaw({ model, operation, args, query }) {}
        // async aggregateRaw({ model, operation, args, query }) {}
      }
    }
  });

  return prisma;
}

export default prismaPlugin;
