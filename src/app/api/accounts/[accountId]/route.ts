import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { accountId: string } }) {
  // TODO: Implement get account details logic
  return NextResponse.json({ message: `Get account ${params.accountId} details` });
}

export async function PUT(req: Request, { params }: { params: { accountId: string } }) {
  // TODO: Implement update account logic
  return NextResponse.json({ message: `Update account ${params.accountId}` });
}
