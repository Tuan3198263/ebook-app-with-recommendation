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

// Cấu hình tạo interactions phù hợp cho ML model
const INTERACTION_CONFIG = {
  // Phân bố số sách mỗi user (đồng đều hơn để train model tốt)
  userBookDistribution: [
    { range: [5, 10], weight: 0.25 },     // 25% users ít tương tác (5-10 sách)
    { range: [11, 18], weight: 0.35 },    // 35% users tương tác trung bình (11-18 sách)
    { range: [19, 28], weight: 0.25 },    // 25% users tương tác nhiều (19-28 sách)
    { range: [29, 40], weight: 0.15 }     // 15% users rất tích cực (29-40 sách)
  ],

  // Phân bố interaction score (realistic)
  scoreDistribution: [
    { score: 1, weight: 0.05 },  // 5% - Không thích
    { score: 2, weight: 0.15 },  // 15% - Ít thích
    { score: 3, weight: 0.40 },  // 40% - Bình thường
    { score: 4, weight: 0.30 },  // 30% - Thích
    { score: 5, weight: 0.10 }   // 10% - Rất thích
  ],

  // Bias theo faculty (users ưu tiên xem sách liên quan đến khoa học - có bias nhưng không tuyệt đối)
  facultyBookBias: {
    'Khoa Công nghệ Thông tin': { 'Công nghệ thông tin': 0.45, 'Khoa học tự nhiên': 0.25, 'Giáo dục': 0.12, 'Kinh tế': 0.10, 'Văn học': 0.05, 'Triết học': 0.03 },
    'Khoa Khoa học Tự nhiên': { 'Khoa học tự nhiên': 0.50, 'Công nghệ thông tin': 0.20, 'Giáo dục': 0.12, 'Kinh tế': 0.10, 'Văn học': 0.05, 'Triết học': 0.03 },
    'Khoa Kinh tế': { 'Kinh tế': 0.45, 'Khoa học tự nhiên': 0.20, 'Công nghệ thông tin': 0.15, 'Giáo dục': 0.12, 'Văn học': 0.05, 'Triết học': 0.03 },
    'Khoa Giáo dục': { 'Giáo dục': 0.40, 'Khoa học tự nhiên': 0.22, 'Văn học': 0.18, 'Công nghệ thông tin': 0.12, 'Kinh tế': 0.05, 'Triết học': 0.03 },
    'Khoa Chính Trị': { 'Triết học': 0.35, 'Giáo dục': 0.25, 'Văn học': 0.18, 'Khoa học tự nhiên': 0.12, 'Kinh tế': 0.07, 'Công nghệ thông tin': 0.03 },
    'Khoa Văn học': { 'Văn học': 0.40, 'Giáo dục': 0.25, 'Triết học': 0.15, 'Khoa học tự nhiên': 0.12, 'Kinh tế': 0.05, 'Công nghệ thông tin': 0.03 }
  },

  // Tạo một số popular books (20/80 rule)
  popularBookRatio: 0.20, // 20% sách sẽ có 80% interactions

  // Thời gian xem realistic (milliseconds)
  durationRange: {
    min: 30000,   // 30 giây
    max: 600000   // 10 phút
  }
};

