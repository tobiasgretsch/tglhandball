import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { client } from "@/lib/sanity";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  if (user?.publicMetadata?.role !== "spieler") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const profile = await client.fetch<{
    _id: string;
    name: string;
    email: string;
    position: string;
    number: number | null;
    team?: { _id: string; name: string };
  } | null>(
    `*[_type == "spielerProfil" && clerkUserId == $id][0] {
      _id, name, email, position, number,
      team->{ _id, name }
    }`,
    { id: userId }
  );

  if (!profile) return NextResponse.json({ profile: null, plans: [] });

  // Today as YYYY-MM-DD for validity window comparison
  const today = new Date().toISOString().slice(0, 10);

  // Plans assigned to this player individually OR to their whole team,
  // filtered to the active validity window (validFrom ≤ today ≤ validUntil).
  const plans = await client.fetch(
    `*[_type == "trainingsplan" && (
      $profileId in assignedToPlayers[]._ref
      || assignedToTeam._ref == $teamId
    ) && (!defined(validFrom) || validFrom <= $today)
      && (!defined(validUntil) || validUntil >= $today)
    ] | order(date desc) {
      _id, title, description, date, validFrom, validUntil,
      assignedToTeam->{ _id, name },
      pdfFile { asset->{ url, originalFilename } }
    }`,
    {
      profileId: profile._id,
      teamId: profile.team?._id ?? "",
      today,
    }
  );

  return NextResponse.json({ profile, plans });
}
