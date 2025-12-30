import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { function: functionName, args } = await request.json();
    
    // Execute Convex mutation
    const result = await convex.mutation(functionName as any, args);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Convex mutation failed:', error);
    return NextResponse.json({ error: 'Mutation failed' }, { status: 500 });
  }
}
