/**
 * PalatePass Dynamic Image Engine
 * 
 * Provides dynamic fallback logic for restaurant visuals based on community content
 * or high-quality cuisine-specific placeholders.
 */

export interface RestaurantWithRatings {
  id: string;
  name: string;
  cuisine: string;
  ratings?: Array<{
    photoUrls?: string[];
  }>;
}

const CUISINE_FALLBACKS: Record<string, string> = {
  "Italian": "https://images.unsplash.com/photo-1498579150354-977475b7ea0b?q=80&w=1200&auto=format&fit=crop",
  "Japanese": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1200&auto=format&fit=crop",
  "French": "https://images.unsplash.com/photo-1550966841-3ee7adac1668?q=80&w=1200&auto=format&fit=crop",
  "Mexican": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=1200&auto=format&fit=crop",
  "Chinese": "https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=1200&auto=format&fit=crop",
  "Indian": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop",
  "American": "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?q=80&w=1200&auto=format&fit=crop",
  "Thai": "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1200&auto=format&fit=crop",
  "Mediterranean": "https://images.unsplash.com/photo-1544124499-5223d04e76cc?q=80&w=1200&auto=format&fit=crop",
  "Greek": "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=1200&auto=format&fit=crop",
  "Spanish": "https://images.unsplash.com/photo-1515443961218-152367888568?q=80&w=1200&auto=format&fit=crop",
  "Vietnamese": "https://images.unsplash.com/photo-1503767835115-9daea1e14eca?q=80&w=1200&auto=format&fit=crop",
  "Korean": "https://images.unsplash.com/photo-1498654077810-12c21d4d6dc3?q=80&w=1200&auto=format&fit=crop",
  "Middle Eastern": "https://images.unsplash.com/photo-1541518763669-27f70b4f4e1c?q=80&w=1200&auto=format&fit=crop",
  "Steakhouse": "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",
  "Seafood": "https://images.unsplash.com/photo-1476837579993-f1d3948f17c2?q=80&w=1200&auto=format&fit=crop",
  "Vegan": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1200&auto=format&fit=crop",
  "Bakery": "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1200&auto=format&fit=crop",
  "Swahili": "https://images.unsplash.com/photo-1533619043233-ad9c3aa2383c?q=80&w=1200&auto=format&fit=crop",
  "West African": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=1200&auto=format&fit=crop",
  "Caribbean": "https://images.unsplash.com/photo-1534080564583-6be7a0d48956?q=80&w=1200&auto=format&fit=crop",
  "Ethiopian": "https://images.unsplash.com/photo-1548029960-695d127f4543?q=80&w=1200&auto=format&fit=crop",
  "Kyoto": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1200&auto=format&fit=crop",
  "Nordic": "https://images.unsplash.com/photo-1448630360428-6e2344754a1e?q=80&w=1200&auto=format&fit=crop",
  "Cafe": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1200&auto=format&fit=crop"
};

const DEFAULT_RESTAURANT_IMAGE = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop";

/**
 * Returns the best available image for a restaurant.
 * Prioritizes user photos, then cuisine fallbacks, then a generic placeholder.
 */
export function getRestaurantImage(restaurant: RestaurantWithRatings | null | undefined): string {
  if (!restaurant) return DEFAULT_RESTAURANT_IMAGE;

  // 1. Try to find the most recent rating with a photo
  if (restaurant.ratings && restaurant.ratings.length > 0) {
    for (const rating of restaurant.ratings) {
      if (rating.photoUrls && rating.photoUrls.length > 0) {
        return rating.photoUrls[0];
      }
    }
  }

  // 2. Try cuisine-based fallback
  if (restaurant.cuisine) {
    const cuisineKey = Object.keys(CUISINE_FALLBACKS).find(
      key => restaurant.cuisine.toLowerCase().includes(key.toLowerCase())
    );
    if (cuisineKey) {
      return CUISINE_FALLBACKS[cuisineKey];
    }
  }

  // 3. Absolute fallback
  return DEFAULT_RESTAURANT_IMAGE;
}
