import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { client } from "@/lib/sanity";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teams = await client.fetch<{ _id: string; name: string }[]>(
    `*[_type == "team"] | order(order asc) { _id, name }`,
    {}
  );

  return NextResponse.json(teams);
}
