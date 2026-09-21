// Fixed vocabulary for wine_attributes.attribute_type — unlike tasting axes there's no
// admin-editable catalog of *types* here, only of the (type, value) pairs on the Wine
// Attributes page. Shared so that page's dropdown and the product form's type tabs can't drift.
export const ATTRIBUTE_TYPES = [
  { value: 'grape_blend', label: 'Grape Blend' },
  { value: 'colour_note', label: 'Colour Note' },
  { value: 'bottle_size', label: 'Bottle Size' },
  { value: 'allergens', label: 'Allergens' },
];

export const ATTRIBUTE_TYPE_LABEL = Object.fromEntries(ATTRIBUTE_TYPES.map((t) => [t.value, t.label]));
