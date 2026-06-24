import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:3001';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const liters = searchParams.get('liters');
    const fuelType = searchParams.get('fuelType');

    const params = new URLSearchParams();
    if (liters) params.set('liters', liters);
    if (fuelType) params.set('fuelType', fuelType);

    const response = await fetch(
      `${BACKEND_URL}/api/v1/oracle/calculate?${params}`,
      { cache: 'no-store' },
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { success: false, error: error.error || 'Calculation failed' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
