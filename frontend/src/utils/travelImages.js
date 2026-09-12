// High-quality travel photography from Unsplash for destinations, stays, and experiences

export const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80';

export const DESTINATION_IMAGES = {
  jaipur: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1600&q=85',
  hawa_mahal: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
  amber_fort: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80',
  city_palace: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=1200&q=80',
  goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
  manali: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80',
  kashmir: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1200&q=80',
  udaipur: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=1200&q=80',
  kerala: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
  mumbai: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80',
  delhi: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80',
  hero_default: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=2000&q=85'
};

export const HERO_SLIDES = [
  {
    id: 'jaipur',
    title: 'Jaipur, Rajasthan',
    region: 'India',
    tag: 'Amber Fort & Royal Palaces',
    description: 'Discover royal courtyards, desert fortresses, and pink terracotta architecture.',
    image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=2000&q=85',
    destination: 'Jaipur'
  },
  {
    id: 'kyoto',
    title: 'Kyoto, Kansai',
    region: 'Japan',
    tag: 'Ancient Shrines & Torii Gates',
    description: 'Walk through thousands of vermilion torii gates and tranquil zen bamboo groves.',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=2000&q=85',
    destination: 'Kyoto'
  },
  {
    id: 'santorini',
    title: 'Santorini, Cyclades',
    region: 'Greece',
    tag: 'Whitewashed Cliffs & Aegean Sea',
    description: 'Experience volcanic caldera cliffs, cobalt blue domes, and radiant Mediterranean sunsets.',
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=2000&q=85',
    destination: 'Santorini'
  },
  {
    id: 'swiss-alps',
    title: 'Zermatt, Alps',
    region: 'Switzerland',
    tag: 'Matterhorn & Alpine Glaciers',
    description: 'Marvel at the iconic Matterhorn, pristine glacier lakes, and scenic alpine railways.',
    image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=2000&q=85',
    destination: 'Zermatt'
  },
  {
    id: 'amalfi',
    title: 'Positano, Amalfi Coast',
    region: 'Italy',
    tag: 'Pastel Cliffs & Coastal Roads',
    description: 'Wander vertical pastel villages perched high above sparkling turquoise waters.',
    image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=2000&q=85',
    destination: 'Amalfi'
  },
  {
    id: 'kashmir',
    title: 'Srinagar, Kashmir',
    region: 'India',
    tag: 'Dal Lake & Himalayan Valleys',
    description: 'Glide along misty Dal Lake in traditional shikaras surrounded by snowy peaks.',
    image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=2000&q=85',
    destination: 'Kashmir'
  }
];

export const HOTEL_IMAGES = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80'
];

export const FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80'
];

export const POPULAR_DESTINATIONS = [
  {
    name: 'Jaipur',
    state: 'Rajasthan',
    tag: 'Heritage & Palaces',
    image: DESTINATION_IMAGES.jaipur,
    description: 'The Pink City of grand amber fortresses, vibrant royal bazaars, and opulent palaces.',
    days: '5-6 days',
    avgBudget: '₹45,000'
  },
  {
    name: 'Goa',
    state: 'West Coast',
    tag: 'Coastal & Culture',
    image: DESTINATION_IMAGES.goa,
    description: 'Sun-drenched golden beaches, historic Portuguese architecture, and coastal dining.',
    days: '4-5 days',
    avgBudget: '₹40,000'
  },
  {
    name: 'Udaipur',
    state: 'Rajasthan',
    tag: 'Lakes & Romance',
    image: DESTINATION_IMAGES.udaipur,
    description: 'Shimmering tranquil lakes flanked by royal marble palaces and sunset boat rides.',
    days: '3-4 days',
    avgBudget: '₹38,000'
  },
  {
    name: 'Manali',
    state: 'Himachal Pradesh',
    tag: 'Alpine & Adventure',
    image: DESTINATION_IMAGES.manali,
    description: 'Snow-clad Himalayan ridges, pine valleys, and refreshing mountain air.',
    days: '5-6 days',
    avgBudget: '₹35,000'
  },
  {
    name: 'Kashmir',
    state: 'Jammu & Kashmir',
    tag: 'Paradise Valley',
    image: DESTINATION_IMAGES.kashmir,
    description: 'Idyllic shikara rides on Dal Lake, snow peaks of Gulmarg, and lush saffron meadows.',
    days: '6-7 days',
    avgBudget: '₹55,000'
  },
  {
    name: 'Kerala',
    state: 'South India',
    tag: 'Backwaters & Nature',
    image: DESTINATION_IMAGES.kerala,
    description: 'Emerald tea plantations, tranquil backwater houseboats, and ayurvedic serenity.',
    days: '5-6 days',
    avgBudget: '₹42,000'
  }
];

export function getDestinationImage(destinationName = '') {
  const norm = destinationName.toLowerCase().trim();
  if (norm.includes('jaipur')) return DESTINATION_IMAGES.jaipur;
  if (norm.includes('goa')) return DESTINATION_IMAGES.goa;
  if (norm.includes('manali')) return DESTINATION_IMAGES.manali;
  if (norm.includes('kashmir')) return DESTINATION_IMAGES.kashmir;
  if (norm.includes('udaipur')) return DESTINATION_IMAGES.udaipur;
  if (norm.includes('kerala')) return DESTINATION_IMAGES.kerala;
  if (norm.includes('mumbai')) return DESTINATION_IMAGES.mumbai;
  if (norm.includes('delhi')) return DESTINATION_IMAGES.delhi;
  return DESTINATION_IMAGES.hero_default;
}

export function getAttractionImage(attractionName = '', index = 0) {
  const norm = attractionName.toLowerCase();
  if (norm.includes('hawa')) return DESTINATION_IMAGES.hawa_mahal;
  if (norm.includes('amber') || norm.includes('amer')) return DESTINATION_IMAGES.amber_fort;
  if (norm.includes('palace') || norm.includes('mahal') || norm.includes('fort')) return DESTINATION_IMAGES.city_palace;
  if (norm.includes('dal') || norm.includes('lake') || norm.includes('shikara') || norm.includes('kashmir') || norm.includes('srinagar')) return DESTINATION_IMAGES.kashmir;
  if (norm.includes('gulmarg') || norm.includes('snow') || norm.includes('peak') || norm.includes('manali') || norm.includes('valley')) return DESTINATION_IMAGES.manali;
  if (norm.includes('beach') || norm.includes('coast') || norm.includes('goa')) return DESTINATION_IMAGES.goa;
  if (norm.includes('tea') || norm.includes('backwater') || norm.includes('kerala')) return DESTINATION_IMAGES.kerala;
  
  const pool = [
    DESTINATION_IMAGES.amber_fort,
    DESTINATION_IMAGES.hawa_mahal,
    DESTINATION_IMAGES.city_palace,
    DESTINATION_IMAGES.jaipur,
    DESTINATION_IMAGES.udaipur,
    DESTINATION_IMAGES.kashmir,
    DESTINATION_IMAGES.manali
  ];
  return pool[index % pool.length];
}

export function getHotelImage(index = 0) {
  return HOTEL_IMAGES[index % HOTEL_IMAGES.length];
}

export function getFoodImage(index = 0) {
  return FOOD_IMAGES[index % FOOD_IMAGES.length];
}
