import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'canon123';
const BACKUP_PASSWORDS = ['canon123', 'xplegend23', 'canon'];

const VRAK_USER = {
  username: 'Vrak_23',
  displayName: 'Vrak23',
  email: 'rodrigodanielllanos2@gmail.com',
  bio: 'Curador y Fundador en Tune Tracker y Molva.',
  avatarUrl: '',
  spotifyUrl: 'https://open.spotify.com',
  lastfmUrl: 'https://www.last.fm/user/Vrak_23',
};

export async function POST(req: NextRequest) {
  try {
    const { password, identifier } = await req.json();

    if (!password) {
      return NextResponse.json(
        { error: 'La contraseña de curador es obligatoria.' },
        { status: 400 }
      );
    }

    const inputPass = String(password).trim();
    const isValid = inputPass === ADMIN_PASSWORD || BACKUP_PASSWORDS.includes(inputPass);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Contraseña de curador incorrecta.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Sesión de curador iniciada.',
      user: VRAK_USER,
    });

    response.cookies.set('canon_admin_auth', JSON.stringify(VRAK_USER), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 14, // 14 días
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Error al procesar la autenticación.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const authCookie = req.cookies.get('canon_admin_auth');
  if (authCookie?.value) {
    try {
      const user = JSON.parse(authCookie.value);
      return NextResponse.json({ authenticated: true, user });
    } catch {
      return NextResponse.json({ authenticated: true, user: VRAK_USER });
    }
  }
  return NextResponse.json({ authenticated: false });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Sesión de curador cerrada.' });
  response.cookies.delete('canon_admin_auth');
  return response;
}
