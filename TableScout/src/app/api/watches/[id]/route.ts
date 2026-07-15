import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserOrResponse } from "@/lib/auth";
import { tick } from "@/lib/watchEngine";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await tick();
  const auth = await requireUserOrResponse();
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await params;

  const watch = await prisma.watch.findUnique({
    where: { id, userId: user.id },
    include: {
      restaurant: true,
      notifications: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!watch) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json(watch);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUserOrResponse();
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await params;

  const watch = await prisma.watch.findUnique({ where: { id, userId: user.id } });
  if (!watch) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await prisma.notification.deleteMany({ where: { watchId: id } });
  await prisma.watch.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
