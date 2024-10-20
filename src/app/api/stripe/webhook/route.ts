import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // TODO: Implement Stripe webhook logic
  return NextResponse.json({ message: "Stripe webhook endpoint" });
}