// Hàm chọn số sách cho user theo phân bố
const selectBooksCountForUser = () => {
  const rand = Math.random();
  let cumulative = 0;
  
  for (const dist of INTERACTION_CONFIG.userBookDistribution) {
    cumulative += dist.weight;
    if (rand <= cumulative) {
      const [min, max] = dist.range;
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
  }
  
  return 10; // Fallback
};

// Hàm tính maxInteractionScore dựa trên hành vi người dùng (mô phỏng logic frontend với phân bố đẹp)
const calculateMaxInteractionScore = (duration, viewCount, bookIndex, totalBooks) => {
  // Mô phỏng logic từ BookDetail.vue với cải thiện phân bố
  
  // 1. Time Score (dựa trên duration) - tối đa 5 phút (300s) = 1 điểm
  const timeScore = Math.min(duration / 300000, 1);
  
  // 2. Scroll Score (mô phỏng) - giả sử người dùng scroll càng nhiều nếu đọc lâu
  // Duration > 2 phút = scroll tốt, duration > 5 phút = scroll rất tốt
  let scrollScore = 0;
  if (duration > 120000) { // > 2 phút
    scrollScore = Math.min((duration - 120000) / 180000, 1);
  }
  
  // 3. Action Score (mô phỏng dựa trên viewCount) - viewCount cao = nhiều tương tác
  // Giả sử mỗi lần view = 2-3 actions, tối đa 10 actions = 1 điểm
  const estimatedActions = viewCount * (2 + Math.random()); // 2-3 actions per view
  const actionScore = Math.min(estimatedActions * 0.1, 1);
  
  // 4. Base score = +1 (cho việc truy cập)
  const baseScore = 1;
  
  // 5. CẢI THIỆN PHÂN BỐ: Tạo diversity trong rating
  // Một số sách user sẽ thích hơn (bias dựa trên vị trí trong danh sách)
  let preferenceBonus = 0;
  const position = bookIndex / totalBooks; // 0-1
  
  if (position < 0.3) {
    // 30% sách đầu: user có xu hướng thích hơn (sách hot/trending)
    preferenceBonus = 0.3 + Math.random() * 0.5; // +0.3-0.8 điểm
  } else if (position < 0.7) {
    // 40% sách giữa: neutral
    preferenceBonus = -0.2 + Math.random() * 0.6; // -0.2 đến +0.4 điểm
  } else {
    // 30% sách cuối: có thể không thích
    preferenceBonus = -0.4 + Math.random() * 0.4; // -0.4 đến 0 điểm
  }
  
  // 6. Tổng điểm với preference bonus
  let totalScore = timeScore + scrollScore + actionScore + baseScore + preferenceBonus;
  
  // 7. Đảm bảo phân bố đẹp: tránh quá nhiều điểm 1 hoặc 5
  totalScore = Math.min(5, Math.max(1, totalScore));
  
  // 8. Làm mịn phân bố - tránh concentration ở 1 điểm
  if (totalScore < 1.5) {
    totalScore = 1 + Math.random() * 0.8; // 1.0-1.8
  } else if (totalScore > 4.5) {
    totalScore = 4.2 + Math.random() * 0.8; // 4.2-5.0
  }
  
  // Làm tròn thành số nguyên từ 1-5
  return Math.max(1, Math.min(5, Math.round(totalScore)));
};

// Hàm tạo duration với bias dựa trên preference
const generateDurationWithBias = (preference = 'neutral') => {
  const { min, max } = INTERACTION_CONFIG.durationRange;
  let duration;
  
  if (preference === 'high') {
    // User thích sách này → đọc lâu hơn
    duration = min + (max - min) * (0.4 + Math.random() * 0.6); // 40-100% range
  } else if (preference === 'low') {
    // User không thích → đọc ít hơn
    duration = min + (max - min) * Math.random() * 0.4; // 0-40% range
  } else {
    // Neutral
    duration = min + Math.random() * (max - min);
  }
  
  return Math.floor(duration);
};

// Hàm tạo viewCount với bias
const generateViewCountWithBias = (preference = 'neutral') => {
  if (preference === 'high') {
    return Math.floor(Math.random() * 3) + 3; // 3-5 lần xem
  } else if (preference === 'low') {
    return Math.floor(Math.random() * 2) + 1; // 1-2 lần xem
  } else {
    return Math.floor(Math.random() * 5) + 1; // 1-5 lần xem
  }
};

// Hàm chọn interaction score theo phân bố (DEPRECATED - dùng calculateMaxInteractionScore thay thế)
const selectInteractionScore = () => {
  const rand = Math.random();
  let cumulative = 0;
  
  for (const dist of INTERACTION_CONFIG.scoreDistribution) {
    cumulative += dist.weight;
    if (rand <= cumulative) {
      return dist.score;
    }
  }
  
  return 3; // Fallback
};

// Hàm chọn sách cho user dựa trên faculty bias (ưu tiên nhưng không tuyệt đối)
const selectBooksForUser = (userFaculty, allBooks, bookCount) => {
  const facultyBias = INTERACTION_CONFIG.facultyBookBias[userFaculty] || 
    { 'Khoa học tự nhiên': 0.25, 'Công nghệ thông tin': 0.25, 'Kinh tế': 0.20, 'Giáo dục': 0.15, 'Văn học': 0.10, 'Triết học': 0.05 };

  const selectedBooks = [];
  const usedBookIds = new Set();

  // Đảm bảo có đủ sách để chọn
  if (allBooks.length === 0) {
    return [];
  }

  // Giảm bookCount nếu lớn hơn số sách có sẵn
  const maxPossibleBooks = Math.min(bookCount, allBooks.length);

  // Tạo weighted pool của sách theo category bias
  const categoryBooks = {};
  allBooks.forEach(book => {
    if (!categoryBooks[book.category]) {
      categoryBooks[book.category] = [];
    }
    categoryBooks[book.category].push(book);
  });

  // Chọn sách theo bias nhưng đảm bảo đa dạng (60% theo bias, 40% random)
  for (let i = 0; i < maxPossibleBooks; i++) {
    let selectedBook = null;
    let attempts = 0;
    
    while (!selectedBook && attempts < 50) {
      attempts++;
      
      // Chọn category theo bias (60% theo bias, 40% random để đảm bảo đa dạng)
      let targetCategory;
      if (Math.random() < 0.6) {
        // Chọn theo faculty bias
        const rand = Math.random();
        let cumulative = 0;
        
        for (const [category, weight] of Object.entries(facultyBias)) {
          cumulative += weight;
          if (rand <= cumulative) {
            targetCategory = category;
            break;
          }
        }
      } else {
        // Chọn random category để đảm bảo đa dạng
        const categories = Object.keys(categoryBooks);
        targetCategory = categories[Math.floor(Math.random() * categories.length)];
      }
      
      // Chọn sách trong category đã chọn
      if (categoryBooks[targetCategory] && categoryBooks[targetCategory].length > 0) {
        const availableBooks = categoryBooks[targetCategory].filter(book => !usedBookIds.has(book._id.toString()));
        
        if (availableBooks.length > 0) {
          selectedBook = availableBooks[Math.floor(Math.random() * availableBooks.length)];
          usedBookIds.add(selectedBook._id.toString());
        }
      }
      
      // Nếu không tìm được sách trong category mong muốn, chọn random từ tất cả sách còn lại
      if (!selectedBook) {
        const availableBooks = allBooks.filter(book => !usedBookIds.has(book._id.toString()));
        if (availableBooks.length > 0) {
          selectedBook = availableBooks[Math.floor(Math.random() * availableBooks.length)];
          usedBookIds.add(selectedBook._id.toString());
        }
      }
    }
    
    if (selectedBook) {
      selectedBooks.push(selectedBook);
    } else {
      // Nếu vẫn không chọn được sách, thoát khỏi vòng lặp
      break;
    }
  }

  // Đảm bảo mỗi user có ít nhất 5 cuốn sách để model train tốt
  if (selectedBooks.length < 5 && allBooks.length >= 5) {
    const needMore = 5 - selectedBooks.length;
    const availableBooks = allBooks.filter(book => !usedBookIds.has(book._id.toString()));
    
    // Thêm sách random cho đủ 5 cuốn
    for (let i = 0; i < needMore && i < availableBooks.length; i++) {
      const randomBook = availableBooks[Math.floor(Math.random() * availableBooks.length)];
      if (!usedBookIds.has(randomBook._id.toString())) {
        selectedBooks.push(randomBook);
        usedBookIds.add(randomBook._id.toString());
      }
    }
  }

  return selectedBooks;
};

// Hàm tạo duration realistic
const generateDuration = () => {
  const { min, max } = INTERACTION_CONFIG.durationRange;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Hàm tạo timestamp trong khoảng thời gian gần đây
const generateRecentTimestamp = () => {
  const now = Date.now();
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000); // 30 ngày trước
  return new Date(thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo));
};

