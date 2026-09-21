import { NextRequest, NextResponse } from 'next/server';

// Cuenta Ficticia Pre-registrada para Demostración
const DEMO_ACCOUNTS = [
  {
    username: 'alexander_vance',
    displayName: 'Alexander Vance',
    email: 'alexander@canon.music',
    password: 'canon123',
    bio: 'Curador sonoro enfocado en ambient, texturas analógicas, post-punk y jazz modal.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
    spotifyUrl: 'https://open.spotify.com',
  },
  {
    username: 'elena_sound',
    displayName: 'Elena Rostova',
    email: 'elena@canon.music',
    password: 'canon123',
    bio: 'Exploradora de paisajes sonoros nórdicos y electrónica experimental.',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400&auto=format&fit=crop',
    spotifyUrl: 'https://open.spotify.com',
  }
];

export async function POST(req: NextRequest) {
  try {
    const { identifier, password, action } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'El usuario/correo y la contraseña son obligatorios.' },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // 1. Caso de Registro Nuevo
    if (action === 'register') {
      const username = cleanIdentifier.includes('@') ? cleanIdentifier.split('@')[0] : cleanIdentifier;
      const userObj = {
        username: username,
        displayName: username,
        email: cleanIdentifier.includes('@') ? cleanIdentifier : `${cleanIdentifier}@canon.music`,
        bio: 'Curador en Molva.',
      };

      const response = NextResponse.json({
        success: true,
        message: 'Cuenta creada y sesión iniciada.',
        user: userObj,
      });

      response.cookies.set('canon_admin_auth', JSON.stringify(userObj), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      return response;
    }

    // 2. Verificar cuenta ficticia demo
    const demoFound = DEMO_ACCOUNTS.find(
      acc => (acc.username.toLowerCase() === cleanIdentifier || acc.email.toLowerCase() === cleanIdentifier) &&
             acc.password === password
    );

    if (demoFound) {
      const userObj = {
        username: demoFound.username,
        displayName: demoFound.displayName,
        email: demoFound.email,
        bio: demoFound.bio,
        avatarUrl: demoFound.avatarUrl,
        spotifyUrl: demoFound.spotifyUrl,
      };

      const response = NextResponse.json({
        success: true,
        message: 'Inicio de sesión correcto.',
        user: userObj,
      });

      response.cookies.set('canon_admin_auth', JSON.stringify(userObj), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      return response;
    }

    // 3. Aceptar cualquier usuario con contraseña válida (mínimo 4 caracteres)
    if (password.length >= 4) {
      const username = cleanIdentifier.includes('@') ? cleanIdentifier.split('@')[0] : cleanIdentifier;
      const userObj = {
        username: username,
        displayName: username,
        email: cleanIdentifier.includes('@') ? cleanIdentifier : `${cleanIdentifier}@canon.music`,
      };

      const response = NextResponse.json({
        success: true,
        message: 'Inicio de sesión correcto.',
        user: userObj,
      });

      response.cookies.set('canon_admin_auth', JSON.stringify(userObj), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      return response;
    }

    return NextResponse.json({ error: 'Credenciales inválidas.' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Error al procesar la solicitud.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const authCookie = req.cookies.get('canon_admin_auth');
  if (authCookie?.value) {
    try {
      const user = JSON.parse(authCookie.value);
      return NextResponse.json({ authenticated: true, user });
    } catch {
      return NextResponse.json({ authenticated: true, user: { username: 'alexander_vance' } });
    }
  }
  return NextResponse.json({ authenticated: false });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Sesión cerrada.' });
  response.cookies.delete('canon_admin_auth');
  return response;
}
