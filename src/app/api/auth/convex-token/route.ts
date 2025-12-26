import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

export async function GET() {
  try {
    const session = await auth0.getSession();
    
    if (!session?.tokenSet?.idToken) {
      return NextResponse.json({ token: null }, { status: 401 });
    }

    return NextResponse.json({ token: session.tokenSet.idToken });
  } catch {
    return NextResponse.json({ token: null }, { status: 401 });
  }
}
