import mongoose from 'mongoose';
import RecentlyViewed from '../../src/models/recentlyViewed.js';
import User from '../../src/models/user.js';
import Book from '../../src/models/book.js';
import Category from '../../src/models/category.js';
import connectToDatabase from '../../src/db.js';

// Kết nối database    console.log(`\n📅 RECENT ACTIVITY (Last 7 days):`);
    temporalAnalysis.forEach(day => {
      console.log(`   - ${day._id}: ${day.interactionCount} interactions`);
    });

    console.log(`\n⭐ RATING SYSTEM - USING maxInteractionScore:`);
    console.log(`   🎯 **Simplified Rating Approach:**`);
    console.log(`      - Rating = maxInteractionScore (1-5 scale)`);
    console.log(`      - Thay vì công thức phức tạp: (viewCount * 0.3) + (duration * 0.4) + (score * 0.3)`);
    console.log(`      - Sử dụng trực tiếp maxInteractionScore đã được tính từ frontend behavior`);
    console.log(`   
   📊 **Frontend Behavior → Rating Mapping:**
      ┌─────────────────────────────────────────────────────────┐
      │ User Behavior                    → maxInteractionScore  │
      ├─────────────────────────────────────────────────────────┤
      │ Quick view (< 30s)               → 1 điểm              │
      │ Normal reading (30-90s)          → 2-3 điểm            │
      │ Deep engagement (> 90s + scroll) → 4-5 điểm            │
      │ Add to cart action               → 5 điểm (maximum)     │
      └─────────────────────────────────────────────────────────┘
   
   ✅ **Advantages of maxInteractionScore as Rating:**
      - Đã normalized (1-5 scale) phù hợp cho Collaborative Filtering
      - Phản ánh true user interest từ actual behavior
      - Loại bỏ complexity của weighted formulas
      - Consistent với explicit rating systems
      - Easy to interpret và debug
      - Directly usable cho Matrix Factorization algorithms
   `);

    console.log(`\n🧮 MATRIX FACTORIZATION WITH maxInteractionScore:`);
    console.log(`   Ma trận User-Item sử dụng maxInteractionScore làm rating:`);
    console.log(`   
   📊 User-Item Rating Matrix (200 users × 120 books):
   ┌─────────────────────────────────────┐
   │ User1  [3, 0, 5, 0, 2, ...]        │ → maxInteractionScore (1-5)
   │ User2  [0, 4, 0, 4, 0, ...]        │ → Behavior-based ratings
   │ ...                                 │
   │ User200[2, 0, 0, 5, 3, ...]        │ → Direct from frontend tracking
   └─────────────────────────────────────┘
   
   💡 **Implementation trong Collaborative Filtering:**
      - Tạo sparse matrix: User × Book × maxInteractionScore
      - 0 = chưa tương tác, 1-5 = mức độ quan tâm
      - Apply Matrix Factorization (SVD, NMF, ALS)
      - Predict missing ratings cho recommendation
   `);

    console.log(`\n✅ COLLABORATIVE FILTERING READINESS:`);
    console.log(`   - Matrix Density: ${userInteractionStats.length > 0 ? 
      (userInteractionStats[0].density > 1 ? '✅ Sufficient' : '⚠️ Sparse') : '❌ No data'}`);
    console.log(`   - User Coverage: ${userInteractionStats.length > 0 ? 
      (userInteractionStats[0].uniqueUsers >= 150 ? '✅ Good' : '⚠️ Limited') : '❌ No data'}`);
    console.log(`   - Faculty Bias: ${facultyCategoryAlignment.length > 0 ? '✅ Present' : '❌ Missing'}`);
    console.log(`   - Quality Scores: ${qualityMetrics.length > 0 ? 
      (qualityMetrics[0].avgScore >= 2.5 ? '✅ Realistic' : '⚠️ Too low') : '❌ No data'}`);
    console.log(`   - Rating Scale: ✅ Standardized (1-5 via maxInteractionScore)`);tDB = async () => {
  try {
    await connectToDatabase();
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Hàm tổng quan dữ liệu cho Collaborative Filtering
const getCollaborativeFilteringOverview = async () => {
  try {
    console.log('📊 COLLABORATIVE FILTERING - DATA OVERVIEW');
    console.log('='.repeat(60));

    // 1. Basic Statistics
    const totalUsers = await User.countDocuments({ role: 'student' });
    const totalBooks = await Book.countDocuments();
    const totalInteractions = await RecentlyViewed.countDocuments();
    
    console.log(`\n📈 BASIC STATISTICS:`);
    console.log(`   - Total Students: ${totalUsers}`);
    console.log(`   - Total Books: ${totalBooks}`);
    console.log(`   - Total RecentlyViewed Records: ${totalInteractions}`);

    // 2. User-Item Interaction Matrix Density
    const userInteractionStats = await RecentlyViewed.aggregate([
      { $unwind: '$viewedBooks' },
      {
        $group: {
          _id: null,
          totalInteractions: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
          uniqueBooks: { $addToSet: '$viewedBooks.bookId' }
        }
      },
      {
        $project: {
          totalInteractions: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          uniqueBooks: { $size: '$uniqueBooks' },
          density: {
            $multiply: [
              { $divide: ['$totalInteractions', { $multiply: [{ $size: '$uniqueUsers' }, { $size: '$uniqueBooks' }] }] },
              100
            ]
          }
        }
      }
    ]);

    if (userInteractionStats.length > 0) {
      const stats = userInteractionStats[0];
      console.log(`\n🎯 USER-ITEM MATRIX:`);
      console.log(`   - Total Interactions: ${stats.totalInteractions}`);
      console.log(`   - Users with Interactions: ${stats.uniqueUsers}`);
      console.log(`   - Books with Interactions: ${stats.uniqueBooks}`);
      console.log(`   - Matrix Density: ${stats.density.toFixed(3)}%`);
      console.log(`   - Sparsity: ${(100 - stats.density).toFixed(3)}%`);
    }

    // 3. User Coverage & Distribution
    const userDistribution = await RecentlyViewed.aggregate([
      {
        $project: {
          userId: 1,
          interactionCount: { $size: '$viewedBooks' }
        }
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lte: ['$interactionCount', 5] }, then: '1-5 books' },
                { case: { $lte: ['$interactionCount', 15] }, then: '6-15 books' },
                { case: { $lte: ['$interactionCount', 25] }, then: '16-25 books' },
                { case: { $lte: ['$interactionCount', 40] }, then: '26-40 books' }
              ],
              default: '40+ books'
            }
          },
          userCount: { $sum: 1 },
          avgInteractions: { $avg: '$interactionCount' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    console.log(`\n👥 USER INTERACTION DISTRIBUTION:`);
    userDistribution.forEach(dist => {
      const coverage = ((dist.userCount / totalUsers) * 100).toFixed(1);
      console.log(`   - ${dist._id}: ${dist.userCount} users (${coverage}%) - Avg: ${dist.avgInteractions.toFixed(1)} books`);
    });

    // 4. Faculty-Category Alignment Analysis
    const facultyCategoryAlignment = await RecentlyViewed.aggregate([
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
        $lookup: {
          from: 'books',
          localField: 'viewedBooks.bookId',
          foreignField: '_id',
          as: 'book'
        }
      },
      { $unwind: '$book' },
      {
        $lookup: {
          from: 'categories',
          localField: 'book.category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: {
            faculty: '$user.faculty',
            category: '$category.name'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.faculty',
          categories: {
            $push: {
              category: '$_id.category',
              count: '$count'
            }
          },
          totalInteractions: { $sum: '$count' }
        }
      },
      { $sort: { totalInteractions: -1 } }
    ]);

    console.log(`\n🎓 FACULTY-CATEGORY ALIGNMENT:`);
    facultyCategoryAlignment.forEach(faculty => {
      console.log(`\n   📚 ${faculty._id} (${faculty.totalInteractions} interactions):`);
      const sortedCategories = faculty.categories.sort((a, b) => b.count - a.count).slice(0, 3);
      sortedCategories.forEach(cat => {
        const percentage = ((cat.count / faculty.totalInteractions) * 100).toFixed(1);
        console.log(`      - ${cat.category}: ${cat.count} (${percentage}%)`);
      });
    });

    // 5. Interaction Quality Metrics
    const qualityMetrics = await RecentlyViewed.aggregate([
      { $unwind: '$viewedBooks' },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$viewedBooks.maxInteractionScore' },
          avgDuration: { $avg: '$viewedBooks.totalDuration' },
          avgViewCount: { $avg: '$viewedBooks.viewCount' },
          scoreDistribution: {
            $push: '$viewedBooks.maxInteractionScore'
          }
        }
      }
    ]);

    if (qualityMetrics.length > 0) {
      const metrics = qualityMetrics[0];
      console.log(`\n⭐ INTERACTION QUALITY METRICS:`);
      console.log(`   - Average Interaction Score: ${metrics.avgScore.toFixed(2)}/5`);
      console.log(`   - Average Total Duration: ${(metrics.avgDuration / 60000).toFixed(1)} minutes`);
      console.log(`   - Average View Count: ${metrics.avgViewCount.toFixed(1)} times`);

      // Score distribution
      const scoreDistribution = [1, 2, 3, 4, 5].map(score => {
        const count = metrics.scoreDistribution.filter(s => s === score).length;
        const percentage = ((count / metrics.scoreDistribution.length) * 100).toFixed(1);
        return { score, count, percentage };
      });

      console.log(`\n   📊 Score Distribution:`);
      scoreDistribution.forEach(dist => {
        console.log(`      - Score ${dist.score}: ${dist.count} interactions (${dist.percentage}%)`);
      });
    }

    // 6. Popular Books Analysis (80/20 rule check)
    const bookPopularity = await RecentlyViewed.aggregate([
      { $unwind: '$viewedBooks' },
      {
        $group: {
          _id: '$viewedBooks.bookId',
          viewCount: { $sum: 1 },
          avgScore: { $avg: '$viewedBooks.maxInteractionScore' }
        }
      },
      { $sort: { viewCount: -1 } },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'book'
        }
      },
      { $unwind: '$book' },
      {
        $group: {
          _id: null,
          books: { 
            $push: { 
              bookId: '$_id', 
              title: '$book.title',
              viewCount: '$viewCount', 
              avgScore: '$avgScore' 
            } 
          },
          totalViews: { $sum: '$viewCount' }
        }
      }
    ]);

    if (bookPopularity.length > 0) {
      const popularity = bookPopularity[0];
      const top20PercentBooks = Math.ceil(popularity.books.length * 0.2);
      const top20PercentViews = popularity.books.slice(0, top20PercentBooks).reduce((sum, book) => sum + book.viewCount, 0);
      const pareto80Percentage = ((top20PercentViews / popularity.totalViews) * 100).toFixed(1);

      console.log(`\n📚 BOOK POPULARITY ANALYSIS (80/20 Rule):`);
      console.log(`   - Total Unique Books with Interactions: ${popularity.books.length}`);
      console.log(`   - Top 20% Books (${top20PercentBooks} books): ${top20PercentViews} views (${pareto80Percentage}%)`);
      console.log(`   - Pareto Efficiency: ${pareto80Percentage >= 60 ? '✅ Good' : '⚠️ Needs improvement'}`);

      console.log(`\n   🔥 Top 5 Most Popular Books:`);
      for (let i = 0; i < Math.min(5, popularity.books.length); i++) {
        const book = popularity.books[i];
        const title = book.title.length > 50 ? book.title.substring(0, 50) + '...' : book.title;
        console.log(`      ${i + 1}. "${title}" - ${book.viewCount} views (Avg Score: ${book.avgScore.toFixed(1)})`);
      }
    }

    // 7. Cold Start Problem Analysis
    const coldStartAnalysis = await User.aggregate([
      { $match: { role: 'student' } },
      {
        $lookup: {
          from: 'recentlyvieweds',
          localField: '_id',
          foreignField: 'userId',
          as: 'interactions'
        }
      },
      {
        $project: {
          faculty: 1,
          major: 1,
          hasInteractions: { $gt: [{ $size: '$interactions' }, 0] }
        }
      },
      {
        $group: {
          _id: '$hasInteractions',
          count: { $sum: 1 },
          faculties: { $addToSet: '$faculty' }
        }
      }
    ]);

    console.log(`\n🆕 COLD START PROBLEM ANALYSIS:`);
    coldStartAnalysis.forEach(group => {
      if (group._id) {
        console.log(`   - Users WITH interactions: ${group.count} (${((group.count / totalUsers) * 100).toFixed(1)}%)`);
      } else {
        console.log(`   - Users WITHOUT interactions: ${group.count} (${((group.count / totalUsers) * 100).toFixed(1)}%)`);
      }
    });

    // 8. Temporal Analysis
    const temporalAnalysis = await RecentlyViewed.aggregate([
      { $unwind: '$viewedBooks' },
      {
        $project: {
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$viewedBooks.lastViewedAt'
            }
          }
        }
      },
      {
        $group: {
          _id: '$date',
          interactionCount: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 7 }
    ]);

    console.log(`\n📅 RECENT ACTIVITY (Last 7 days):`);
    temporalAnalysis.forEach(day => {
      console.log(`   - ${day._id}: ${day.interactionCount} interactions`);
    });

    console.log(`\n✅ COLLABORATIVE FILTERING READINESS:`);
    console.log(`   - Matrix Density: ${userInteractionStats.length > 0 ? 
      (userInteractionStats[0].density > 1 ? '✅ Sufficient' : '⚠️ Sparse') : '❌ No data'}`);
    console.log(`   - User Coverage: ${userInteractionStats.length > 0 ? 
      (userInteractionStats[0].uniqueUsers >= 150 ? '✅ Good' : '⚠️ Limited') : '❌ No data'}`);
    console.log(`   - Faculty Bias: ${facultyCategoryAlignment.length > 0 ? '✅ Present' : '❌ Missing'}`);
    console.log(`   - Quality Scores: ${qualityMetrics.length > 0 ? 
      (qualityMetrics[0].avgScore >= 2.5 ? '✅ Realistic' : '⚠️ Too low') : '❌ No data'}`);

  } catch (error) {
    console.error('❌ Error generating CF overview:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
};

// Main execution
const main = async () => {
  console.log('🚀 Starting Collaborative Filtering Data Overview...\n');
  await connectDB();
  await getCollaborativeFilteringOverview();
};

main().catch(console.error);
