/**
 * Booking & Affiliate Deep-Link Generators for TripMind AI
 * Generates pre-filled destination, hotel, flight, and train search URLs
 * compatible with partner platforms (Booking.com, Agoda, Google Hotels, Google Flights, IRCTC).
 */

/**
 * Pre-filled deep link for Booking.com
 * Formats canonical query parameters: ss (search string), checkin, checkout, group_adults, no_rooms
 */
export function getBookingComUrl(hotelName, destination, checkIn, checkOut, travelers = 2) {
  const query = hotelName ? `${hotelName}, ${destination}` : destination;
  const adults = Math.max(1, parseInt(travelers, 10) || 2);
  const rooms = Math.max(1, Math.ceil(adults / 2));

  const u = new URL('https://www.booking.com/searchresults.html');
  u.searchParams.set('ss', query);
  if (checkIn) u.searchParams.set('checkin', checkIn);
  if (checkOut) u.searchParams.set('checkout', checkOut);
  u.searchParams.set('group_adults', adults.toString());
  u.searchParams.set('no_rooms', rooms.toString());
  u.searchParams.set('selected_currency', 'INR');

  return u.toString();
}

/**
 * Pre-filled deep link for Agoda
 * Uses Agoda's partnersearch redirect which natively pre-fills destination, dates, adults, and rooms
 */
export function getAgodaUrl(hotelName, destination, checkIn, checkOut, travelers = 2) {
  const query = hotelName ? `${hotelName}, ${destination}` : destination;
  const adults = Math.max(1, parseInt(travelers, 10) || 2);
  const rooms = Math.max(1, Math.ceil(adults / 2));

  const u = new URL('https://www.agoda.com/partners/partnersearch.aspx');
  u.searchParams.set('cid', '1891463');
  u.searchParams.set('text', query);
  if (checkIn) u.searchParams.set('checkin', checkIn);
  if (checkOut) u.searchParams.set('checkout', checkOut);
  u.searchParams.set('NumberofAdults', adults.toString());
  u.searchParams.set('Rooms', rooms.toString());
  u.searchParams.set('currency', 'INR');

  return u.toString();
}

/**
 * Direct Google Hotels & Real-Time Price Comparison search
 * Pre-fills property name and destination, displaying live rates across Booking.com, Agoda, Expedia, etc.
 */
export function getGoogleHotelsUrl(hotelName, destination, checkIn, checkOut) {
  const query = hotelName ? `${hotelName} ${destination}` : `Hotels in ${destination}`;
  return `https://www.google.com/travel/search?q=${encodeURIComponent(query)}`;
}

/**
 * Pre-filled Google Flights search redirect
 * Uses natural language query parsing to prefill origin, destination, round-trip dates, and passenger count
 */
export function getGoogleFlightsUrl(origin, destination, departureDate, returnDate, travelers = 1) {
  const adults = Math.max(1, parseInt(travelers, 10) || 1);
  const fromCity = origin || 'Mumbai';
  const toCity = destination || 'Jaipur';
  
  let naturalQuery = `Flights to ${toCity} from ${fromCity}`;
  if (departureDate && returnDate) {
    naturalQuery += ` on ${departureDate} through ${returnDate}`;
  } else if (departureDate) {
    naturalQuery += ` on ${departureDate}`;
  }
  if (adults > 1) {
    naturalQuery += ` ${adults} passengers`;
  }

  const u = new URL('https://www.google.com/travel/flights');
  u.searchParams.set('q', naturalQuery);
  u.searchParams.set('curr', 'INR');

  return u.toString();
}

/**
 * Indian Railways / IRCTC / ConfirmTkt train route search
 */
export function getTrainSearchUrl(origin, destination, departureDate) {
  const cleanOrigin = (origin || 'delhi').toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
  const cleanDest = (destination || 'jaipur').toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
  
  return `https://www.confirmtkt.com/trains/${cleanOrigin}-to-${cleanDest}`;
}

/**
 * Intercity Bus search (RedBus)
 */
export function getBusSearchUrl(origin, destination, departureDate) {
  const cleanOrigin = (origin || 'delhi').toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
  const cleanDest = (destination || 'jaipur').toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
  
  return `https://www.redbus.in/bus-tickets/${cleanOrigin}-to-${cleanDest}`;
}
