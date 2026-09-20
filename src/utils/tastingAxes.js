// The fixed 8-axis tasting vocabulary (frontend.md) — not admin-editable, since matching logic
// throughout the app (quiz coverage, insights, the sommelier) is keyed to these exact names.
// Kept in one place so the product form's picker and the Wine Characteristics reference page
// can never drift apart.
export const TASTING_AXES = [
  { key: 'bold', label: 'Bold', description: 'Weight and intensity on the palate — how much the wine fills the mouth, not how strong it tastes.' },
  { key: 'light', label: 'Light', description: 'The opposite end of body from Bold — a delicate, easy-drinking feel.' },
  { key: 'dry', label: 'Dry', description: 'Little to no perceptible sweetness. Most red and many white wines score high here.' },
  { key: 'sweet', label: 'Sweet', description: 'Residual sugar you can taste. Scored on very few wines in most catalogues.' },
  { key: 'acidity', label: 'Acidity', description: 'The freshness or tartness that makes a wine feel crisp — comparable to biting a lemon.' },
  { key: 'tannic', label: 'Tannic', description: 'The drying, grippy sensation from tannin — the same feeling as strong black tea. Reds carry most of this.' },
  { key: 'soft', label: 'Soft', description: 'Smooth, low-tannin mouthfeel — the opposite end from Tannic.' },
  { key: 'fizzy', label: 'Fizzy', description: 'Perceptible carbonation — sparkling and semi-sparkling styles.' },
];

export const TASTING_AXIS_KEYS = TASTING_AXES.map((a) => a.key);
