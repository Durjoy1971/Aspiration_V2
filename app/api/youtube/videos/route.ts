import { NextRequest, NextResponse } from 'next/server';

// Fallback video details if no API key is defined or during test executions
const MOCK_VIDEOS = [
  {
    id: 'dQw4w9WgXcQ',
    title: 'Learn TypeScript in 10 Minutes',
    description: 'A complete beginner guide to TypeScript structural types.',
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    duration: 'PT10M0S',
    publishedAt: '2026-05-19T12:00:00Z',
  }
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get('ids');

  if (!idsParam) {
    return NextResponse.json({ error: 'Missing video IDs parameter' }, { status: 400 });
  }

  const videoIds = idsParam.split(',').map(id => id.trim()).filter(Boolean);

  if (videoIds.length === 0) {
    return NextResponse.json([]);
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  // Fallback dev mode check - return mock data if no API key
  if (!apiKey) {
    console.warn('YOUTUBE_API_KEY environment variable is not defined. Using mock YouTube video details.');
    const matchedMocks = MOCK_VIDEOS.filter(v => videoIds.includes(v.id));
    // If we request a specific mock ID not matching 'dQw4w9WgXcQ', make a dummy response rather than empty
    if (matchedMocks.length === 0) {
      return NextResponse.json(videoIds.map((id, index) => ({
        id,
        title: `Curated Video Tutorial ${index + 1}`,
        description: `This is a premium curated learning resource for YouTube video ID ${id}.`,
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        duration: 'PT12M30S',
        publishedAt: new Date().toISOString(),
      })));
    }
    return NextResponse.json(matchedMocks);
  }

  try {
    // Fetch real data from YouTube API
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds.join(',')}&key=${apiKey}`;
    const detailsRes = await fetch(detailsUrl);

    if (!detailsRes.ok) {
      console.error(`YouTube API returned status ${detailsRes.status}`);
      return NextResponse.json({ error: `YouTube API error: ${detailsRes.status}` }, { status: 502 });
    }

    const detailsData = await detailsRes.json();
    const results: any[] = [];

    for (const item of detailsData.items || []) {
      const duration = item.contentDetails?.duration || 'PT0M0S';
      const snippet = item.snippet || {};

      const normalizedVideo = {
        id: item.id,
        title: snippet.title || 'Untitled Video',
        description: snippet.description || '',
        thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
        duration,
        publishedAt: snippet.publishedAt || new Date().toISOString(),
      };

      results.push(normalizedVideo);
    }

    // Sort output array to match the requested input ID order perfectly
    const orderedResults = videoIds.map(id => results.find(v => v.id === id)).filter(Boolean);

    return NextResponse.json(orderedResults);
  } catch (error) {
    console.error('Failed to fetch YouTube videos:', error);
    return NextResponse.json({ error: 'Failed to fetch video details from YouTube' }, { status: 500 });
  }
}
