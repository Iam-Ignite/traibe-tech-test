import { json } from "@remix-run/node";
import { prisma } from "~/lib/db.server";

export async function loader() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    return json({
      status: "ok",
      database: "connected",
      prisma: "working",
      env: process.env.DATABASE_URL ? "DATABASE_URL is set" : "DATABASE_URL is missing",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return json({
      status: "error",
      error: error.message,
      stack: error.stack,
      env: process.env.DATABASE_URL ? "DATABASE_URL is set" : "DATABASE_URL is missing",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
