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

  // Return players who belong to at least one of this trainer's teams,
  // OR were created by this trainer and have no team assignment yet.
  // Removes the legacy broad condition that leaked cross-team visibility.
  const players = await writeClient.fetch(
    `*[_type == "spielerProfil"
        && (
          count(teams[_ref in *[_type == "trainerProfil" && clerkUserId == $id][0].teams[]._ref]) > 0
          || (trainerClerkUserId == $id && count(teams) == 0)
        )
        && !(_id in path("drafts.**"))
      ] | order(name asc) {
        _id, name, email, position, number, clerkUserId,
        teams[]->{ _id, name }
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

  const { name, email, position, number, teamIds } = await req.json();
  const normalizedTeamIds: string[] = Array.isArray(teamIds) ? teamIds : [];

  // Upsert by email: if a profile with this email already exists, just add the new teams.
  if (email) {
    const existing = await writeClient.fetch<{
      _id: string;
      teams?: Array<{ _ref: string }>;
    } | null>(
      `*[_type == "spielerProfil" && email == $email && !(_id in path("drafts.**"))][0]{
        _id, teams[]{ _ref }
      }`,
      { email }
    );

    if (existing) {
      const currentRefs = (existing.teams ?? []).map((t) => t._ref);
      const newTeams = normalizedTeamIds
        .filter((tid) => !currentRefs.includes(tid))
        .map((tid) => ({ _type: "reference" as const, _ref: tid, _key: tid }));

      if (newTeams.length > 0) {
        await writeClient
          .patch(existing._id)
          .setIfMissing({ teams: [] })
          .append("teams", newTeams)
          .commit();
      }

      const updated = await writeClient.fetch(
        `*[_type == "spielerProfil" && _id == $id][0]{
          _id, name, email, position, number, clerkUserId,
          teams[]->{ _id, name }
        }`,
        { id: existing._id }
      );
      return NextResponse.json({ ...updated, _merged: true });
    }
  }

  // No existing profile — create a new one.
  const doc = {
    _type: "spielerProfil" as const,
    name,
    email: email ?? "",
    position: position ?? "",
    number: number ?? null,
    trainerClerkUserId: userId,
    ...(normalizedTeamIds.length > 0
      ? {
          teams: normalizedTeamIds.map((tid) => ({
            _type: "reference" as const,
            _ref: tid,
            _key: tid,
          })),
        }
      : {}),
  };

  let result;
  try {
    result = await writeClient.create(doc);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    console.error("Sanity create error:", msg);
    return NextResponse.json({ error: "Spieler konnte nicht erstellt werden." }, { status: 500 });
  }

  // Send Clerk invitation if the player has an email address.
  if (email) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const clerk = await clerkClient();
    await clerk.invitations
      .createInvitation({
        emailAddress: email,
        publicMetadata: { role: "spieler" },
        redirectUrl: `${appUrl}/sign-up`,
        ignoreExisting: true,
      })
      .catch((err) => {
        console.error("Clerk invitation failed:", err);
      });
  }

  return NextResponse.json(result);
}
