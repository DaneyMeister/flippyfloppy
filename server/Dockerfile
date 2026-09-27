# FlippyFloppy API. Used by ../compose.yml; can also be built on its own.
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

ENV NODE_ENV=production
EXPOSE 4000

# Create/upgrade the tables, optionally load the invented sample data, then start.
# tsx runs the TypeScript directly, so the .sql files next to the scripts are found.
CMD ["sh", "-c", "npx tsx src/db/migrate.ts && if [ \"$SEED_ON_START\" = \"true\" ]; then npx tsx src/db/seed.ts; fi && npx tsx src/index.ts"]
