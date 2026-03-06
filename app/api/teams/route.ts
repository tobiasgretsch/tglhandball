import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { client } from "@/lib/sanity";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  const role = user?.publicMetadata?.role;

  // Trainers only see teams they are assigned to.
  // Other authenticated roles (e.g. admin) see all teams.
  const teams = await client.fetch<{ _id: string; name: string }[]>(
    role === "trainer"
      ? `*[_type == "team" && trainer->clerkUserId == $id] | order(order asc) { _id, name }`
      : `*[_type == "team"] | order(order asc) { _id, name }`,
    { id: userId }
  );

  return NextResponse.json(teams);
}
