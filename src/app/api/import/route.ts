import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    success: false,
    error: 'La importación externa manual ha sido deshabilitada. Molva ahora sincroniza directamente con la base de datos de Tune Tracker.'
  }, { status: 410 });
}
