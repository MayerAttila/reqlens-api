import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../node_modules/.prisma/client/index.js";
import { env } from "./env.js";

const adapter = new PrismaPg({ connectionString: env.databaseUrl });

export const prisma = new PrismaClient({ adapter });
