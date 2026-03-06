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
  const { title, description, date, teamId, playerIds, pdfAssetId } = await req.json();

  try {
    // Build the full set payload and unset list in one pass to avoid
    // multiple chained .set() calls potentially overwriting each other.
    const setFields: Record<string, unknown> = { title, description, date };
    const unsetFields: string[] = [];

    if (teamId) {
      setFields.assignedToTeam = { _type: "reference", _ref: teamId };
      unsetFields.push("assignedToPlayers");
    } else {
      unsetFields.push("assignedToTeam");
      if (Array.isArray(playerIds) && playerIds.length > 0) {
        setFields.assignedToPlayers = playerIds.map((pid: string) => ({
          _type: "reference",
          _ref: pid,
          _key: pid,
        }));
      } else {
        unsetFields.push("assignedToPlayers");
      }
    }

    if (pdfAssetId) {
      // Note: pdfFile is only updated when a new asset is uploaded.
      // The existing PDF is preserved otherwise (never unset here).
      setFields.pdfFile = { _type: "file", asset: { _type: "reference", _ref: pdfAssetId } };
    }

    let p = writeClient.patch(id).set(setFields);
    if (unsetFields.length > 0) {
      p = p.unset(unsetFields);
    }

    const result = await p.commit();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[PATCH /api/training-plans]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Speichern fehlgeschlagen" },
      { status: 500 }
    );
  }
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
  await writeClient.delete(id);
  return NextResponse.json({ success: true });
}
