import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.trim().length < 3) {
    return NextResponse.json([]);
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=5&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'ExpressDeliveryApp/1.0 (contact@expressdelivery.com)',
          'Accept-Language': 'pt-BR,pt;q=0.9',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json([], { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro na API de geocode:', error);
    return NextResponse.json({ error: 'Erro ao buscar endereço' }, { status: 500 });
  }
}