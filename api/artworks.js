import { createClient } from '@supabase/supabase-js';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Missing Supabase configuration');
      res.status(500).json({ error: 'Supabase configuration is missing.' });
      return;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Fetch published artworks with their images and materials
    console.log('[API] Fetching published artworks...');
    const { data: artworks, error: artworksError } = await supabase
      .from('artworks')
      .select('id, title, description, created_at, slug, created_at_timestamp')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (artworksError) {
      console.error('[API] Error fetching artworks:', artworksError);
      res.status(500).json({ error: 'Failed to fetch artworks', details: artworksError.message });
      return;
    }

    console.log(`[API] Found ${artworks?.length || 0} published artworks`);

    if (!artworks || artworks.length === 0) {
      console.log('[API] No artworks found, returning empty array');
      res.status(200).json([]);
      return;
    }

    // Fetch all images for these artworks
    const artworkIds = artworks.map(a => a.id);
    console.log(`[API] Fetching images for ${artworkIds.length} artworks...`);

    const { data: images, error: imagesError } = await supabase
      .from('artwork_images')
      .select('id, artwork_id, url, is_main, sort_order')
      .in('artwork_id', artworkIds)
      .order('sort_order', { ascending: true });

    if (imagesError) {
      console.error('[API] Error fetching images:', imagesError);
      res.status(500).json({ error: 'Failed to fetch images', details: imagesError.message });
      return;
    }

    console.log(`[API] Found ${images?.length || 0} images`);

    // Fetch all materials for these artworks (joined with material_types)
    console.log('[API] Fetching materials...');
    let materials = [];
    try {
      const { data: materialsData, error: materialsError } = await supabase
        .from('artwork_materials')
        .select('artwork_id, material_types(id, name, slug)')
        .in('artwork_id', artworkIds);

      if (materialsError) {
        console.warn('[API] Warning fetching materials (continuing anyway):', materialsError);
      } else {
        materials = materialsData || [];
        console.log(`[API] Found ${materials.length} material associations`);
      }
    } catch (error) {
      console.warn('[API] Exception fetching materials (continuing anyway):', error);
    }

    // Group images by artwork_id
    const imagesMap = {};
    (images || []).forEach(img => {
      if (!imagesMap[img.artwork_id]) {
        imagesMap[img.artwork_id] = [];
      }
      imagesMap[img.artwork_id].push(img);
    });

    // Group materials by artwork_id
    const materialsMap = {};
    materials.forEach(item => {
      if (!materialsMap[item.artwork_id]) {
        materialsMap[item.artwork_id] = [];
      }
      materialsMap[item.artwork_id].push(item.material_types);
    });

    // Transform artworks to include images and materials
    const transformedArtworks = artworks.map(artwork => {
      const artworkImages = imagesMap[artwork.id] || [];
      const artworkMaterials = materialsMap[artwork.id] || [];

      // Get the main image or first image
      const mainImage = artworkImages.find(img => img.is_main) || artworkImages[0];
      const imageUrl = mainImage ? mainImage.url : null;

      // Use first material's slug as category (for UI compatibility)
      const category = artworkMaterials.length > 0 
        ? artworkMaterials[0].slug.toLowerCase()
        : 'uncategorized';

      // Extract year from created_at or timestamp
      const dateString = artwork.created_at || artwork.created_at_timestamp;
      const year = dateString ? new Date(dateString).getFullYear() : new Date().getFullYear();

      return {
        id: artwork.id,
        title: artwork.title,
        description: artwork.description,
        category,
        image: imageUrl,
        year,
        slug: artwork.slug,
        // Include full details for extended use
        images: artworkImages,
        materials: artworkMaterials
      };
    });

    console.log(`[API] Returning ${transformedArtworks.length} transformed artworks`);
    res.status(200).json(transformedArtworks);
  } catch (error) {
    console.error('[API] Unhandled error in artworks endpoint:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
}
