// Dashboard Controller
import User from '../models/user.js';
import Book from '../models/book.js';
import Order from '../models/order.js';
import Category from '../models/category.js';
import Author from '../models/author.js';
import Favorite from '../models/favorite.js';
import mongoose from 'mongoose';

const dashboardController = {
  // USER
  async getUserStats(req, res) {
    try {
      const totalUsers = await User.countDocuments();
      const roleStats = await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);
      const monthlyStats = await User.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);
      const facultyStats = await User.aggregate([
        { $group: { _id: '$faculty', count: { $sum: 1 } } }
      ]);
      res.json({ totalUsers, roleStats, monthlyStats, facultyStats });
    } catch (err) {
      res.status(500).json({ message: 'Lỗi thống kê user', error: err });
    }
  },

  async getTopActiveUsers(req, res) {
    try {
      const topOrderUsers = await Order.aggregate([
        { $group: { _id: '$user', orderCount: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' } } },
        { $sort: { orderCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            orderCount: 1,
            totalAmount: 1,
            name: '$userInfo.name',
            email: '$userInfo.email'
          }
        }
      ]);

      const topFavoriteUsers = await Favorite.aggregate([
        { $group: { _id: '$user', favoriteCount: { $sum: 1 } } },
        { $sort: { favoriteCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            favoriteCount: 1,
            name: '$userInfo.name',
            email: '$userInfo.email'
          }
        }
      ]);

      res.json({ topOrderUsers, topFavoriteUsers });
    } catch (err) {
      res.status(500).json({ message: 'Lỗi thống kê top user', error: err });
    }
  },

  // BOOK
  async getBookStats(req, res) {
    try {
      const totalBooks = await Book.countDocuments();

      const categoryStats = await Book.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'categoryInfo'
          }
        },
        { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            count: 1,
            categoryName: '$categoryInfo.name'
          }
        }
      ]);

      const featuredCount = await Book.countDocuments({ featured: true });

      const monthlyStats = await Book.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      res.json({ totalBooks, categoryStats, featuredCount, monthlyStats });
    } catch (err) {
      res.status(500).json({ message: 'Lỗi thống kê sách', error: err });
    }
  },

  async getTopBooks(req, res) {
    try {
      const topFavoriteBooks = await Favorite.aggregate([
        { $group: { _id: '$book', favoriteCount: { $sum: 1 } } },
        { $sort: { favoriteCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'books',
            localField: '_id',
            foreignField: '_id',
            as: 'bookInfo'
          }
        },
        { $unwind: { path: '$bookInfo', preserveNullAndEmptyArrays: false } },
        {
          $lookup: {
            from: 'categories',
            localField: 'bookInfo.category',
            foreignField: '_id',
            as: 'categoryInfo'
          }
        },
        { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            coverImage: { $arrayElemAt: ['$bookInfo.coverImages', 0] }
          }
        },
        {
          $project: {
            _id: 1,
            favoriteCount: 1,
            title: '$bookInfo.title',
            categoryName: '$categoryInfo.name',
            coverImage: 1
          }
        }
      ]);

      const topOrderBooks = await Order.aggregate([
        { $unwind: '$items' },
        { $group: { _id: '$items.book', orderCount: { $sum: 1 } } },
        { $sort: { orderCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'books',
            localField: '_id',
            foreignField: '_id',
            as: 'bookInfo'
          }
        },
        { $unwind: { path: '$bookInfo', preserveNullAndEmptyArrays: false } },
        {
          $lookup: {
            from: 'categories',
            localField: 'bookInfo.category',
            foreignField: '_id',
            as: 'categoryInfo'
          }
        },
        { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            coverImage: { $arrayElemAt: ['$bookInfo.coverImages', 0] }
          }
        },
        {
          $project: {
            _id: 1,
            orderCount: 1,
            title: '$bookInfo.title',
            categoryName: '$categoryInfo.name',
            coverImage: 1
          }
        }
      ]);

      res.json({ topFavoriteBooks, topOrderBooks });
    } catch (err) {
      res.status(500).json({ message: 'Lỗi thống kê top sách', error: err });
    }
  },

  // ORDER
  async getOrderStats(req, res) {
    try {
      const totalOrders = await Order.countDocuments();

      const statusStats = await Order.aggregate([
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
      ]);

      const monthlyRevenue = await Order.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            revenue: { $sum: '$totalAmount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      res.json({ totalOrders, statusStats, monthlyRevenue });
    } catch (err) {
      res.status(500).json({ message: 'Lỗi thống kê đơn hàng', error: err });
    }
  },

  async getTopOrderUsers(req, res) {
    try {
      const topOrderUsers = await Order.aggregate([
        {
          $group: {
            _id: '$user',
            totalAmount: { $sum: '$totalAmount' },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 5 }
      ]);
      res.json({ topOrderUsers });
    } catch (err) {
      res.status(500).json({ message: 'Lỗi thống kê top user đơn hàng', error: err });
    }
  },

  // CATEGORY
  async getCategoryStats(req, res) {
    try {
      const totalCategories = await Category.countDocuments();
      res.json({ totalCategories });
    } catch (err) {
      res.status(500).json({ message: 'Lỗi thống kê danh mục', error: err });
    }
  },

  // AUTHOR
  async getAuthorStats(req, res) {
    try {
      const totalAuthors = await Author.countDocuments();
      res.json({ totalAuthors });
    } catch (err) {
      res.status(500).json({ message: 'Lỗi thống kê tác giả', error: err });
    }
  },

  // FAVORITE
  async getFavoriteStats(req, res) {
    try {
      const totalFavorites = await Favorite.countDocuments();

      const topFavoriteBooks = await Favorite.aggregate([
        { $group: { _id: '$book', favoriteCount: { $sum: 1 } } },
        { $sort: { favoriteCount: -1 } },
        { $limit: 5 }
      ]);

      const topFavoriteUsers = await Favorite.aggregate([
        { $group: { _id: '$user', favoriteCount: { $sum: 1 } } },
        { $sort: { favoriteCount: -1 } },
        { $limit: 5 }
      ]);

      res.json({ totalFavorites, topFavoriteBooks, topFavoriteUsers });
    } catch (err) {
      res.status(500).json({ message: 'Lỗi thống kê yêu thích', error: err });
    }
  },

  // OVERVIEW
  async getOverview(req, res) {
    try {
      const totalUsers = await User.countDocuments();
      const totalBooks = await Book.countDocuments();
      const totalOrders = await Order.countDocuments();
      const totalRevenue = await Order.aggregate([
        { $match: { orderStatus: 'completed' } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' } } }
      ]);
      res.json({
        totalUsers,
        totalBooks,
        totalOrders,
        totalRevenue: totalRevenue[0]?.revenue || 0
      });
    } catch (err) {
      res.status(500).json({ message: 'Lỗi thống kê tổng quan', error: err });
    }
  }
};

export default dashboardController;