// Hàm tạo interactions cho tất cả users
const createRecentlyViewedInteractions = async () => {
  try {
    console.log('📚 TẠO RECENTLY VIEWED INTERACTIONS');
    console.log('='*50);

    // Lấy tất cả students và books
    const students = await User.find({ role: 'student' }).select('_id name faculty major');
    const allBooks = await Book.find().select('_id title category documentType');

    console.log(`📊 Dữ liệu có sẵn:`);
    console.log(`   - Students: ${students.length}`);
    console.log(`   - Books: ${allBooks.length}`);

    if (students.length === 0 || allBooks.length === 0) {
      console.log('❌ Không có đủ dữ liệu để tạo interactions');
      return;
    }

    // Xóa interactions cũ nếu có
    const existingCount = await RecentlyViewed.countDocuments();
    if (existingCount > 0) {
      console.log(`🗑️  Xóa ${existingCount} interactions cũ...`);
      await RecentlyViewed.deleteMany({});
    }

    console.log(`\n🔄 Bắt đầu tạo interactions cho ${students.length} students...`);

    let totalInteractions = 0;
    let processedUsers = 0;

    // Tạo interactions cho từng user
    for (const student of students) {
      try {
        // Chọn số sách cho user này
        const bookCount = selectBooksCountForUser();
        
        // Chọn sách phù hợp với faculty của user
        let selectedBooks = selectBooksForUser(student.faculty, allBooks, bookCount);

        // Đảm bảo mỗi user có ít nhất 5 cuốn sách để train model tốt
        if (selectedBooks.length === 0) {
          console.log(`⚠️  Không thể tạo interactions theo faculty bias cho user ${student.name}, chọn sách random...`);
          // Fallback: chọn random 5-8 cuốn sách để đảm bảo đủ dữ liệu
          const fallbackCount = Math.floor(Math.random() * 4) + 5; // 5-8 sách
          const shuffledBooks = [...allBooks].sort(() => 0.5 - Math.random());
          selectedBooks = shuffledBooks.slice(0, Math.min(fallbackCount, allBooks.length));
        }

        // Tạo RecentlyViewed document với phân bố rating đẹp
        const viewedBooks = selectedBooks.map((book, index) => {
          const timestamp = generateRecentTimestamp();
          
          // Tạo preference pattern để đa dạng hóa rating
          let preference = 'neutral';
          const rand = Math.random();
          
          if (rand < 0.25) preference = 'high';    // 25% sách user thích
          else if (rand > 0.8) preference = 'low'; // 20% sách user không thích
          // 55% còn lại neutral
          
          const duration = generateDurationWithBias(preference);
          const viewCount = generateViewCountWithBias(preference);
          
          // Tính maxInteractionScore với improved distribution
          const maxInteractionScore = calculateMaxInteractionScore(
            duration, 
            viewCount, 
            index, 
            selectedBooks.length
          );
          
          // lastInteractionScore có thể nhỏ hơn hoặc bằng maxInteractionScore (cũng là số nguyên)
          const lastInteractionScore = Math.max(1, Math.min(maxInteractionScore, 
            maxInteractionScore - Math.floor(Math.random() * 2) // có thể thấp hơn 0-1 điểm
          ));

          return {
            bookId: book._id,
            lastViewedAt: timestamp,
            lastDuration: duration,
            lastInteractionScore: lastInteractionScore,
            totalDuration: duration * viewCount,
            viewCount: viewCount,
            maxInteractionScore: maxInteractionScore,
            firstViewedAt: new Date(timestamp.getTime() - (Math.random() * 7 * 24 * 60 * 60 * 1000)) // Trong vòng 1 tuần trước
          };
        });

        // Sắp xếp theo thời gian xem gần nhất
        viewedBooks.sort((a, b) => b.lastViewedAt - a.lastViewedAt);

        // Tạo document
        await RecentlyViewed.create({
          userId: student._id,
          viewedBooks: viewedBooks,
          lastUpdated: new Date()
        });

        totalInteractions += selectedBooks.length;
        processedUsers++;

        // Log progress
        if (processedUsers % 25 === 0) {
          console.log(`   ✓ Đã xử lý ${processedUsers}/${students.length} users`);
        }

      } catch (error) {
        console.error(`❌ Lỗi khi tạo interactions cho user ${student.name}:`, error.message);
      }
    }

    console.log(`\n📊 KẾT QUÁ TẠO INTERACTIONS:`);
    console.log(`   ✅ Thành công: ${processedUsers} users`);
    console.log(`   ❌ Thất bại: ${students.length - processedUsers} users`);
    console.log(`   📈 Tổng interactions: ${totalInteractions}`);
    console.log(`   📊 Trung bình: ${(totalInteractions/processedUsers).toFixed(1)} interactions/user`);

    // Hiển thị thống kê phân bố
    console.log(`\n📋 THỐNG KÊ PHÂN BỐ ĐÃ TẠO:`);

    // Thống kê theo số sách/user
    const userBookCounts = await RecentlyViewed.aggregate([
      {
        $project: {
          userId: 1,
          bookCount: { $size: '$viewedBooks' }
        }
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lte: ['$bookCount', 10] }, then: '5-10 sách' },
                { case: { $lte: ['$bookCount', 18] }, then: '11-18 sách' },
                { case: { $lte: ['$bookCount', 28] }, then: '19-28 sách' },
                { case: { $lte: ['$bookCount', 40] }, then: '29-40 sách' }
              ],
              default: 'Khác'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    userBookCounts.forEach(stat => {
      const percentage = ((stat.count / processedUsers) * 100).toFixed(1);
      console.log(`   - ${stat._id}: ${stat.count} users (${percentage}%)`);
    });

    // Thống kê theo maxInteractionScore (rating distribution)
    const ratingStats = await RecentlyViewed.aggregate([
      { $unwind: '$viewedBooks' },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $eq: ['$viewedBooks.maxInteractionScore', 1] }, then: '1' },
                { case: { $eq: ['$viewedBooks.maxInteractionScore', 2] }, then: '2' },
                { case: { $eq: ['$viewedBooks.maxInteractionScore', 3] }, then: '3' },
                { case: { $eq: ['$viewedBooks.maxInteractionScore', 4] }, then: '4' },
                { case: { $eq: ['$viewedBooks.maxInteractionScore', 5] }, then: '5' }
              ],
              default: 'Khác'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log(`\n⭐ PHÂN BỐ RATING (maxInteractionScore):`);
    let totalRatingCount = 0;
    ratingStats.forEach(stat => {
      totalRatingCount += stat.count;
    });
    
    ratingStats.forEach(stat => {
      const percentage = ((stat.count / totalRatingCount) * 100).toFixed(1);
      console.log(`   - Rating ${stat._id}: ${stat.count} interactions (${percentage}%)`);
    });

    // Tính rating trung bình
    const avgRatingResult = await RecentlyViewed.aggregate([
      { $unwind: '$viewedBooks' },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$viewedBooks.maxInteractionScore' },
          minRating: { $min: '$viewedBooks.maxInteractionScore' },
          maxRating: { $max: '$viewedBooks.maxInteractionScore' }
        }
      }
    ]);

    if (avgRatingResult.length > 0) {
      const stats = avgRatingResult[0];
      console.log(`\n📊 RATING STATISTICS:`);
      console.log(`   - Trung bình: ${stats.avgRating.toFixed(2)}/5.0`);
      console.log(`   - Min: ${stats.minRating}/5.0`);
      console.log(`   - Max: ${stats.maxRating}/5.0`);
    }

  } catch (error) {
    console.error('❌ Lỗi khi tạo RecentlyViewed interactions:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Đã đóng kết nối database');
  }
};

// Chạy script
const main = async () => {
  console.log('🚀 Bắt đầu tạo RecentlyViewed Interactions...\n');
  await connectDB();
  await createRecentlyViewedInteractions();
};

main().catch(console.error);
