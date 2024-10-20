import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // TODO: Implement account creation logic; not sure if we need this given google auth
  return NextResponse.json({ message: "Create account endpoint" });
}
