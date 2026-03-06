import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { writeClient } from "@/lib/sanity-write";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  if (user?.publicMetadata?.role !== "trainer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Ownership check — only the trainer who created the player may edit their profile data.
  const existingPlayer = await writeClient.fetch<{
    trainerClerkUserId?: string;
    teams?: Array<{ _ref: string }>;
  } | null>(
    `*[_type == "spielerProfil" && (_id == $id || _id == $draftId)][0]{
      trainerClerkUserId, teams[]{ _ref }
    }`,
    { id, draftId: `drafts.${id}` }
  );

  if (!existingPlayer || existingPlayer.trainerClerkUserId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, email, position, number, teamIds } = await req.json();
  const requestedTeamIds: string[] = Array.isArray(teamIds) ? teamIds : [];

  // Fetch all teams this trainer manages so we only touch their own assignments.
  const trainerTeamIds = await writeClient.fetch<string[]>(
    `*[_type == "team" && trainer->clerkUserId == $id]._id`,
    { id: userId }
  );

  // Preserve team assignments from other trainers.
  const otherTrainerTeams = (existingPlayer.teams ?? [])
    .filter((t) => !trainerTeamIds.includes(t._ref))
    .map((t) => ({ _type: "reference" as const, _ref: t._ref, _key: t._ref }));

  // Apply this trainer's desired team assignments (safety: only their own teams).
  const thisTrainerTeams = requestedTeamIds
    .filter((tid) => trainerTeamIds.includes(tid))
    .map((tid) => ({ _type: "reference" as const, _ref: tid, _key: tid }));

  const allTeams = [...otherTrainerTeams, ...thisTrainerTeams];

  let p = writeClient.patch(id).set({
    name,
    email: email ?? "",
    position: position ?? "",
  });

  // Explicitly unset number when cleared so the old value isn't preserved.
  if (number != null) {
    p = p.set({ number });
  } else {
    p = p.unset(["number"]);
  }

  if (allTeams.length > 0) {
    p = p.set({ teams: allTeams });
  } else {
    p = p.unset(["teams"]);
  }

  const result = await p.commit();
  return NextResponse.json(result);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  if (user?.publicMetadata?.role !== "trainer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Ownership check — only the creating trainer may delete the profile.
  const existing = await writeClient.fetch<{ trainerClerkUserId?: string } | null>(
    `*[_type == "spielerProfil" && (_id == $id || _id == $draftId)][0]{ trainerClerkUserId }`,
    { id, draftId: `drafts.${id}` }
  );

  if (!existing) {
    return NextResponse.json({ error: "Spieler nicht gefunden" }, { status: 404 });
  }
  if (existing.trainerClerkUserId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await Promise.allSettled([
      writeClient.delete(id),
      writeClient.delete(`drafts.${id}`),
    ]);
  } catch (err) {
    console.error("Sanity delete error:", err);
    return NextResponse.json({ error: "Löschen fehlgeschlagen" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
