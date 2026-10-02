import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash, Loader2, UploadCloud, X, Search, Sparkles, Eye, Star } from "lucide-react";

import {
  fetchProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  draftWineCard,
  previewProduct,
  clearProductStatus,
  clearCurrentProduct,
  clearDraftError,
  clearPreview,
} from "../redux/ProductSlice";
import { fetchAllBrands } from "../redux/BrandSlice";
import { fetchCategories, fetchCategoryTypes } from "../redux/CategorySlice";
import { fetchWineRegions } from "../redux/WineRegionSlice";
import { fetchBlogs } from "../redux/BlogSlice";
import { fetchAllFoodDishes } from "../redux/FoodDishSlice";
import { fetchWineAttributes, fetchAttributeTypes } from "../redux/WineAttributeSlice";
import { fetchWineCharacteristics } from "../redux/WineCharacteristicSlice";
import { TASTING_AXES } from "../utils/tastingAxes";
import { useDebouncedValue } from "../utils/useDebouncedValue";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Switch from "../components/ui/Switch";
import Pill from "../components/ui/Pill";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import ProductPreviewModal from "../components/ProductPreviewModal";
import RichTextEditor from "../components/RichTextEditor";
import Pagination from "../components/Pagination";
import ImagePreview from "../components/ImagePreview";
import toast from "../components/Toast";
import SearchableSelect from "../components/SearchableSelect";

const PICKER_PAGE_SIZE = 10;

const WINE_COLOURS = ["Red", "White", "Rosé", "Sparkling", "Dessert"];

const humanizeType = (t) => t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const initialFormState = {
  name: "",
  sku: "",
  slug: "",
  description: "",
  short_description: "",
  pairing_notes: "",
  local_pairing_notes: "",
  producer_notes: "",
  price: "",
  sale_price: "",
  stock_quantity: "",
  is_published: true,
  is_featured: false,
  brand_id: "",
  vintage: "",
  alcohol_abv: "",
  weight: "",
  length: "",
  width: "",
  height: "",
  category_ids: [],
  region_ids: [],
  blog_ids: [],
  variants: [],
  images: [],
  characteristics: [],
  wine_attributes: [],
  pairings: [],
};

// The API returns null for anything unset — sale_price, sku, alcohol_abv, the dimensions. Spreading
// that response straight over initialFormState replaces the "" those inputs start with, and React
// treats a null value as "this field is uncontrolled": it warns on render, and the first keystroke
// then switches the input back to controlled, which is where a half-typed value can be dropped.
//
// Only the fields that start life as a string are coerced. The arrays are replaced explicitly below.
const textFieldsWithoutNulls = (product) =>
  Object.fromEntries(
    Object.entries(product).map(([key, value]) =>
      [key, value === null && typeof initialFormState[key] === 'string' ? '' : value]
    )
  );

const initialDraftInput = {
  producer: "",
  country: "",
  region: "",
  grape: "",
  vintage: "",
  alcohol_abv: "",
  colour: "",
  notes: "",
};

const extractIds = (idsArray, objectsArray) => {
  if (Array.isArray(idsArray) && idsArray.length > 0) {
    return idsArray.map((item) => (typeof item === "object" ? item.id : item));
  }
  if (Array.isArray(objectsArray)) {
    return objectsArray.map((item) => item.id);
  }
  return [];
};

const ProductForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    currentProduct, loading, mutationLoading, draftLoading, draftError, error, successMessage,
    previewData, previewMessage, previewLoading, previewError,
  } = useSelector((s) => s.products);
  const { brands, allBrands } = useSelector((state) => state.brands || { items: [] });
  const { categories, categoryTypes, suggestedTypes: suggestedCategoryTypes, pagination: categoryPagination } = useSelector((state) => state.categories || { items: [] });
  const { regions, pagination: regionPagination } = useSelector((state) => state.wineRegions || { items: [] });
  const { posts: blogs } = useSelector((state) => state.blogs || { items: [] });
  const { foodDishes: dishes, allFoodDishes } = useSelector((state) => state.foodDishes || { items: [] });
  // allFoodDishes is the complete set; `dishes` is whatever page happened to load, kept as a
  // fallback so the picker is never empty while the full list is still arriving.
  const dishList = allFoodDishes?.length ? allFoodDishes : (dishes || []);
  const { attributes: wineAttributesPage, types: attributeTypes, inUseTypes, suggestedTypes: suggestedAttributeTypes, pagination: attributePagination } = useSelector((state) => state.wineAttributes || { attributes: [] });
  const { characteristics: allWineCharacteristics } = useSelector((state) => state.wineCharacteristics || { characteristics: [] });

  // Pick a type first, then choose from just that type's values, so a 60-grape list doesn't
  // bury the 4 colours. Types are open-ended now — merge what's already in the catalogue with
  // the backend's suggestions instead of assuming a fixed set.
  const categoryTypeOptions = [
    ...(categoryTypes || []).map((t) => ({ value: t.type, label: humanizeType(t.type), count: t.categories_count })),
    ...(suggestedCategoryTypes || []).filter((s) => !(categoryTypes || []).some((t) => t.type === s)).map((s) => ({ value: s, label: humanizeType(s), count: 0 })),
  ];

  const [formData, setFormData] = useState(initialFormState);
  const [categoryTypeFilter, setCategoryTypeFilter] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryPage, setCategoryPage] = useState(1);
  // /admin/categories and /admin/wine-regions now paginate (15/page by default), so only the
  // page currently being browsed lives in redux — cache every category/region we've ever seen
  // by id so a selection made on page 1 still shows its name after paging to page 4.
  const [categoryCache, setCategoryCache] = useState({});
  const [regionSearch, setRegionSearch] = useState("");
  const [regionPage, setRegionPage] = useState(1);
  const [regionCache, setRegionCache] = useState({});
  const [blogSearch, setBlogSearch] = useState("");
  const [axisDraft, setAxisDraft] = useState({ axis: "bold", score: "5" });
  const [attributeTypeFilter, setAttributeTypeFilter] = useState("");
  const [attributeSearch, setAttributeSearch] = useState("");
  const [attributePage, setAttributePage] = useState(1);
  const [pairingDraft, setPairingDraft] = useState({ dish_id: "", reason: "", pairing_type: "international" });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [aiInput, setAiInput] = useState(initialDraftInput);
  const [showAiPanel, setShowAiPanel] = useState(false);

  // These three drive a network request per change, so debounce them — typing a full word
  // should fire one fetch, not one per keystroke.
  const debouncedCategorySearch = useDebouncedValue(categorySearch);
  const debouncedRegionSearch = useDebouncedValue(regionSearch);
  const debouncedAttributeSearch = useDebouncedValue(attributeSearch);

  useEffect(() => {
    // Every brand, not the first page of them: this is a picker, and a brand missing from it
    // cannot be assigned to a product at all.
    dispatch(fetchAllBrands());
    dispatch(fetchBlogs());
    // The whole list: this feeds a picker, and a dish missing from it cannot be paired at all.
    dispatch(fetchAllFoodDishes());
    dispatch(fetchCategoryTypes());
    dispatch(fetchAttributeTypes());
    // Reference data for the "choose instead of type" characteristics picker — see WineCharacteristics.js.
    dispatch(fetchWineCharacteristics({ per_page: 500 }));
    if (isEditing) dispatch(fetchProductById(id));
    return () => dispatch(clearCurrentProduct());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Land on whichever type the catalogue already uses most, once the list of types has loaded.
  useEffect(() => {
    if (!categoryTypeFilter && categoryTypeOptions.length) setCategoryTypeFilter(categoryTypeOptions[0].value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryTypeOptions.length]);

  // Attributes are picked the same way categories are: choose a type, page through that type's
  // known values fetched from the server — see ProductAttributes.js. Selection itself stores the
  // full {attribute_type, value} pair on the product, so paging away never loses what's picked.
  useEffect(() => {
    dispatch(fetchWineAttributes({ type: attributeTypeFilter, search: debouncedAttributeSearch || undefined, page: attributePage, per_page: PICKER_PAGE_SIZE }));
  }, [dispatch, attributeTypeFilter, debouncedAttributeSearch, attributePage]);

  useEffect(() => {
    setAttributePage(1);
  }, [attributeTypeFilter, debouncedAttributeSearch]);

  const selectedWineAttributes = formData.wine_attributes || [];
  const [newAttributeValue, setNewAttributeValue] = useState('');

  // Typing a value the catalogue has not seen before. The picker below only ever
  // listed values that already existed, which made a colour note impossible to
  // enter: it is prose about one wine, so the only one worth setting is the one
  // nobody has typed yet. The server settles near-duplicates ("75 CL" against an
  // existing "75CL"), so a free-typed value is safe to send as it is.
  const addWineAttribute = (attribute_type, raw) => {
    const value = (raw || '').trim();
    if (!attribute_type || !value) return;
    setFormData((prev) => (
      prev.wine_attributes.some((a) => a.attribute_type === attribute_type && a.value === value)
        ? prev
        : { ...prev, wine_attributes: [...prev.wine_attributes, { attribute_type, value }] }
    ));
    setNewAttributeValue('');
  };

  const toggleWineAttribute = (attribute_type, value) => {
    setFormData((prev) => {
      const exists = prev.wine_attributes.some((a) => a.attribute_type === attribute_type && a.value === value);
      return {
        ...prev,
        wine_attributes: exists
          ? prev.wine_attributes.filter((a) => !(a.attribute_type === attribute_type && a.value === value))
          : [...prev.wine_attributes, { attribute_type, value }],
      };
    });
  };

  // The axis picker mixes the eight built-in tasting axes with any custom ones an admin has
  // added on the Wine Characteristics page, so a newly-defined axis shows up here immediately.
  const axisOptions = [...new Set([...TASTING_AXES.map((a) => a.key), ...(allWineCharacteristics || []).map((c) => c.axis)].filter(Boolean))].sort();

  useEffect(() => {
    dispatch(fetchCategories({ type: categoryTypeFilter, search: debouncedCategorySearch || undefined, page: categoryPage, per_page: PICKER_PAGE_SIZE }));
  }, [dispatch, categoryTypeFilter, debouncedCategorySearch, categoryPage]);

  useEffect(() => {
    setCategoryPage(1);
  }, [categoryTypeFilter, debouncedCategorySearch]);

  useEffect(() => {
    dispatch(fetchWineRegions({ search: debouncedRegionSearch || undefined, page: regionPage, per_page: PICKER_PAGE_SIZE }));
  }, [dispatch, debouncedRegionSearch, regionPage]);

  useEffect(() => {
    setRegionPage(1);
  }, [debouncedRegionSearch]);

  // Every page of results we've ever fetched gets folded into the lookup cache, so a category
  // picked on an earlier page/tab keeps its label in the "selected" summary indefinitely.
  useEffect(() => {
    if (categories?.length) {
      setCategoryCache((prev) => {
        const next = { ...prev };
        categories.forEach((c) => { next[c.id] = c; });
        return next;
      });
    }
  }, [categories]);

  useEffect(() => {
    if (regions?.length) {
      setRegionCache((prev) => {
        const next = { ...prev };
        regions.forEach((r) => { next[r.id] = r; });
        return next;
      });
    }
  }, [regions]);

  useEffect(() => {
    if (isEditing && currentProduct) {
      setFormData({
        ...initialFormState,
        ...textFieldsWithoutNulls(currentProduct),
        category_ids: extractIds(currentProduct.category_ids, currentProduct.categories),
        region_ids: extractIds(currentProduct.region_ids, currentProduct.wine_regions || currentProduct.regions),
        blog_ids: extractIds(currentProduct.blog_ids, currentProduct.blogs || currentProduct.posts),
        variants: currentProduct.variants || [],
        characteristics: currentProduct.characteristics || [],
        // The API takes `wine_attributes` but gives them back as `attributes`.
        // Reading the request name here loaded an empty list on every edit, and
        // submit sends the whole form — so saving any change to a product wiped
        // every attribute it had.
        wine_attributes: (currentProduct.attributes || currentProduct.wine_attributes || [])
          .map(({ attribute_type, value }) => ({ attribute_type, value })),
        pairings: currentProduct.pairings || [],
        images: (currentProduct.images || []).map((img) => ({ ...img, is_upload: false, file: null })),
      });
      if (Array.isArray(currentProduct.categories) && currentProduct.categories.length) {
        setCategoryCache((prev) => {
          const next = { ...prev };
          currentProduct.categories.forEach((c) => { next[c.id] = c; });
          return next;
        });
      }
      const productRegions = currentProduct.wine_regions || currentProduct.regions;
      if (Array.isArray(productRegions) && productRegions.length) {
        setRegionCache((prev) => {
          const next = { ...prev };
          productRegions.forEach((r) => { next[r.id] = r; });
          return next;
        });
      }
      if (!dishList.find((d) => d.id === pairingDraft.dish_id)) {
        setPairingDraft((p) => ({ ...p, dish_id: dishes[0]?.id || "", pairing_type: dishes[0]?.is_local ? "local" : "international" }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProduct, isEditing]);

  useEffect(() => {
    if (!pairingDraft.dish_id && dishList.length) {
      setPairingDraft((p) => ({ ...p, dish_id: dishes[0].id, pairing_type: dishes[0].is_local ? "local" : "international" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dishes]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearProductStatus());
    }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearProductStatus());
      navigate("/dashboard/products");
    }
  }, [error, successMessage, dispatch, navigate]);

  useEffect(() => {
    if (draftError) {
      toast.error(draftError);
      dispatch(clearDraftError());
    }
  }, [draftError, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name: value,
      slug: value.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-"),
    }));
  };

  const toggleSelection = (field, itemId) => {
    setFormData((prev) => {
      const currentList = prev[field];
      return currentList.includes(itemId)
        ? { ...prev, [field]: currentList.filter((x) => x !== itemId) }
        : { ...prev, [field]: [...currentList, itemId] };
    });
  };

  const addNestedObjectItem = (field, structureTemplate) => {
    setFormData((prev) => ({ ...prev, [field]: [...prev[field], structureTemplate] }));
  };

  const handleNestedObjectChange = (index, field, key, value) => {
    const updated = [...formData[field]];
    updated[index] = { ...updated[index], [key]: value };
    setFormData((prev) => ({ ...prev, [field]: updated }));
  };

  const removeNestedObjectItem = (index, field) => {
    setFormData((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const handleAddCharacteristic = () => {
    if (!axisDraft.axis) return;
    setFormData((prev) => ({
      ...prev,
      characteristics: [
        ...prev.characteristics.filter((c) => c.axis !== axisDraft.axis),
        { axis: axisDraft.axis, score: Number(axisDraft.score) },
      ],
    }));
  };

  const handleAddPairing = () => {
    if (!pairingDraft.dish_id) return;
    addNestedObjectItem("pairings", { ...pairingDraft });
  };

  const handleDraftWithAi = async () => {
    if (!formData.name.trim()) {
      toast.error("Enter a product name first — the draft is built from it.");
      return;
    }
    const payload = { name: formData.name };
    Object.entries(aiInput).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        payload[key] = key === "vintage" || key === "alcohol_abv" ? Number(value) : value;
      }
    });

    const result = await dispatch(draftWineCard(payload));
    if (draftWineCard.fulfilled.match(result)) {
      const draft = result.payload?.draft || {};
      setFormData((prev) => {
        const next = { ...prev };
        // The admin already typed these in to help the AI draft the copy — carry them over
        // rather than making them re-enter the same facts in the fields below.
        if (!prev.vintage && aiInput.vintage) next.vintage = aiInput.vintage;
        if (!prev.alcohol_abv && aiInput.alcohol_abv) next.alcohol_abv = aiInput.alcohol_abv;
        if (draft.description) next.description = draft.description;
        if (draft.pairing_notes) next.pairing_notes = draft.pairing_notes;
        if (draft.local_pairing_notes) next.local_pairing_notes = draft.local_pairing_notes;
        if (draft.producer_notes) next.producer_notes = draft.producer_notes;
        if (Array.isArray(draft.characteristics) && draft.characteristics.length > 0) {
          const axesInDraft = draft.characteristics.map((c) => c.axis);
          next.characteristics = [
            ...prev.characteristics.filter((c) => !axesInDraft.includes(c.axis)),
            // The draft's score sometimes arrives as a 0–1 fraction rather than the 0–10 scale
            // the field actually validates against (and the manual picker below uses) — normalize.
            ...draft.characteristics.map((c) => ({ axis: c.axis, score: c.score <= 1 ? c.score * 10 : c.score })),
          ];
        }
        return next;
      });
      toast.success("Draft ready — review and edit before saving.");
    }
  };

  const handleImageFiles = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      addNestedObjectItem("images", { file, is_upload: true, alt_text: "", is_primary: formData.images.length === 0 });
    });
  };

  const setPrimaryImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => ({ ...img, is_primary: i === index })),
    }));
  };

  const removeImage = (index) => {
    setFormData((prev) => {
      const removedWasPrimary = prev.images[index]?.is_primary;
      const images = prev.images.filter((_, i) => i !== index);
      if (removedWasPrimary && images.length > 0 && !images.some((img) => img.is_primary)) {
        images[0] = { ...images[0], is_primary: true };
      }
      return { ...prev, images };
    });
  };

  // Each image entry must carry `image` (a new upload) or `image_url` (an existing image being
  // kept), never both and never neither — the API replaces the full image set with whatever is sent.
  const buildImagesPayload = () =>
    formData.images.map((img) => {
      const base = { alt_text: img.alt_text || "", is_primary: !!img.is_primary };
      return img.is_upload && img.file ? { ...base, image: img.file } : { ...base, image_url: img.image_url };
    });

  const handleSubmit = (e) => {
    e.preventDefault();
    const productData = { ...formData, images: buildImagesPayload() };
    if (isEditing) {
      dispatch(updateProduct({ id, productData }));
    } else {
      dispatch(createProduct(productData));
    }
  };

  const handleDelete = async () => {
    await dispatch(deleteProduct(id));
    setDeleteModalOpen(false);
    navigate("/dashboard/products");
  };

  // Only previews a saved product — save first, then preview, then publish.
  const handlePreview = () => {
    setPreviewModalOpen(true);
    dispatch(previewProduct(id));
  };

  const handleClosePreview = () => {
    setPreviewModalOpen(false);
    dispatch(clearPreview());
  };

  // Search/type filtering now happens server-side (both endpoints paginate), so `categories`
  // and `regions` are already just the page being browsed — no client-side filtering needed.
  const filteredBlogs = blogs?.filter((b) => b.title.toLowerCase().includes(blogSearch.toLowerCase())) || [];
  const selectedCategories = formData.category_ids.map((cid) => categoryCache[cid]).filter(Boolean);

  // Sommelier/tasting-axes/pairing-matrix stay wine-only by design — this class only steers which
  // attribute-type suggestions to surface, it never gates any wine-only feature.
  const selectedCategoryTypes = selectedCategories.map((c) => c.type);
  const beverageClass = selectedCategoryTypes.includes("wine_type") || selectedCategoryTypes.includes("grape")
    ? "wine"
    : selectedCategoryTypes.includes("spirit_type")
    ? "spirit"
    : selectedCategoryTypes.includes("beer_type")
    ? "beer"
    : selectedCategories.some((c) => c.type === "beverage_type" && /non.?alcoholic/i.test(c.name || ""))
    ? "non_alcoholic"
    : null;

  // Always offer the universally-relevant attribute types plus whichever group matches the
  // product's beverage class, and fold in anything already in use (including custom, one-off types).
  const suggestedAttributeGroup = [
    ...(suggestedAttributeTypes?.shared || []),
    ...(beverageClass ? suggestedAttributeTypes?.[beverageClass] || [] : []),
  ];
  const attributeTypeOptions = [
    ...suggestedAttributeGroup.map((s) => ({ value: s.attribute_type, label: humanizeType(s.attribute_type), hint: s.hint })),
    ...(inUseTypes || []).filter((t) => !suggestedAttributeGroup.some((s) => s.attribute_type === t.attribute_type))
      .map((t) => ({ value: t.attribute_type, label: humanizeType(t.attribute_type), hint: null })),
  ];

  const selectedAttributeType = (attributeTypes || []).find((t) => t.key === attributeTypeFilter);

  // What to offer for the chosen type.
  //
  // A type with a shared vocabulary has its values in one place already, deduplicated: bottle_size
  // is eleven values, allergens is one. Listing the pivot rows instead put one pill on screen per
  // *product* carrying the attribute — 142 of them reading "75CL", spread over seventeen pages,
  // and ten identical "Contains Sulphites" in a row. The rows were never the vocabulary.
  //
  // A type without one holds prose belonging to a single product, so there the rows are all there
  // is to offer; they are deduplicated by text, since two products can still word a colour note
  // identically.
  const attributeValueOptions = selectedAttributeType?.is_enumerated
    ? (selectedAttributeType.values || [])
        .filter((v) => !attributeSearch || v.value.toLowerCase().includes(attributeSearch.toLowerCase()))
        .map((v) => ({ key: v.id, value: v.value }))
    : Array.from(
        new Map((wineAttributesPage || []).map((a) => [a.value, { key: a.id, value: a.value }])).values()
      );

  useEffect(() => {
    if (!attributeTypeFilter && attributeTypeOptions.length) setAttributeTypeFilter(attributeTypeOptions[0].value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attributeTypeOptions.length]);
  const selectedRegions = formData.region_ids.map((rid) => regionCache[rid]).filter(Boolean);

  if (isEditing && loading && !currentProduct) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="animate-spin text-gray-400" size={24} />
        <span className="text-sm text-gray-400">Loading product...</span>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-3/4 mx-auto">
      <button
        onClick={() => navigate("/dashboard/products")}
        className="flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700 mb-3"
      >
        <ArrowLeft size={14} /> Back to Products
      </button>

      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          {isEditing ? "Edit Product" : "New Product"}
        </h1>
        <div className="flex items-center gap-3">
          {isEditing && (
            <>
              <Button type="button" appearance="danger-outline" onClick={() => setDeleteModalOpen(true)}>Delete</Button>
              <Button type="button" appearance="secondary" icon={Eye} onClick={handlePreview}>Preview</Button>
            </>
          )}
          <Button type="button" appearance="secondary" onClick={() => navigate("/dashboard/products")}>Cancel</Button>
          <Button type="submit" form="product-form" disabled={mutationLoading}>
            {mutationLoading && <Loader2 size={14} className="animate-spin mr-1.5" />}
            Save Product
          </Button>
        </div>
      </div>

      <form id="product-form" onSubmit={handleSubmit} className="space-y-6 pb-10">
        <Card
          title="Details"
          action={
            <button
              type="button"
              onClick={() => setShowAiPanel((v) => !v)}
              className="flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-700"
            >
              <Sparkles size={14} /> Draft with AI
            </button>
          }
        >
          {showAiPanel && (
            <div className="mb-5 p-4 bg-violet-50/60 border border-violet-100 rounded-md text-sm space-y-3">
              <p className="text-xs text-gray-500">
                Fill in what you know from the supplier sheet — the more facts you give it, the better the draft. Only the product name is required.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <input type="text" placeholder="Producer" value={aiInput.producer}
                  onChange={(e) => setAiInput((p) => ({ ...p, producer: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500" />
                <input type="text" placeholder="Country" value={aiInput.country}
                  onChange={(e) => setAiInput((p) => ({ ...p, country: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500" />
                <input type="text" placeholder="Region" value={aiInput.region}
                  onChange={(e) => setAiInput((p) => ({ ...p, region: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500" />
                <input type="text" placeholder="Grape" value={aiInput.grape}
                  onChange={(e) => setAiInput((p) => ({ ...p, grape: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500" />
                <input type="number" placeholder="Vintage" value={aiInput.vintage}
                  onChange={(e) => setAiInput((p) => ({ ...p, vintage: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500" />
                <input type="number" step="0.1" placeholder="Alcohol ABV %" value={aiInput.alcohol_abv}
                  onChange={(e) => setAiInput((p) => ({ ...p, alcohol_abv: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500" />
                <select value={aiInput.colour} onChange={(e) => setAiInput((p) => ({ ...p, colour: e.target.value }))}
                  className="col-span-3 px-3 py-2 border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500">
                  <option value="">Colour (optional)</option>
                  {WINE_COLOURS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <textarea rows="3" placeholder="Paste raw supplier text here (optional)" value={aiInput.notes}
                onChange={(e) => setAiInput((p) => ({ ...p, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white resize-none focus:outline-none focus:border-violet-500" />
              <div className="flex items-center gap-3">
                <Button type="button" size="sm" disabled={draftLoading} onClick={handleDraftWithAi}>
                  {draftLoading ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Sparkles size={14} className="mr-1.5" />}
                  {draftLoading ? "Drafting… this can take up to 10s" : "Generate Draft"}
                </Button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm">
            <div>
              <label className="block font-medium text-gray-700 mb-1.5">Product Name <span className="text-red-500">*</span></label>
              <input type="text" required value={formData.name} onChange={handleNameChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1.5">Slug <span className="text-red-500">*</span></label>
              <input type="text" required value={formData.slug} onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
              <p className="text-xs text-gray-400 mt-1">Auto-generated from name · used in the product URL</p>
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1.5">SKU</label>
              <input type="text" name="sku" value={formData.sku} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
              <p className="text-xs text-gray-400 mt-1">Must be unique across products</p>
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1.5">Brand <span className="text-red-500">*</span></label>
              <SearchableSelect
                required
                name="brand_id"
                value={formData.brand_id}
                onChange={(v) => setFormData((p) => ({ ...p, brand_id: v }))}
                options={(allBrands?.length ? allBrands : brands || []).map((b) => ({ value: b.id, label: b.name }))}
                placeholder="Select a brand..."
                searchPlaceholder="Search brands..."
                emptyText="No brand matches."
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1.5">Vintage</label>
              <input type="number" placeholder="e.g. 2019" value={formData.vintage}
                onChange={(e) => setFormData((p) => ({ ...p, vintage: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1.5">Alcohol ABV %</label>
              <input type="number" step="0.1" placeholder="e.g. 13.5" value={formData.alcohol_abv}
                onChange={(e) => setFormData((p) => ({ ...p, alcohol_abv: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            </div>
            <div className="col-span-2">
              <label className="block font-medium text-gray-700 mb-1.5">Short Description</label>
              <RichTextEditor value={formData.short_description || ""} onChange={(html) => setFormData((p) => ({ ...p, short_description: html }))}
                placeholder="One or two lines shown on product cards" />
              <p className="text-xs text-gray-400 mt-1">Shown on product cards</p>
            </div>
            <div className="col-span-2">
              <label className="block font-medium text-gray-700 mb-1.5">Description</label>
              <RichTextEditor value={formData.description || ""} onChange={(html) => setFormData((p) => ({ ...p, description: html }))}
                placeholder="Tasting notes, story of the estate, vintage conditions..." />
            </div>
            <div className="col-span-2">
              <label className="block font-medium text-gray-700 mb-1.5">Pairing Notes</label>
              <RichTextEditor value={formData.pairing_notes || ""} onChange={(html) => setFormData((p) => ({ ...p, pairing_notes: html }))}
                placeholder="International food pairing suggestions..." />
            </div>
            <div className="col-span-2">
              <label className="block font-medium text-gray-700 mb-1.5">Local Pairing Notes (Ghana)</label>
              <RichTextEditor value={formData.local_pairing_notes || ""} onChange={(html) => setFormData((p) => ({ ...p, local_pairing_notes: html }))}
                placeholder="How this wine works with Ghanaian dishes..." />
            </div>
            <div className="col-span-2">
              <label className="block font-medium text-gray-700 mb-1.5">Producer Notes</label>
              <RichTextEditor value={formData.producer_notes || ""} onChange={(html) => setFormData((p) => ({ ...p, producer_notes: html }))}
                placeholder="A line or two about the estate/producer..." />
            </div>
          </div>
        </Card>

        <Card title="Organisation">
          <div className="space-y-5 text-sm">
            <div>
              <label className="block font-medium text-gray-700 mb-2">Categories <span className="text-red-500">*</span></label>

              {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3 pb-3 border-b border-gray-100">
                  {selectedCategories.map((c) => (
                    <button key={c.id} type="button" onClick={() => toggleSelection("category_ids", c.id)}
                      className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100 rounded-full hover:bg-violet-100">
                      <span className="text-[10px] text-violet-400 uppercase font-bold">{c.type ? humanizeType(c.type) : "Product"}</span>
                      {c.name}
                      <X size={11} />
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex gap-1.5 flex-wrap">
                  {categoryTypeOptions.map((t) => {
                    const count = selectedCategories.filter((c) => (c.type || "product") === t.value).length;
                    return (
                      <button key={t.value} type="button" onClick={() => setCategoryTypeFilter(t.value)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                          categoryTypeFilter === t.value ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}>
                        {t.label}
                        {count > 0 && (
                          <span className={`text-[10px] rounded-full w-4 h-4 flex items-center justify-center ${
                            categoryTypeFilter === t.value ? "bg-white/20" : "bg-violet-100 text-violet-600"
                          }`}>{count}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="relative flex-shrink-0">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder={`Search ${(categoryTypeFilter ? humanizeType(categoryTypeFilter) : "").toLowerCase()}...`}
                    value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)}
                    className="pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-violet-500 w-40" />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 min-h-[34px]">
                {categories.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-1">No {(categoryTypeFilter ? humanizeType(categoryTypeFilter) : "").toLowerCase()} categories match.</p>
                ) : (
                  categories.map((c) => (
                    <Pill key={c.id} active={formData.category_ids.includes(c.id)} onClick={() => toggleSelection("category_ids", c.id)}>
                      {c.name}
                    </Pill>
                  ))
                )}
              </div>
              {categoryPagination && categoryPagination.last_page > 1 && (
                <div className="mt-2.5">
                  <Pagination meta={categoryPagination} onPageChange={setCategoryPage} compact />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-medium text-gray-700">Wine Regions</label>
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search regions..." value={regionSearch} onChange={(e) => setRegionSearch(e.target.value)}
                    className="pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-violet-500 w-40" />
                </div>
              </div>

              {selectedRegions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2.5 pb-2.5 border-b border-gray-100">
                  {selectedRegions.map((r) => (
                    <button key={r.id} type="button" onClick={() => toggleSelection("region_ids", r.id)}
                      className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100 rounded-full hover:bg-violet-100">
                      {r.name}
                      <X size={11} />
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 min-h-[34px]">
                {regions.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-1">No regions match.</p>
                ) : (
                  regions.map((r) => (
                    <Pill key={r.id} active={formData.region_ids.includes(r.id)} onClick={() => toggleSelection("region_ids", r.id)}>
                      {r.name}
                    </Pill>
                  ))
                )}
              </div>
              {regionPagination && regionPagination.last_page > 1 && (
                <div className="mt-2.5">
                  <Pagination meta={regionPagination} onPageChange={setRegionPage} compact />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-medium text-gray-700">Linked Blog Posts</label>
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search posts..." value={blogSearch} onChange={(e) => setBlogSearch(e.target.value)}
                    className="pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-violet-500 w-40" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {filteredBlogs.map((b) => (
                  <Pill key={b.id} active={formData.blog_ids.includes(b.id)} onClick={() => toggleSelection("blog_ids", b.id)}>
                    {b.title}
                  </Pill>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Pricing & Stock">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <label className="block font-medium text-gray-700 mb-1.5">Price <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₵</span>
                <input type="number" required value={formData.price}
                  onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))}
                  className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
              </div>
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1.5">Sale Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₵</span>
                <input type="number" value={formData.sale_price}
                  onChange={(e) => setFormData((p) => ({ ...p, sale_price: e.target.value }))}
                  className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
              </div>
              <p className="text-xs text-gray-400 mt-1">Leave empty for no sale</p>
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1.5">Stock Quantity <span className="text-red-500">*</span></label>
              <input type="number" required value={formData.stock_quantity}
                onChange={(e) => setFormData((p) => ({ ...p, stock_quantity: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            </div>
          </div>
        </Card>

        <Card title="Shipping">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <label className="block text-gray-700 mb-1.5 font-medium">Weight (kg)</label>
              <input type="number" value={formData.weight}
                onChange={(e) => setFormData((p) => ({ ...p, weight: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-gray-700 mb-1.5 font-medium">Length (cm)</label>
              <input type="number" value={formData.length}
                onChange={(e) => setFormData((p) => ({ ...p, length: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-gray-700 mb-1.5 font-medium">Width (cm)</label>
              <input type="number" value={formData.width}
                onChange={(e) => setFormData((p) => ({ ...p, width: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-gray-700 mb-1.5 font-medium">Height (cm)</label>
              <input type="number" value={formData.height}
                onChange={(e) => setFormData((p) => ({ ...p, height: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Used for delivery rates</p>
        </Card>

        <Card title="Images">
          <label className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-200 rounded-md py-10 cursor-pointer hover:border-violet-300 hover:bg-violet-50/30 transition-colors">
            <UploadCloud size={20} className="text-gray-400 mb-1" />
            <span className="text-sm font-semibold text-violet-600">Click to upload images</span>
            <span className="text-xs text-gray-400">JPG, PNG or WebP · max 5MB each · first image becomes primary</span>
            <input type="file" accept="image/*" multiple onChange={handleImageFiles} className="hidden" />
          </label>
          {formData.images?.length > 0 && (
            <>
              <p className="text-xs text-gray-400 mt-4 mb-2">Click the star to choose which image shows first on the storefront.</p>
              <div className="flex flex-wrap gap-3">
                {formData.images.map((img, index) => (
                  <div key={index} className={`relative w-20 h-20 rounded-md border overflow-hidden bg-white flex items-center justify-center ${
                    img.is_primary ? "border-violet-400 ring-2 ring-violet-100" : "border-gray-200"
                  }`}>
                    <ImagePreview file={img.is_upload ? img.file : img.image_url} className="w-full h-full object-contain" alt="" />
                    <button type="button" onClick={() => setPrimaryImage(index)}
                      title={img.is_primary ? "Primary image" : "Set as primary"}
                      className={`absolute bottom-0.5 left-0.5 rounded-full p-0.5 ${img.is_primary ? "bg-violet-500 text-white" : "bg-white/90 text-gray-400 hover:text-violet-500"}`}>
                      <Star size={12} fill={img.is_primary ? "currentColor" : "none"} />
                    </button>
                    <button type="button" onClick={() => removeImage(index)}
                      className="absolute top-0.5 right-0.5 bg-white/90 rounded-full p-0.5 text-red-500 hover:bg-white">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card title="Wine Characteristics">
          <p className="text-xs text-gray-400 mb-3">
            Scored 0–10 · one score per axis; adding again replaces it. Merged with any existing scores on
            save, not replaced wholesale. See{' '}
            <button type="button" onClick={() => navigate('/dashboard/wine-characteristics')} className="text-violet-600 hover:underline">
              Wine Characteristics
            </button> for what each axis means.
          </p>
          <div className="flex items-center gap-2 mb-3">
            <select value={axisDraft.axis} onChange={(e) => setAxisDraft((d) => ({ ...d, axis: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-md bg-white text-sm focus:outline-none focus:border-violet-500">
              {axisOptions.map((key) => {
                const builtIn = TASTING_AXES.find((t) => t.key === key);
                return <option key={key} value={key}>{builtIn?.label || key}</option>;
              })}
            </select>
            <input type="number" min="0" max="10" placeholder="0–10" value={axisDraft.score}
              onChange={(e) => setAxisDraft((d) => ({ ...d, score: e.target.value }))}
              className="w-24 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-violet-500" />
            <Button type="button" size="sm" appearance="secondary" onClick={handleAddCharacteristic}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.characteristics?.map((c, index) => (
              <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-700">
                {c.axis} {c.score}
                <button type="button" onClick={() => removeNestedObjectItem(index, "characteristics")} className="text-gray-400 hover:text-red-500">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </Card>

        <Card title="Attributes">
          <p className="text-xs text-gray-400 mb-3">
            Bottle size, allergens, colour note and more — plus whatever fits this product's
            beverage class. Pick a type, then choose one of its known values or type a new one.
            Shared vocabularies are managed on the{' '}
            <button type="button" onClick={() => navigate('/dashboard/attribute-types')} className="text-violet-600 hover:underline">
              Attribute Types &amp; Values
            </button> page.
          </p>

          {selectedWineAttributes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3 pb-3 border-b border-gray-100">
              {selectedWineAttributes.map((a, i) => (
                <button key={i} type="button" onClick={() => toggleWineAttribute(a.attribute_type, a.value)}
                  className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100 rounded-full hover:bg-violet-100">
                  <span className="text-[10px] text-violet-400 uppercase font-bold">{humanizeType(a.attribute_type)}</span>
                  {a.value}
                  <X size={11} />
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
            <div className="flex gap-1.5 flex-wrap">
              {attributeTypeOptions.map((t) => {
                const count = selectedWineAttributes.filter((a) => a.attribute_type === t.value).length;
                return (
                  <button key={t.value} type="button" onClick={() => setAttributeTypeFilter(t.value)} title={t.hint || undefined}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                      attributeTypeFilter === t.value ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}>
                    {t.label}
                    {count > 0 && (
                      <span className={`text-[10px] rounded-full w-4 h-4 flex items-center justify-center ${
                        attributeTypeFilter === t.value ? "bg-white/20" : "bg-violet-100 text-violet-600"
                      }`}>{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="relative flex-shrink-0">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder={`Search ${(attributeTypeFilter ? humanizeType(attributeTypeFilter) : "").toLowerCase()}...`}
                value={attributeSearch} onChange={(e) => setAttributeSearch(e.target.value)}
                className="pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-violet-500 w-40" />
            </div>
          </div>
          {attributeTypeFilter && attributeTypeOptions.find((t) => t.value === attributeTypeFilter)?.hint && (
            <p className="text-xs text-gray-400 -mt-1.5 mb-2">{attributeTypeOptions.find((t) => t.value === attributeTypeFilter).hint}</p>
          )}
          <div className="flex flex-wrap gap-2 min-h-[34px]">
            {attributeValueOptions.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-1">
                No {(attributeTypeFilter ? humanizeType(attributeTypeFilter) : "").toLowerCase()} values yet — type the first one below.
              </p>
            ) : (
              attributeValueOptions.map((o) => (
                <Pill key={o.key} active={selectedWineAttributes.some((s) => s.attribute_type === attributeTypeFilter && s.value === o.value)}
                  onClick={() => toggleWineAttribute(attributeTypeFilter, o.value)}>
                  {o.value}
                </Pill>
              ))
            )}
          </div>

          {attributeTypeFilter && (
            <div className="flex items-center gap-2 mt-2.5">
              <input
                type="text"
                maxLength={500}
                value={newAttributeValue}
                onChange={(e) => setNewAttributeValue(e.target.value)}
                // Enter inside a form submits it, which here would save the product.
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addWineAttribute(attributeTypeFilter, newAttributeValue);
                  }
                }}
                placeholder={`Add a ${humanizeType(attributeTypeFilter).toLowerCase()}...`}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500"
              />
              <button type="button" disabled={!newAttributeValue.trim()}
                onClick={() => addWineAttribute(attributeTypeFilter, newAttributeValue)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40">
                Add
              </button>
            </div>
          )}
          {!selectedAttributeType?.is_enumerated && attributePagination && attributePagination.last_page > 1 && (
            <div className="mt-2.5">
              <Pagination meta={attributePagination} onPageChange={setAttributePage} compact />
            </div>
          )}
        </Card>

        <Card title="Food Pairings">
          <div className="flex items-center gap-2">
            <SearchableSelect
              value={pairingDraft.dish_id}
              onChange={(id) => {
                const dish = dishList.find((d) => d.id === id);
                // A local dish defaults to a local pairing, which is right far more often than not.
                setPairingDraft((d) => ({ ...d, dish_id: id, pairing_type: dish?.is_local ? "local" : "international" }));
              }}
              options={dishList.map((d) => ({ value: d.id, label: d.name }))}
              placeholder="Choose a dish..."
              searchPlaceholder="Search dishes..."
              emptyText="No dish matches."
              className="min-w-[220px]"
            />
            <select value={pairingDraft.pairing_type} onChange={(e) => setPairingDraft((d) => ({ ...d, pairing_type: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-md bg-white text-sm focus:outline-none focus:border-violet-500">
              <option value="international">International</option>
              <option value="local">Local</option>
            </select>
            <input type="text" placeholder="Why it works (optional)" value={pairingDraft.reason}
              onChange={(e) => setPairingDraft((d) => ({ ...d, reason: e.target.value }))}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-violet-500" />
            <Button type="button" size="sm" appearance="secondary" onClick={handleAddPairing}>Add</Button>
          </div>
          <div className="space-y-2 mt-3">
            {formData.pairings?.map((pair, index) => (
              <div key={index} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md text-sm">
                <div className="flex items-center gap-2">
                  {/* dishList, not dishes: `dishes` is one loaded page, so any pairing
                      whose dish fell outside it rendered as a raw ULID. */}
                  <span className="font-semibold text-gray-800">
                    {dishList.find((d) => d.id === pair.dish_id)?.name
                      || <span className="italic text-gray-400">Dish no longer available</span>}
                  </span>
                  {pair.pairing_type && (
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                      pair.pairing_type === "local" ? "bg-green-50 text-green-700" : "bg-sky-50 text-sky-700"
                    }`}>{pair.pairing_type}</span>
                  )}
                  {pair.reason && <span className="text-gray-500"> — {pair.reason}</span>}
                </div>
                <button type="button" onClick={() => removeNestedObjectItem(index, "pairings")} className="text-gray-400 hover:text-red-500">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Variants">
          <p className="text-xs text-gray-400 mb-3">Optional — e.g. single bottle vs case of 6. Each variant needs its own SKU, price and stock.</p>
          <div className="space-y-2">
            {formData.variants.map((v, index) => (
              <div key={index} className="grid grid-cols-5 gap-2 items-center bg-gray-50 p-2 rounded-md border border-gray-200 relative pr-8 text-sm">
                <input type="text" placeholder="SKU" value={v.sku}
                  onChange={(e) => handleNestedObjectChange(index, "variants", "sku", e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded bg-white font-mono" />
                <input type="number" placeholder="Price" value={v.price}
                  onChange={(e) => handleNestedObjectChange(index, "variants", "price", e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded bg-white" />
                <input type="number" placeholder="Sale" value={v.sale_price}
                  onChange={(e) => handleNestedObjectChange(index, "variants", "sale_price", e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded bg-white" />
                <input type="number" placeholder="Stock" value={v.stock_quantity}
                  onChange={(e) => handleNestedObjectChange(index, "variants", "stock_quantity", e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded bg-white" />
                <label className="flex items-center justify-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={v.is_active}
                    onChange={(e) => handleNestedObjectChange(index, "variants", "is_active", e.target.checked)}
                    className="rounded text-violet-600 focus:ring-0" /> Active
                </label>
                <button type="button" onClick={() => removeNestedObjectItem(index, "variants")}
                  className="absolute right-1 text-red-500 p-1 hover:bg-red-50 rounded">
                  <Trash size={13} />
                </button>
              </div>
            ))}
          </div>
          <Button type="button" size="sm" appearance="secondary" icon={Plus} className="mt-3"
            onClick={() => addNestedObjectItem("variants", { sku: "", price: "", sale_price: "", stock_quantity: "", is_active: true })}>
            Add Variant
          </Button>
        </Card>

        <Card title="Visibility">
          <div className="flex items-center gap-8">
            <Switch checked={formData.is_published} onChange={(val) => setFormData((p) => ({ ...p, is_published: val }))} label="Published" italic />
            <Switch checked={formData.is_featured} onChange={(val) => setFormData((p) => ({ ...p, is_featured: val }))} label="Featured" italic />
          </div>
        </Card>
      </form>

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        isDeleting={mutationLoading}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to remove "${formData.name}" from the catalog? This will remove all associated variants and history.`}
      />

      <ProductPreviewModal
        isOpen={previewModalOpen}
        onClose={handleClosePreview}
        loading={previewLoading}
        error={previewError}
        message={previewMessage}
        product={previewData}
      />
    </div>
  );
};

export default ProductForm;
