import { configureStore } from '@reduxjs/toolkit';
import authReducer from './redux/AuthSlice';
import blogCategoryReducer from './redux/BlogCategorySlice';
import blogReducer from './redux/BlogSlice';
import brandReducer from './redux/BrandSlice';
import categoryReducer from './redux/CategorySlice';
import productReducer from './redux/ProductSlice';
import inventoryReducer from './redux/InventorySlice';
import wineAttributeReducer from './redux/WineAttributeSlice';
import wineCharacteristicReducer from './redux/WineCharacteristicSlice';
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
import adminReducer from './redux/AdminSlice';
import activityReducer from './redux/ActivitySlice';
import reviewReducer from './redux/ReviewSlice';
import customerReducer from './redux/CustomerSlice';
import suburbReducer from './redux/SuburbSlice';
import sommelierReducer from './redux/SommelierSlice';
import quizAdminReducer from './redux/QuizAdminSlice';
import insightsReducer from './redux/InsightsSlice';
import dashboardReducer from './redux/DashboardSlice';
import reportsReducer from './redux/ReportsSlice';

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
    dashboard: dashboardReducer,
    reports: reportsReducer,
    wineCharacteristics: wineCharacteristicReducer,
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
    adminPages: pageReducer,
    admins: adminReducer,
    activity: activityReducer,
    reviews: reviewReducer,
    customers: customerReducer,
    suburbs: suburbReducer,
    sommelier: sommelierReducer,
    quizAdmin: quizAdminReducer,
    insights: insightsReducer,
  },
});

export default store;
