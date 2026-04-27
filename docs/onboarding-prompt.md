# Client Onboarding Prompt

Use this prompt in **Claude.ai** (claude.ai/chat) — paste it in full, replacing the URL placeholder at the top.
Claude will scrape Booking.com, Airbnb, Google, and any other sources it can find, then generate the JSON files ready to drop into the template.

---

## How to use

1. Go to [claude.ai](https://claude.ai/chat) and start a new conversation
2. Copy the prompt below
3. Replace `[PROPERTY_URL]` with the real URL (Booking.com, Airbnb, website, Google Maps — any works)
4. Send it and wait — Claude will research the property and output the JSON files
5. Copy each JSON output into the corresponding file in `src/content/property/`

---

## The Prompt

```
I need you to research a property and generate configuration files for a vacation rental website.

**Property URL:** [PROPERTY_URL]

Please search the web and scrape all available information about this property — Booking.com, Airbnb, Google Maps, TripAdvisor, the property's own website, Instagram, and any other sources you can find. Gather as much detail as possible: name, location, photos, room types, amenities, reviews, policies, contact info, nearby attractions, and pricing if visible.

Once you have gathered everything, generate the following two JSON files exactly as specified. Do not add extra fields or change the structure — these files are loaded directly into a Next.js app.

---

### FILE 1: locales/en.json

Generate this file with all the property information. Follow this exact schema:

{
  "identity": {
    "slug": "kebab-case-property-name",
    "name": "Property Name",
    "propertyType": "villa | hotel | apartment | cottage | chalet | resort | guesthouse",
    "location": "City, Country",
    "country": "Country"
  },
  "hero": {
    "headline": "The property name, or a very short memorable name. Maximum 35 characters. No tagline, no location — just the name.",
    "tagline": "5 to 8 words max. Used as fallback eyebrow only. No full sentences. Example: 'Boutique villa with pool in Ubud'",
    "intro": "1-2 sentences, 100-140 characters total. Highlight 3 real benefits: location, comfort, standout feature. No italic tone, no filler. Example: 'Private pool villa in Ubud with jungle views, daily breakfast, and 5-min walk to the rice terraces.'",
    "image": "best available photo URL (high res, landscape, ideally 1200x700 or wider)",
    "primaryCTA": { "label": "Check Availability", "url": "#booking" },
    "secondaryCTA": { "label": "Explore", "url": "#gallery" }
  },
  "description": {
    "short": "1-2 sentence description for SEO and meta tags",
    "long": "2-3 paragraphs. Each paragraph max 3 sentences. Focus on what makes the place special."
  },
  "gallery": [
    { "url": "photo URL", "alt": "descriptive alt text" }
    // Include as many photos as you can find — aim for 8-15
  ],
  "rooms": [
    {
      "id": "room-1",
      "name": "Room or unit name",
      "shortDescription": "One-line description",
      "description": "2-3 sentence detailed description",
      "image": "best room photo URL",
      "capacity": 2,
      "bedType": "King bed / Queen bed / Twin beds / etc.",
      "bathroomType": "Ensuite / Shared / etc.",
      "size": "XX m² (if known)",
      "priceFrom": "$XXX (if known, else leave empty)",
      "highlights": ["highlight 1", "highlight 2", "highlight 3"],
      "amenities": ["amenity 1", "amenity 2"],
      "ctaLabel": "",
      "ctaUrl": "",
      "isFeatured": true,
      "displayOrder": 0,
      "gallery": [
        { "url": "photo URL", "alt": "alt text" }
      ]
    }
    // Add one entry per room/unit type — use sequential IDs: room-1, room-2, etc.
  ],
  "amenities": [
    // Use these exact icon keys: pool, wifi, ac, kitchen, parking, spa, staff, laundry, dining, garden, safe, transport, gym, tv, heating, balcony, bbq, fireplace, beach, ski
    { "icon": "wifi", "label": "High-Speed Wi-Fi" }
    // List all amenities you find
  ],
  "reviews": [
    {
      "author": "Reviewer name",
      "text": "Review text",
      "rating": 5,
      "country": "Reviewer country (if available)"
    }
    // Include 3-6 real reviews if found, otherwise generate 3 realistic ones based on the property type and location
  ],
  "faq": [
    {
      "question": "Question",
      "answer": "Answer"
    }
    // Include 5-8 FAQs relevant to this property (check-in times, cancellation, parking, pets, etc.)
  ],
  "location": {
    "areaName": "Neighbourhood, City",
    "mapUrl": "https://maps.google.com/?q=LAT,LNG (use real coordinates)",
    "description": "2-3 sentence description of the location and what's nearby"
  },
  "nearbyAttractions": [
    {
      "name": "Attraction name",
      "description": "One sentence description",
      "travelTime": "X min walk/drive"
    }
    // Include 4-6 real nearby attractions
  ],
  "policies": {
    "checkIn": "15:00",
    "checkOut": "11:00",
    "cancellation": "Cancellation policy text",
    "notes": [
      "Policy note 1",
      "Policy note 2"
    ]
  },
  "contact": {
    "whatsapp": "+XX XXX XXX XXXX (if found)",
    "email": "contact email (if found)",
    "phone": "phone number (if found)",
    "ctaButtons": [
      // Only include if the property has active listings on these platforms:
      { "label": "Book on Booking.com", "url": "https://booking.com/..." },
      { "label": "View on Airbnb", "url": "https://airbnb.com/..." }
    ]
  },
  "seo": {
    "title": "Property Name | Location | Type (e.g. Luxury Villa)",
    "description": "SEO meta description, 150-160 characters",
    "ogImage": "best hero photo URL"
  }
}

---

### FILE 2: availability.json

Generate one entry per room type found, matching the room IDs from FILE 1 (room-1, room-2, etc.).
Use realistic pricing based on what you found. If no pricing is visible, leave pricePerNight at 0.

{
  "room-1": {
    "pricePerNight": 0,
    "minStay": 2,
    "pricePeriods": [],
    "units": [
      {
        "id": "room-1-u1",
        "blockedRanges": [],
        "icalSources": []
      }
    ]
  }
  // Add one entry per room, matching room IDs exactly
}

---

### FILE 3: config.json

{
  "slug": "same slug as identity.slug",
  "name": "Property Name",
  "propertyType": "same as identity.propertyType",
  "location": "City, Country",
  "country": "Country",
  "timezone": "IANA timezone string (e.g. Europe/Madrid, Asia/Bali, America/New_York)",
  "defaultLocale": "en",
  "enabledLocales": ["en"],
  "adminEmail": "",
  "premiumLayouts": true
}

---

**Output format:**
- Output each file clearly labelled (FILE 1, FILE 2, FILE 3)
- Use valid JSON only — no comments inside the JSON itself
- For any field where information is not available, use an empty string "" or empty array []
- Photo URLs: prefer high-resolution originals. If only thumbnail URLs are available, try to construct the full-res version
- Be thorough — the more complete the output, the less the client needs to edit manually
```

---

## Tips

- **Best sources to provide:** Booking.com listing URL is usually the richest (photos, amenities, policies, reviews, room types). Airbnb is also excellent.
- **Multiple URLs:** You can paste 2-3 URLs and tell Claude to combine info from all of them.
- **After generating:** Paste the JSON files into `src/content/property/` and run `npm run dev` to preview locally before deploying.
- **Rooms with multiple units** (e.g. 3 identical apartments): In `availability.json`, add multiple entries under `units` — one per physical unit (room-1-u1, room-1-u2, room-1-u3).
