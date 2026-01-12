import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { auth0 } from '@/lib/auth0';
import { z } from 'zod';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Whitelist of allowed mutation functions
const ALLOWED_MUTATIONS = new Set([
  'posts:create',
  'posts:update',
  'posts:delete',
  'bookmarks:toggle',
  'subscribers:add',
]);

// Error codes for client-side handling
enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_FUNCTION = 'INVALID_FUNCTION',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

// Zod schema for mutation request
const mutationRequestSchema = z.object({
  function: z.string().min(1).max(100),
  args: z.record(z.string(), z.any()),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: ErrorCode.UNAUTHORIZED },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = mutationRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request format', code: ErrorCode.VALIDATION_ERROR },
        { status: 400 }
      );
    }

    const { function: functionName, args } = validation.data;

    // Check if function is whitelisted
    if (!ALLOWED_MUTATIONS.has(functionName)) {
      return NextResponse.json(
        { error: 'Function not allowed', code: ErrorCode.FORBIDDEN },
        { status: 403 }
      );
    }

    // Execute Convex mutation
    const result = await convex.mutation(functionName as any, args);
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    // Log detailed error server-side only
    console.error('[Mutation Error]', error);
    
    // Return generic error to client
    return NextResponse.json(
      { error: 'Operation failed', code: ErrorCode.INTERNAL_ERROR },
      { status: 500 }
    );
  }
}
