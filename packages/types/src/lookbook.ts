export interface LookbookCategoryDefinition {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
}

export interface LookbookImageDefinition {
  url: string;
  altText: string;
}

export interface LookbookProductDefinition {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  basePrice: number;
  categorySlug: string;
  images: LookbookImageDefinition[];
  tags: string[];
  palette: string[];
  hasArTryOn?: boolean;
  sizes?: string[];
}

export const LOOKBOOK_CATEGORIES: LookbookCategoryDefinition[] = [
  {
    name: "Occasionwear",
    slug: "occasionwear",
    description: "Statement pieces for receptions, private dinners, and elevated event dressing.",
    sortOrder: 1,
  },
  {
    name: "Aso Ebi",
    slug: "aso-ebi",
    description: "Ceremonial looks designed for bridal trains, family events, and cultural celebrations.",
    sortOrder: 2,
  },
  {
    name: "Tailored Sets",
    slug: "tailored-sets",
    description: "Sharp tailoring and coordinated sets for modern power dressing.",
    sortOrder: 3,
  },
  {
    name: "Couture",
    slug: "couture",
    description: "Editorial silhouettes and custom statement looks for standout entrances.",
    sortOrder: 4,
  },
  {
    name: "Outerwear",
    slug: "outerwear",
    description: "Layering pieces with a polished, fashion-forward edge.",
    sortOrder: 5,
  },
];

