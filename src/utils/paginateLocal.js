// Several admin list endpoints (categories, brands, wine regions, food dishes, pairings) return
// the flat paginator shape — `data` IS the array, with no `meta`/`links` at all — so there is no
// way to build page controls from the response. We fetch the full set once and paginate it here
// instead, synthesizing the same meta shape <Pagination> already knows how to render.
export const paginateLocal = (items, page, perPage) => {
  const total = items.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(Math.max(1, page), lastPage);
  const start = (currentPage - 1) * perPage;
  const pageItems = items.slice(start, start + perPage);
  return {
    items: pageItems,
    meta: {
      current_page: currentPage,
      last_page: lastPage,
      total,
      per_page: perPage,
      from: total === 0 ? 0 : start + 1,
      to: Math.min(start + perPage, total),
    },
  };
};
