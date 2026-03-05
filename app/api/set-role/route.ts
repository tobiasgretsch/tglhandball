import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role } = await req.json();
  if (role !== "trainer" && role !== "spieler") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: { role },
  });

  return NextResponse.json({ success: true });
}
