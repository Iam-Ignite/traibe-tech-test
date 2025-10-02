import { json } from "@remix-run/node";

export async function loader() {
  try {
    const { prisma } = await import("~/lib/db.server");
    
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return json({
      status: "ok",
      database: "connected",
      prisma: "working",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return json({
      status: "error",
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
