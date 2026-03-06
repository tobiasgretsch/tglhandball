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
    teams?: { _id: string; name: string }[];
  } | null>(
    `*[_type == "spielerProfil" && clerkUserId == $id][0] {
      _id, name, email, position, number,
      teams[]->{ _id, name }
    }`,
    { id: userId }
  );

  if (!profile) return NextResponse.json({ profile: null, plans: [], archivePlans: [] });

  const teamIds = profile.teams?.map((t) => t._id) ?? [];
  const today = new Date().toISOString().slice(0, 10);

  const assignmentFilter = `(
    $profileId in assignedToPlayers[]._ref
    || assignedToTeam._ref in $teamIds
  )`;

  // Active plans — validity window includes today (or no window set).
  const plans = await client.fetch(
    `*[_type == "trainingsplan" && ${assignmentFilter}
      && (!defined(validFrom) || validFrom <= $today)
      && (!defined(validUntil) || validUntil >= $today)
    ] | order(date desc) {
      _id, title, description, date, validFrom, validUntil,
      assignedToTeam->{ _id, name },
      pdfFile { asset->{ url, originalFilename } }
    }`,
    { profileId: profile._id, teamIds, today }
  );

  // Archive plans — explicitly expired or not yet started.
  const archivePlans = await client.fetch(
    `*[_type == "trainingsplan" && ${assignmentFilter}
      && (
        (defined(validUntil) && validUntil < $today)
        || (defined(validFrom) && validFrom > $today)
      )
    ] | order(date desc) {
      _id, title, description, validFrom, validUntil
    }`,
    { profileId: profile._id, teamIds, today }
  );

  return NextResponse.json({ profile, plans, archivePlans });
}
