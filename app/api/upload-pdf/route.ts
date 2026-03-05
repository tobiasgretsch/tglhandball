import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { writeClient } from "@/lib/sanity-write";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  if (user?.publicMetadata?.role !== "trainer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const asset = await writeClient.assets.upload("file", buffer, {
    filename: file.name,
    contentType: "application/pdf",
  });

  return NextResponse.json({ assetId: asset._id, url: asset.url });
}
