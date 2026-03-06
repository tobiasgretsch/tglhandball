import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { writeClient } from "@/lib/sanity-write";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  if (user?.publicMetadata?.role !== "trainer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Show players created by this trainer OR belonging to a team managed by this trainer.
  // The OR handles both the legacy ownership model and the new team-based model.
  const players = await writeClient.fetch(
    `*[_type == "spielerProfil"
        && (trainerClerkUserId == $id || team->trainerClerkUserId == $id)
        && !(_id in path("drafts.**"))
      ] | order(name asc) {
        _id, name, email, position, number, clerkUserId,
        team->{ _id, name }
      }`,
    { id: userId }
  );

  return NextResponse.json(players);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  if (user?.publicMetadata?.role !== "trainer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, email, position, number, teamId } = await req.json();

  const doc = {
    _type: "spielerProfil" as const,
    name,
    email: email ?? "",
    position: position ?? "",
    number: number ?? null,
    trainerClerkUserId: userId,
    ...(teamId ? { team: { _type: "reference" as const, _ref: teamId } } : {}),
  };

  let result;
  try {
    result = await writeClient.create(doc);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    console.error("Sanity create error:", msg);
    return NextResponse.json({ error: `Spieler konnte nicht erstellt werden: ${msg}` }, { status: 500 });
  }

  // Send Clerk invitation if the player has an email address.
  if (email) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const clerk = await clerkClient();
    await clerk.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: { role: "spieler" },
      redirectUrl: `${appUrl}/sign-up`,
      ignoreExisting: true,
    }).catch((err) => {
      console.error("Clerk invitation failed:", err);
    });
  }

  return NextResponse.json(result);
}
