import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import RecentlyViewed from '../../src/models/recentlyViewed.js';
import User from '../../src/models/user.js';
import Book from '../../src/models/book.js';
import Category from '../../src/models/category.js';
import connectToDatabase from '../../src/db.js';

// Kết nối database
const connectDB = async () => {
  try {
    await connectToDatabase();
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Hàm loại bỏ HTML tags và clean text
const cleanHtmlText = (htmlText) => {
  if (!htmlText) return '';
  
  // Loại bỏ HTML tags
  let cleanText = htmlText.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  cleanText = cleanText
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  
  // Loại bỏ multiple spaces và newlines
  cleanText = cleanText
    .replace(/\s+/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
    .trim();
  
  return cleanText;
};

// Hàm export dữ liệu cho Collaborative Filtering
const exportCollaborativeFilteringData = async () => {
  try {
    console.log('📤 EXPORTING COLLABORATIVE FILTERING DATA');
    console.log('='.repeat(60));

    // Aggregate all interaction data với thông tin cần thiết
    const interactionData = await RecentlyViewed.aggregate([
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
        $project: {
          user_id: '$userId',
          book_id: '$viewedBooks.bookId',
          total_duration: '$viewedBooks.totalDuration',
          view_count: '$viewedBooks.viewCount',
          last_viewed_at: '$viewedBooks.lastViewedAt',
          first_viewed_at: '$viewedBooks.firstViewedAt',
          max_interaction_score: '$viewedBooks.maxInteractionScore',
          user_faculty: '$user.faculty',
          book_title: '$book.title',
          book_description: '$book.description',
          book_category: '$category.name',
          book_document_type: '$book.documentType'
        }
      }
      // Loại bỏ sort để tránh memory limit exceeded
    ]);

    console.log(`📊 Retrieved ${interactionData.length} interactions`);

    if (interactionData.length === 0) {
      console.log('❌ No interaction data found');
      return;
    }

    // Tạo thư mục export nếu chưa có
    const exportDir = path.join(process.cwd(), 'test', 'ml', 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // 1. Export dữ liệu chính cho Collaborative Filtering
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const mainCsvPath = path.join(exportDir, `collaborative_filtering_data_${timestamp}.csv`);

    console.log('\n📝 Processing interaction data...');

    const csvData = interactionData.map(item => {
      // SỬ DỤNG maxInteractionScore làm rating chính (đồng bộ với frontend)
      const finalRating = item.max_interaction_score || 1;

      return {
        user_id: item.user_id.toString(),
        book_id: item.book_id.toString(),
        rating: finalRating.toString(), // SỬ DỤNG maxInteractionScore làm rating chính (1-5)
        user_faculty: item.user_faculty,
        book_title: item.book_title,
        book_description: cleanHtmlText(item.book_description),
        book_category: item.book_category,
        book_document_type: item.book_document_type
      };
    });

    // Write main CSV
    const csvHeaders = [
      'user_id', 'book_id', 'rating',
      'user_faculty', 
      'book_title', 'book_description', 'book_category', 'book_document_type'
    ];

    let csvContent = csvHeaders.join(',') + '\n';
    csvContent += csvData.map(row => csvHeaders.map(header => {
      const value = row[header];
      // Escape commas and quotes in text fields
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')).join('\n');

    fs.writeFileSync(mainCsvPath, csvContent, 'utf8');

    // 2. Export simplified matrix for basic CF algorithms
    const simplifiedCsvPath = path.join(exportDir, `cf_matrix_simple_${timestamp}.csv`);
    const simplifiedData = csvData.map(row => ({
      user_id: row.user_id,
      book_id: row.book_id,
      rating: row.rating
    }));

    let simplifiedContent = 'user_id,book_id,rating\n';
    simplifiedContent += simplifiedData.map(row => 
      `${row.user_id},${row.book_id},${row.rating}`
    ).join('\n');

    fs.writeFileSync(simplifiedCsvPath, simplifiedContent, 'utf8');

    // 3. Export book profiles
    const bookProfilesPath = path.join(exportDir, `book_profiles_${timestamp}.csv`);
    const bookProfiles = [...new Map(csvData.map(item => [
      item.book_id, 
      {
        book_id: item.book_id,
        title: item.book_title,
        description: item.book_description || '',
        category: item.book_category,
        document_type: item.book_document_type,
        interaction_count: csvData.filter(x => x.book_id === item.book_id).length,
        avg_rating: (csvData.filter(x => x.book_id === item.book_id)
          .reduce((sum, x) => sum + parseFloat(x.rating), 0) / 
          csvData.filter(x => x.book_id === item.book_id).length).toFixed(2)
      }
    ])).values()];

    let bookProfileContent = 'book_id,title,description,category,document_type,interaction_count,avg_rating\n';
    bookProfileContent += bookProfiles.map(book => {
      // Escape và clean description cho CSV
      const cleanDescription = (book.description || '').replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, ' ');
      const cleanTitle = (book.title || '').replace(/"/g, '""');
      
      return `${book.book_id},"${cleanTitle}","${cleanDescription}","${book.category}","${book.document_type}",${book.interaction_count},${book.avg_rating}`;
    }).join('\n');

    fs.writeFileSync(bookProfilesPath, bookProfileContent, 'utf8');

    // Generate summary statistics
    const stats = {
      total_interactions: csvData.length,
      unique_users: new Set(csvData.map(x => x.user_id)).size,
      unique_books: new Set(csvData.map(x => x.book_id)).size,
      avg_rating: (csvData.reduce((sum, x) => sum + parseFloat(x.rating), 0) / csvData.length).toFixed(2),
      matrix_density: ((csvData.length / (new Set(csvData.map(x => x.user_id)).size * new Set(csvData.map(x => x.book_id)).size)) * 100).toFixed(2)
    };

    console.log('\n📊 EXPORT SUMMARY:');
    console.log(`   ✅ Main dataset: ${mainCsvPath}`);
    console.log(`   ✅ Simplified matrix: ${simplifiedCsvPath}`);
    console.log(`   ✅ Book profiles: ${bookProfilesPath}`);

    console.log('\n📈 DATASET STATISTICS:');
    console.log(`   - Total interactions: ${stats.total_interactions}`);
    console.log(`   - Unique users: ${stats.unique_users}`);
    console.log(`   - Unique books: ${stats.unique_books}`);
    console.log(`   - Average rating: ${stats.avg_rating}/5`);
    console.log(`   - Matrix density: ${stats.matrix_density}%`);

    // Write summary to text file
    const summaryPath = path.join(exportDir, `export_summary_${timestamp}.txt`);
    const summaryContent = `Collaborative Filtering Data Export Summary
Generated: ${new Date().toISOString()}

Files Created:
- Main dataset: collaborative_filtering_data_${timestamp}.csv
- Simplified matrix: cf_matrix_simple_${timestamp}.csv
- Book profiles: book_profiles_${timestamp}.csv

Dataset Statistics:
- Total interactions: ${stats.total_interactions}
- Unique users: ${stats.unique_users}
- Unique books: ${stats.unique_books}
- Average rating: ${stats.avg_rating}/5
- Matrix density: ${stats.matrix_density}%

Rating Calculation (Simplified Logic):
- Primary Rating: maxInteractionScore (1-5) directly from frontend behavior
- Frontend calculation: Base(1) + Time(+3) + Scroll(+2) = Max 5 points
- No additional calculations needed - rating comes directly from user interaction data

CSV Structure (Optimized for ML):
- Core CF: user_id, book_id, rating
- Hybrid features: user_faculty, book_title, book_description, book_category, book_document_type

Files are ready for ML model training!
`;

    fs.writeFileSync(summaryPath, summaryContent, 'utf8');

    console.log('\n🎯 COLLABORATIVE FILTERING READY!');
    console.log(`   📁 Files exported to: ${exportDir}`);
    console.log(`   📋 Summary: ${summaryPath}`);
    console.log('\n💡 Next steps:');
    console.log('   1. Upload CSV files to Google Colab');
    console.log('   2. Basic CF: pd.read_csv("cf_matrix_simple_*.csv") → only user_id, book_id, rating');
    console.log('   3. Hybrid CF: pd.read_csv("collaborative_filtering_data_*.csv") → includes content features');
    console.log('   4. Build User-based or Item-based CF model');
    console.log('   5. Try Matrix Factorization (SVD, NMF, Neural CF)');
    console.log('   6. Faculty-aware CF: Use user_faculty for bias/weighting → analyze in Colab with groupby');
    console.log('   7. Content-based: Use book_title, book_description for similarity');
    console.log('   8. Hybrid: Combine CF + Content-based + Faculty-aware recommendations');

  } catch (error) {
    console.error('❌ Error exporting CF data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
};

// Main execution
const main = async () => {
  console.log('🚀 Starting Collaborative Filtering Data Export...\n');
  await connectDB();
  await exportCollaborativeFilteringData();
};

main().catch(console.error);
