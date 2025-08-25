import express from 'express';
import dashboardController from '../controllers/dashboardController.js';

const router = express.Router();

// USER
router.get('/user/stats', dashboardController.getUserStats);
router.get('/user/top', dashboardController.getTopActiveUsers);
// BOOK
router.get('/book/stats', dashboardController.getBookStats);
router.get('/book/top', dashboardController.getTopBooks);
// ORDER
router.get('/order/stats', dashboardController.getOrderStats);
router.get('/order/top', dashboardController.getTopOrderUsers);
// CATEGORY/AUTHOR
router.get('/category/stats', dashboardController.getCategoryStats);
router.get('/author/stats', dashboardController.getAuthorStats);
// FAVORITE
router.get('/favorite/stats', dashboardController.getFavoriteStats);
// OVERVIEW
router.get('/overview', dashboardController.getOverview);

export default router;
