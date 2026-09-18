// Rich text fields store HTML; table/list previews want a plain-text snippet, not raw tags.
export const stripHtml = (html) => {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
};
