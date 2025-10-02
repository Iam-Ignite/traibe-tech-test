import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db.server";

export async function action({ params }: ActionFunctionArgs) {
  await prisma.article.delete({
    where: { id: params.id },
  });

  return redirect("/");
}
