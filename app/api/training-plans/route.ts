import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { writeClient } from "@/lib/sanity-write";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  if (user?.publicMetadata?.role !== "trainer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const plans = await writeClient.fetch(
    `*[_type == "trainingsplan" && trainerClerkUserId == $id && !(_id in path("drafts.**"))] | order(date desc) {
      _id, title, description, date, validFrom, validUntil,
      assignedToTeam->{ _id, name },
      assignedToPlayers[]->{ _id, name },
      pdfFile { asset->{ _id, url, originalFilename } }
    }`,
    { id: userId }
  );

  return NextResponse.json(plans);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  if (user?.publicMetadata?.role !== "trainer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, description, date, validFrom, validUntil, teamId, playerIds, pdfAssetId } =
    await req.json();

  const doc = {
    _type: "trainingsplan" as const,
    title,
    description: description ?? "",
    date: date ?? new Date().toISOString(),
    trainerClerkUserId: userId,
    ...(validFrom ? { validFrom } : {}),
    ...(validUntil ? { validUntil } : {}),
    ...(teamId ? { assignedToTeam: { _type: "reference" as const, _ref: teamId } } : {}),
    ...(Array.isArray(playerIds) && playerIds.length > 0
      ? {
          assignedToPlayers: playerIds.map((pid: string) => ({
            _type: "reference" as const,
            _ref: pid,
            _key: pid,
          })),
        }
      : {}),
    ...(pdfAssetId
      ? { pdfFile: { _type: "file" as const, asset: { _type: "reference" as const, _ref: pdfAssetId } } }
      : {}),
  };

  const result = await writeClient.create(doc);
  return NextResponse.json(result);
}
