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

  let p = writeClient.patch(id).set({ title, description, date });

  if (teamId) {
    p = p.set({ assignedToTeam: { _type: "reference", _ref: teamId } });
  } else {
    p = p.unset(["assignedToTeam"]);
  }

  if (Array.isArray(playerIds) && playerIds.length > 0) {
    p = p.set({
      assignedToPlayers: playerIds.map((pid: string) => ({
        _type: "reference",
        _ref: pid,
        _key: pid,
      })),
    });
  } else {
    p = p.unset(["assignedToPlayers"]);
  }

  if (pdfAssetId) {
    p = p.set({
      pdfFile: { _type: "file", asset: { _type: "reference", _ref: pdfAssetId } },
    });
  }
  // Note: we intentionally never unset pdfFile on edit so existing PDFs are preserved
  // unless a new one is uploaded (pdfAssetId will replace it above).

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
  await writeClient.delete(id);
  return NextResponse.json({ success: true });
}
