import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { linkId: string } }) {
  // TODO: Implement get donation link details logic
  return NextResponse.json({ message: `Get donation link ${params.linkId} details` });
}
