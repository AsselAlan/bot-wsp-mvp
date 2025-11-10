import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/bot/orders/test
 * Endpoint de diagnóstico para verificar la conexión y permisos
 */
export async function GET(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    tests: [],
  };

  try {
    // Test 1: Environment variables
    diagnostics.tests.push({
      name: 'Environment Variables',
      passed: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      details: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
    });

    // Test 2: Create Supabase client
    let supabase;
    try {
      supabase = await createClient();
      diagnostics.tests.push({
        name: 'Create Supabase Client',
        passed: true,
      });
    } catch (error: any) {
      diagnostics.tests.push({
        name: 'Create Supabase Client',
        passed: false,
        error: error.message,
      });
      return NextResponse.json(diagnostics, { status: 500 });
    }

    // Test 3: Get User
    let user;
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      diagnostics.tests.push({
        name: 'Authentication',
        passed: !authError && !!authUser,
        details: {
          userId: authUser?.id || null,
          error: authError?.message || null,
        },
      });

      if (!authUser) {
        return NextResponse.json(diagnostics, { status: 200 });
      }

      user = authUser;
    } catch (error: any) {
      diagnostics.tests.push({
        name: 'Authentication',
        passed: false,
        error: error.message,
      });
      return NextResponse.json(diagnostics, { status: 500 });
    }

    // Test 4: Query orders table
    try {
      const { data, error, count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      diagnostics.tests.push({
        name: 'Query Orders Table',
        passed: !error,
        details: {
          count: count || 0,
          error: error?.message || null,
          errorCode: error?.code || null,
          errorDetails: error?.details || null,
        },
      });
    } catch (error: any) {
      diagnostics.tests.push({
        name: 'Query Orders Table',
        passed: false,
        error: error.message,
      });
    }

    return NextResponse.json(diagnostics, { status: 200 });

  } catch (error: any) {
    diagnostics.tests.push({
      name: 'General Error',
      passed: false,
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(diagnostics, { status: 500 });
  }
}
