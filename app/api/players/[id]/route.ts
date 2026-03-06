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

  // Ownership check — trainer may only edit players they created
  const existing = await writeClient.fetch<{ trainerClerkUserId?: string } | null>(
    `*[_type == "spielerProfil" && (_id == $id || _id == $draftId)][0]{ trainerClerkUserId }`,
    { id, draftId: `drafts.${id}` }
  );
  if (!existing || existing.trainerClerkUserId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, email, position, number, teamId } = await req.json();

  let p = writeClient.patch(id).set({
    name,
    email: email ?? "",
    position: position ?? "",
  });

  // Explicitly unset number when cleared so the old value isn't preserved
  if (number != null) {
    p = p.set({ number });
  } else {
    p = p.unset(["number"]);
  }

  if (teamId) {
    p = p.set({ team: { _type: "reference", _ref: teamId } });
  } else {
    p = p.unset(["team"]);
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

  // Ownership check — query both published and draft versions
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
    // Delete both published and draft versions so nothing is left behind
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
