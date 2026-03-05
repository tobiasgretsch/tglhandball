import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { writeClient } from "@/lib/sanity-write";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  if (user?.publicMetadata?.role !== "spieler") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) {
    return NextResponse.json({ error: "No email on account" }, { status: 400 });
  }

  // Find an unlinked profile matching this email
  const profile = await writeClient.fetch<{ _id: string } | null>(
    `*[_type == "spielerProfil" && email == $email && !defined(clerkUserId)][0]{ _id }`,
    { email }
  );

  if (!profile) {
    return NextResponse.json({ profile: null });
  }

  await writeClient.patch(profile._id).set({ clerkUserId: userId }).commit();
  return NextResponse.json({ profile });
}
