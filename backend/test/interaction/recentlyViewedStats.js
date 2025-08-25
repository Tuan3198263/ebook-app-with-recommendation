import mongoose from 'mongoose';
import RecentlyViewed from '../../src/models/recentlyViewed.js';
import User from '../../src/models/user.js';
import Book from '../../src/models/book.js';
import connectToDatabase from '../../src/db.js';

// Kết nối database
const connectDB = async () => {
  try {
    await connectToDatabase();
    console.log('✅ Kết nối MongoDB thành công');
  } catch (error) {
    console.error('❌ Lỗi kết nối MongoDB:', error);
    process.exit(1);
  }
};

// Hàm thống kê RecentlyViewed trong database
const getRecentlyViewedStatistics = async () => {
  try {
    console.log('📊 THỐNG KÊ RECENTLY VIEWED INTERACTIONS');
    console.log('='*60);

    // 1. Thống kê cơ bản
    const totalInteractions = await RecentlyViewed.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'student' });
    const totalBooks = await Book.countDocuments();
    const usersWithInteractions = await RecentlyViewed.distinct('userId').length;

    console.log(`\n1️⃣ TỔNG QUAN:`);
    console.log(`   - Tổng số users có interactions: ${usersWithInteractions}/${totalUsers} (${((usersWithInteractions/totalUsers)*100).toFixed(1)}%)`);
    console.log(`   - Tổng số RecentlyViewed documents: ${totalInteractions}`);
    console.log(`   - Tổng số sách trong hệ thống: ${totalBooks}`);

    if (totalInteractions === 0) {
      console.log('⚠️  Chưa có interaction nào trong database.');
      return;
    }

    // 2. Thống kê tổng số lượt xem
    const totalViewsResult = await RecentlyViewed.aggregate([
      { $unwind: '$viewedBooks' },
      { 
        $group: {
          _id: null,
          totalViews: { $sum: '$viewedBooks.viewCount' },
          uniqueBookViews: { $sum: 1 },
          totalDuration: { $sum: '$viewedBooks.totalDuration' },
          avgInteractionScore: { $avg: '$viewedBooks.maxInteractionScore' }
        }
      }
    ]);

    if (totalViewsResult.length > 0) {
      const stats = totalViewsResult[0];
      console.log(`\n2️⃣ THỐNG KÊ TƯƠNG TÁC:`);
      console.log(`   - Tổng số lượt xem: ${stats.totalViews}`);
      console.log(`   - Unique user-book pairs: ${stats.uniqueBookViews}`);
      console.log(`   - Tổng thời gian xem: ${(stats.totalDuration/60000).toFixed(2)} phút`);
      console.log(`   - Interaction score trung bình: ${stats.avgInteractionScore.toFixed(2)}/5`);
    }

    // 3. Phân bố số lượt xem mỗi user
    console.log(`\n3️⃣ PHÂN BỐ SỐ SÁCH THEO USER:`);
    const userViewCounts = await RecentlyViewed.aggregate([
      {
        $project: {
          userId: 1,
          bookCount: { $size: '$viewedBooks' }
        }
      },
      {
        $group: {
          _id: '$bookCount',
          userCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    userViewCounts.forEach(stat => {
      console.log(`   - ${stat._id} sách: ${stat.userCount} users`);
    });

    // 4. Top users có nhiều lượt xem nhất
    console.log(`\n4️⃣ TOP USERS TƯƠNG TÁC NHIỀU NHẤT:`);
    const topUsers = await RecentlyViewed.aggregate([
      {
        $project: {
          userId: 1,
          bookCount: { $size: '$viewedBooks' },
          totalViews: { $sum: '$viewedBooks.viewCount' }
        }
      },
      { $sort: { totalViews: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' }
    ]);

    topUsers.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.user.name} (${item.user.faculty})`);
      console.log(`      ${item.bookCount} sách khác nhau, ${item.totalViews} lượt xem tổng`);
    });

    // 5. Top sách được xem nhiều nhất
    console.log(`\n5️⃣ TOP SÁCH ĐƯỢC XEM NHIỀU NHẤT:`);
    const topBooks = await RecentlyViewed.aggregate([
      { $unwind: '$viewedBooks' },
      {
        $group: {
          _id: '$viewedBooks.bookId',
          totalViews: { $sum: '$viewedBooks.viewCount' },
          uniqueUsers: { $sum: 1 },
          avgScore: { $avg: '$viewedBooks.maxInteractionScore' }
        }
      },
      { $sort: { totalViews: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'book'
        }
      },
      { $unwind: '$book' }
    ]);

    topBooks.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.book.title}`);
      console.log(`      ${item.totalViews} lượt xem bởi ${item.uniqueUsers} users (Score: ${item.avgScore.toFixed(2)})`);
    });

    // 6. Phân bố theo category
    console.log(`\n6️⃣ PHÂN BỐ THEO CATEGORY:`);
    const categoryStats = await RecentlyViewed.aggregate([
      { $unwind: '$viewedBooks' },
      {
        $lookup: {
          from: 'books',
          localField: 'viewedBooks.bookId',
          foreignField: '_id',
          as: 'book'
        }
      },
      { $unwind: '$book' },
      {
        $group: {
          _id: '$book.category',
          viewCount: { $sum: '$viewedBooks.viewCount' },
          uniqueBooks: { $addToSet: '$book._id' },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          category: '$_id',
          viewCount: 1,
          uniqueBooks: { $size: '$uniqueBooks' },
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { viewCount: -1 } }
    ]);

    const totalCategoryViews = categoryStats.reduce((sum, cat) => sum + cat.viewCount, 0);
    categoryStats.forEach(stat => {
      const percentage = ((stat.viewCount / totalCategoryViews) * 100).toFixed(1);
      console.log(`   - ${stat.category}: ${stat.viewCount} lượt xem (${percentage}%)`);
      console.log(`     ${stat.uniqueBooks} sách khác nhau, ${stat.uniqueUsers} users`);
    });

    // 7. Phân bố theo faculty của user
    console.log(`\n7️⃣ PHÂN BỐ THEO FACULTY (Top 5):`);
    const facultyStats = await RecentlyViewed.aggregate([
      { $unwind: '$viewedBooks' },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: '$user.faculty',
          viewCount: { $sum: '$viewedBooks.viewCount' },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          faculty: '$_id',
          viewCount: 1,
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { viewCount: -1 } },
      { $limit: 5 }
    ]);

    facultyStats.forEach(stat => {
      console.log(`   - ${stat.faculty}: ${stat.viewCount} lượt xem (${stat.uniqueUsers} users)`);
    });

    // 8. Thống kê interaction score
    console.log(`\n8️⃣ PHÂN BỐ INTERACTION SCORE:`);
    const scoreStats = await RecentlyViewed.aggregate([
      { $unwind: '$viewedBooks' },
      {
        $group: {
          _id: '$viewedBooks.maxInteractionScore',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totalScoreEntries = scoreStats.reduce((sum, score) => sum + score.count, 0);
    scoreStats.forEach(stat => {
      const percentage = ((stat.count / totalScoreEntries) * 100).toFixed(1);
      console.log(`   - Score ${stat._id}: ${stat.count} interactions (${percentage}%)`);
    });

    // 9. Thống kê theo ngày tạo
    console.log(`\n9️⃣ INTERACTIONS THEO THỜI GIAN (7 ngày gần nhất):`);
    const dateStats = await RecentlyViewed.aggregate([
      { $unwind: '$viewedBooks' },
      {
        $group: {
          _id: {
            year: { $year: '$viewedBooks.lastViewedAt' },
            month: { $month: '$viewedBooks.lastViewedAt' },
            day: { $dayOfMonth: '$viewedBooks.lastViewedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
      { $limit: 7 }
    ]);

    dateStats.forEach(stat => {
      console.log(`   - ${stat._id.day}/${stat._id.month}/${stat._id.year}: ${stat.count} interactions`);
    });

    // 10. Data Quality Check
    console.log(`\n🔟 DATA QUALITY CHECK:`);
    
    // Check for missing book references
    const missingBooks = await RecentlyViewed.aggregate([
      { $unwind: '$viewedBooks' },
      {
        $lookup: {
          from: 'books',
          localField: 'viewedBooks.bookId',
          foreignField: '_id',
          as: 'book'
        }
      },
      { $match: { book: { $size: 0 } } },
      { $count: 'missingBooks' }
    ]);

    const missingBookCount = missingBooks.length > 0 ? missingBooks[0].missingBooks : 0;
    console.log(`   - Missing book references: ${missingBookCount}`);

    // Check for users without faculty
    const usersWithoutFaculty = await RecentlyViewed.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $match: { 'user.faculty': { $in: ['', null] } } },
      { $count: 'usersWithoutFaculty' }
    ]);

    const noFacultyCount = usersWithoutFaculty.length > 0 ? usersWithoutFaculty[0].usersWithoutFaculty : 0;
    console.log(`   - Users without faculty: ${noFacultyCount}`);

    // Coverage ratio
    const coverageRatio = ((usersWithInteractions / totalUsers) * 100).toFixed(1);
    console.log(`   - User coverage: ${coverageRatio}%`);
    
    if (coverageRatio < 80) {
      console.log(`   ⚠️  Khuyến nghị: Tạo thêm interactions để đạt coverage ≥ 80%`);
    } else {
      console.log(`   ✅ Coverage tốt cho training model`);
    }

  } catch (error) {
    console.error('❌ Lỗi khi thống kê RecentlyViewed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Đã đóng kết nối database');
  }
};

// Chạy script
const main = async () => {
  console.log('🚀 Bắt đầu thống kê RecentlyViewed...\n');
  await connectDB();
  await getRecentlyViewedStatistics();
};

main().catch(console.error);
