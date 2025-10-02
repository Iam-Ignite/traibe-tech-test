import { redirect } from "@remix-run/node";
import { createSupabaseServerClient } from "./supabase.server";
import { prisma } from "./db.server";

export async function requireAuth(request: Request) {
  const { supabase } = createSupabaseServerClient(request);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw redirect("/login");
  }

  // Get or create user in our database
  let user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        id: session.user.id,
        email: session.user.email!,
      },
    });
  }

  return { user, session };
}

export async function getUser(request: Request) {
  const { supabase } = createSupabaseServerClient(request);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  return user;
}
