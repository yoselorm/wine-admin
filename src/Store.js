import { configureStore } from '@reduxjs/toolkit';
import authReducer from './redux/AuthSlice';
import blogCategoryReducer from './redux/BlogCategorySlice';
import blogReducer from './redux/BlogSlice';
import brandReducer from './redux/BrandSlice';
import categoryReducer from './redux/CategorySlice';
import productReducer from './redux/ProductSlice';
import inventoryReducer from './redux/InventorySlice';
import wineAttributeReducer from './redux/WineAttributeSlice';
import wineRegionReducer from './redux/WineRegionSlice';
import orderReducer from './redux/OrderSlice';
import couponReducer from './redux/CouponSlice';
import shippingRateReducer from './redux/ShippingRateSlice';
import shippingZoneReducer from './redux/ShippingZoneSlice';
import foodDishReducer from './redux/FoodDishSlice';
import foodAttributeReducer from './redux/FoodAttributeSlice';
import wineFoodPairingReducer from './redux/WineFoodPairingSlice';
import saleReducer from './redux/SalesReportSlice';
import intelligenceReducer from './redux/IntelligenceSlice';
import pageReducer from './redux/PagesSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    blogCategories: blogCategoryReducer,
    blogs: blogReducer,
    brands: brandReducer,
    categories: categoryReducer,
    products: productReducer,
    inventory: inventoryReducer,
    wineAttributes: wineAttributeReducer,
    wineRegions: wineRegionReducer,
    orders: orderReducer,
    coupons: couponReducer,
    shippingRates: shippingRateReducer,
    shippingZones: shippingZoneReducer,
    foodDishes: foodDishReducer,
    foodAttributes: foodAttributeReducer,
    wineFoodPairings: wineFoodPairingReducer,
    salesReports: saleReducer,
    intelligence: intelligenceReducer,
    pages: pageReducer,
  },
});

export default store;
