import { NextRequest, NextResponse } from 'next/server';
import { 
  getSkillQueryCache, 
  setSkillQueryCache, 
  getVideoCache, 
  setVideoCache,
  VideoMetadata 
} from '../../../lib/youtube/cacheService';

// Fallback search results if no API key is defined or during test executions
const MOCK_VIDEOS = [
  {
    id: 'dQw4w9WgXcQ',
    title: 'Learn TypeScript in 10 Minutes',
    description: 'A complete beginner guide to TypeScript structural types.',
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    duration: 'PT10M0S',
    publishedAt: '2026-05-19T12:00:00Z',
  },
  {
    id: 'y1234567890',
    title: 'Mastering Advanced Zustand State Store',
    description: 'Learn slice patterns, dynamic state selectors, and hydration guides.',
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    duration: 'PT15M33S',
    publishedAt: '2026-05-18T10:00:00Z',
  }
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const skillId = searchParams.get('skillId');

  if (!query) {
    return NextResponse.json({ error: 'Missing search query parameter' }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  // If no API key is specified (development/fallback testing mode), return mock data immediately
  if (!apiKey) {
    console.warn('YOUTUBE_API_KEY environment variable is not defined. Using mock YouTube search.');
    return NextResponse.json(MOCK_VIDEOS);
  }

  try {
    // 1. Check Skill Query Cache first if skillId is provided
    if (skillId) {
      const cachedVideoIds = await getSkillQueryCache(skillId);
      if (cachedVideoIds && cachedVideoIds.length > 0) {
        // Fetch details of all cached video IDs (checking their individual videoCache docs)
        const cachedResults: VideoMetadata[] = [];
        const missingIds: string[] = [];

        for (const id of cachedVideoIds) {
          const cachedVid = await getVideoCache(id);
          if (cachedVid) {
            cachedResults.push(cachedVid);
          } else {
            missingIds.push(id);
          }
        }

        // If all documents are cached, return them directly
        if (missingIds.length === 0) {
          return NextResponse.json(cachedResults);
        }
      }
    }

    // 2. Query YouTube Search API (Search query for list of matching video IDs)
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&maxResults=10&type=video&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    
    if (!searchRes.ok) {
      const errText = await searchRes.text();
      throw new Error(`YouTube API returned status ${searchRes.status}: ${errText}`);
    }

    const searchData = await searchRes.json();
    const videoIds: string[] = (searchData.items || [])
      .map((item: { id?: { videoId?: string } }) => item.id?.videoId)
      .filter(Boolean) as string[];

    if (videoIds.length === 0) {
      return NextResponse.json([]);
    }

    // 3. Batch fetch details for the retrieved video IDs to get exact durations
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds.join(',')}&key=${apiKey}`;
    const detailsRes = await fetch(detailsUrl);
    
    if (!detailsRes.ok) {
      throw new Error(`YouTube Videos Details API returned status ${detailsRes.status}`);
    }

    const detailsData = await detailsRes.json();
    const normalizedVideos: VideoMetadata[] = [];

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

      // Set inside our normalized videoCache doc
      const cachedItem = await setVideoCache(item.id, normalizedVideo);
      normalizedVideos.push(cachedItem);
    }

    // 4. Save Query order in skillVideoCache if skillId is provided
    if (skillId) {
      await setSkillQueryCache(skillId, videoIds);
    }

    return NextResponse.json(normalizedVideos);
  } catch (error) {
    console.error('Failed search API handler request:', error);
    // Return mock fallback data to avoid absolute site crashes if connection fails
    return NextResponse.json(MOCK_VIDEOS);
  }
}