export const LOOKBOOK_PRODUCTS: LookbookProductDefinition[] = [
  {
    id: "lookbook-safari-sundress",
    slug: "safari-sundress",
    name: "Safari Sundress",
    tagline: "A soft ivory column with wild gold movement at the hem.",
    description:
      "An elegant fitted sundress that stays clean through the bodice and releases into a dramatic printed ruffle finish. Designed for statement entrances, private dinners, and modern event dressing.",
    basePrice: 185000,
    categorySlug: "occasionwear",
    images: [
      {
        url: "/catalogue/safari-sundress.jpg",
        altText: "Safari Sundress in ivory with a bold gold and black ruffle hem.",
      },
    ],
    tags: ["gala", "formal", "casual_luxury"],
    palette: ["#FAF8F3", "#F5C242", "#0A0A0A"],
  },
  {
    id: "lookbook-emerald-garden-dress",
    slug: "emerald-garden-dress",
    name: "Emerald Garden Dress",
    tagline: "Electric green occasionwear sculpted with floral texture.",
    description:
      "A vivid body-skimming dress finished with tonal appliques and soft structure at the shoulder. Built for celebratory afternoons and standout event looks with a distinctly editorial attitude.",
    basePrice: 165000,
    categorySlug: "occasionwear",
    images: [
      {
        url: "/catalogue/emerald-garden-dress-front.jpg",
        altText: "Emerald Garden Dress portrait view.",
      },
      {
        url: "/catalogue/emerald-garden-dress-walk.jpg",
        altText: "Emerald Garden Dress walking editorial view.",
      },
    ],
    tags: ["gala", "afrocentric", "casual_luxury"],
    palette: ["#9BFF38", "#00A86B", "#0A0A0A"],
  },
  {
    id: "lookbook-midnight-crimson-asoebi",
    slug: "midnight-crimson-asoebi",
    name: "Midnight Crimson Aso Ebi",
    tagline: "Dark velvet drama traced with vivid crimson embroidery.",
    description:
      "This couture aso ebi piece layers sheer illusion with rich black velvet and precise crimson detailing. It is designed for weddings, evening ceremonies, and custom formal commissions.",
    basePrice: 245000,
    categorySlug: "aso-ebi",
    images: [
      {
        url: "/catalogue/midnight-crimson-asoebi.jpg",
        altText: "Midnight Crimson Aso Ebi on mannequin with red embroidered bodice.",
      },
    ],
    tags: ["afrocentric", "formal", "bridal"],
    palette: ["#0A0A0A", "#C1121F", "#F5D6D6"],
  },
  {
    id: "lookbook-royal-amethyst-asoebi",
    slug: "royal-amethyst-asoebi",
    name: "Royal Amethyst Aso Ebi",
    tagline: "A regal purple silhouette built for celebration.",
    description:
      "A fitted lace ensemble in jewel-tone purple, balanced with corsetry-inspired panel work and ceremonial head styling. This look sits beautifully inside bridal trains, family introductions, and formal cultural events.",
    basePrice: 230000,
    categorySlug: "aso-ebi",
    images: [
      {
        url: "/catalogue/royal-amethyst-asoebi.jpg",
        altText: "Royal Amethyst Aso Ebi in purple with matching gele.",
      },
    ],
    tags: ["afrocentric", "bridal", "formal"],
    palette: ["#7D3AC1", "#B57EEB", "#E4D1FF"],
  },
  {
    id: "lookbook-ruby-allure-mini",
    slug: "ruby-allure-mini",
    name: "Ruby Allure Mini",
    tagline: "A confident red mini with sculpted evening energy.",
    description:
      "A body-contouring red mini dress created for birthday looks, private events, and after-dark styling. The clean silhouette makes it easy to style with dramatic accessories or a tailored layer.",
    basePrice: 145000,
    categorySlug: "couture",
    images: [
      {
        url: "/catalogue/ruby-allure-mini.jpg",
        altText: "Ruby Allure Mini red dress with bouquet styling.",
      },
    ],
    tags: ["gala", "date_night", "casual_luxury"],
    palette: ["#D90429", "#1F1F1F", "#F9D5D3"],
  },
  {
    id: "lookbook-champagne-column-gown",
    slug: "champagne-column-gown",
    name: "Champagne Column Gown",
    tagline: "Soft nude shimmer and a sleek red-carpet line.",
    description:
      "A fitted illusion gown drenched in light-catching embellishment and structured with a sculpted bodice. Ideal for receptions, black-tie dress codes, and statement bridal after-party styling.",
    basePrice: 280000,
    categorySlug: "couture",
    images: [
      {
        url: "/catalogue/champagne-column-gown-front.jpg",
        altText: "Champagne Column Gown front editorial view.",
      },
      {
        url: "/catalogue/champagne-column-gown-editorial.jpg",
        altText: "Champagne Column Gown outdoor editorial view.",
      },
    ],
    tags: ["gala", "formal", "bridal"],
    palette: ["#D9B27C", "#F7E7CE", "#8B6A44"],
  },
  {
    id: "lookbook-lime-noir-asoebi",
    slug: "lime-noir-asoebi",
    name: "Lime Noir Aso Ebi",
    tagline: "A playful traditional look with bold contrast.",
    description:
      "This look pairs bright patterned fabric with a sculptural black drape and floral detailing across the neckline. It is designed for lively wedding guest dressing and coordinated family event styling.",
    basePrice: 170000,
    categorySlug: "aso-ebi",
    images: [
      {
        url: "/catalogue/lime-noir-asoebi.jpg",
        altText: "Lime Noir Aso Ebi with bright lime skirt and black drape.",
      },
    ],
    tags: ["afrocentric", "wedding", "casual_luxury"],
    palette: ["#D5FF1A", "#0A0A0A", "#8AC926"],
  },
  {
    id: "lookbook-obsidian-command-coat",
    slug: "obsidian-command-coat",
    name: "Obsidian Command Coat",
    tagline: "Sharp outerwear with a tailored street-luxury stance.",
    description:
      "A long black coat styled with tonal buttons, polished boots, and understated edge. This is designed for transitional weather dressing, editorial layering, and city-forward luxury styling.",
    basePrice: 210000,
    categorySlug: "outerwear",
    images: [
      {
        url: "/catalogue/obsidian-command-coat.jpg",
        altText: "Obsidian Command Coat styled over a fitted black dress.",
      },
    ],
    tags: ["formal", "streetwear", "casual_luxury"],
    palette: ["#101010", "#343434", "#B4B4B4"],
  },
  {
    id: "lookbook-orchid-power-suit",
    slug: "orchid-power-suit",
    name: "Orchid Power Suit",
    tagline: "Soft lavender tailoring with confident purple accents.",
    description:
      "A playful yet authoritative tailored set that combines wide-leg trousers, a sculpted blazer, and rich purple contrast details. Built for fashion-forward corporate events, styled portraits, and standout occasion dressing.",
    basePrice: 195000,
    categorySlug: "tailored-sets",
    images: [
      {
        url: "/catalogue/orchid-power-suit-full.jpg",
        altText: "Orchid Power Suit full body portrait.",
      },
      {
        url: "/catalogue/orchid-power-suit-portrait.jpg",
        altText: "Orchid Power Suit portrait with white hat.",
      },
      {
        url: "/catalogue/orchid-power-suit-smile.jpg",
        altText: "Orchid Power Suit smiling editorial portrait.",
      },
    ],
    tags: ["formal", "minimalist", "casual_luxury"],
    palette: ["#E5B8FF", "#7D3AC1", "#FFFFFF"],
  },
  {
    id: "lookbook-scarlet-command-suit",
    slug: "scarlet-command-suit",
    name: "Scarlet Command Suit",
    tagline: "A fearless red set anchored by sharp black tailoring.",
    description:
      "Structured black lapels, a vivid scarlet base, and high-contrast styling make this tailored look ideal for media appearances, formal events, and fashion-forward power dressing.",
    basePrice: 205000,
    categorySlug: "tailored-sets",
    images: [
      {
        url: "/catalogue/scarlet-command-suit-full.jpg",
        altText: "Scarlet Command Suit full body portrait.",
      },
      {
        url: "/catalogue/scarlet-command-suit-portrait.jpg",
        altText: "Scarlet Command Suit portrait with black tailored jacket.",
      },
    ],
    tags: ["formal", "gala", "casual_luxury"],
    palette: ["#E10600", "#101010", "#F8D0D0"],
  },
  {
    id: "lookbook-scarlet-bloom-gown",
    slug: "scarlet-bloom-gown",
    name: "Scarlet Bloom Gown",
    tagline: "A romantic red gown with floral detailing and sheer movement.",
    description:
      "A full-length red dress softened with translucent layering and scattered floral accents. Designed for birthday portraits, evening shoots, and graceful ceremonial entrances.",
    basePrice: 175000,
    categorySlug: "couture",
    images: [
      {
        url: "/catalogue/scarlet-bloom-gown.jpg",
        altText: "Scarlet Bloom Gown in red with floral details.",
      },
    ],
    tags: ["date_night", "gala", "bridal"],
    palette: ["#D90429", "#F6B8C2", "#F8EDEB"],
  },
  {
    id: "lookbook-ruby-princess-gown",
    slug: "ruby-princess-gown",
    name: "Ruby Princess Gown",
    tagline: "A fluid red silhouette made for elegant occasion dressing.",
    description:
      "A simple but striking red gown finished with clean lines and an easy regal fall. This piece is suited to receptions, private celebrations, and timeless event portraits.",
    basePrice: 160000,
    categorySlug: "couture",
    images: [
      {
        url: "/catalogue/ruby-princess-gown.jpg",
        altText: "Ruby Princess Gown in red with soft drape.",
      },
    ],
    tags: ["formal", "casual_luxury", "wedding"],
    palette: ["#C1121F", "#F7CAC9", "#5C0000"],
  },
  {
    id: "lookbook-ruby-bubble-corset",
    slug: "ruby-bubble-corset",
    name: "Ruby Bubble Corset",
    tagline: "A sculpted bubble hem piece with couture corset volume.",
    description:
      "A statement red mini with a corseted upper body and dramatic balloon skirt. Designed for editorial shoots, party looks, and bespoke event commissions.",
    basePrice: 215000,
    categorySlug: "couture",
    images: [
      {
        url: "/catalogue/ruby-bubble-corset.jpg",
        altText: "Ruby Bubble Corset dress on mannequin.",
      },
    ],
    tags: ["gala", "streetwear", "bridal"],
    palette: ["#B80F0A", "#FF5A5F", "#FCE9E7"],
  },
  {
    id: "lookbook-crimson-one-shoulder-gown",
    slug: "crimson-one-shoulder-gown",
    name: "Crimson One-Shoulder Gown",
    tagline: "A sleek one-shoulder red gown with high-slit glamour.",
    description:
      "A clean evening silhouette with a thigh slit and minimal embellishment across one shoulder. Ideal for gala nights, red-carpet moments, and confident formal dressing.",
    basePrice: 190000,
    categorySlug: "couture",
    images: [
      {
        url: "/catalogue/crimson-one-shoulder-gown.jpg",
        altText: "Crimson One-Shoulder Gown against a red studio backdrop.",
      },
    ],
    tags: ["gala", "date_night", "formal"],
    palette: ["#E10600", "#FF7875", "#FFE5E2"],
  },
  {
    id: "lookbook-wine-regal-asoebi",
    slug: "wine-regal-asoebi",
    name: "Wine Regal Aso Ebi",
    tagline: "A richly embellished wine-toned look with ceremonial polish.",
    description:
      "An intricately detailed aso ebi silhouette built for bridal trains, high-formality celebrations, and family portraits. The rich wine palette and gele styling give it immediate regal presence.",
    basePrice: 240000,
    categorySlug: "aso-ebi",
    images: [
      {
        url: "/catalogue/wine-regal-asoebi-full.jpg",
        altText: "Wine Regal Aso Ebi full portrait view.",
      },
      {
        url: "/catalogue/wine-regal-asoebi-portrait.jpg",
        altText: "Wine Regal Aso Ebi portrait with gele and clutch.",
      },
    ],
    tags: ["afrocentric", "bridal", "formal"],
    palette: ["#7B1E3A", "#B75D8C", "#EFD3E4"],
  },
];
