import api from './api';

const dashboardService = {
  // USER
  getUserStats: () => api.get('/dashboard/user/stats'),
  getTopActiveUsers: () => api.get('/dashboard/user/top'),
  // BOOK
  getBookStats: () => api.get('/dashboard/book/stats'),
  getTopBooks: () => api.get('/dashboard/book/top'),
  // ORDER
  getOrderStats: () => api.get('/dashboard/order/stats'),
  getTopOrderUsers: () => api.get('/dashboard/order/top'),
  // CATEGORY/AUTHOR
  getCategoryStats: () => api.get('/dashboard/category/stats'),
  getAuthorStats: () => api.get('/dashboard/author/stats'),
  // FAVORITE
  getFavoriteStats: () => api.get('/dashboard/favorite/stats'),
  // OVERVIEW
  getOverview: () => api.get('/dashboard/overview'),
};

export default dashboardService;
