import mongoose from 'mongoose';

// Schema cho từng item đã xem (embedded)
const viewedItemSchema = new mongoose.Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  
  // Thông tin lần xem gần nhất
  lastViewedAt: {
    type: Date,
    default: Date.now
  },
  lastDuration: {
    type: Number,
    default: 0
  },
  lastInteractionScore: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  
  // Thông tin tích lũy (cho recommendation)
  totalDuration: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 1,
    min: 1
  },
  maxInteractionScore: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  
  // Metadata
  firstViewedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false }); // Không cần _id cho embedded schema

const recentlyViewedSchema = new mongoose.Schema({
  // User identifier - chỉ cho user đã đăng nhập
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'UserId là bắt buộc']
  },
  
  // Array chứa tất cả sách đã xem (tối đa 40)
  viewedBooks: {
    type: [viewedItemSchema],
    default: [],
    validate: [arrayLimit, 'Danh sách xem không được vượt quá 40 sách']
  },
  
  // Thời gian cập nhật cuối
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Validator để giới hạn tối đa 40 sách
function arrayLimit(val) {
  return val.length <= 40;
}

// Indexes cho performance
recentlyViewedSchema.index({ userId: 1 });
recentlyViewedSchema.index({ lastUpdated: 1 });

// Middleware để cập nhật lastUpdated trước khi save
recentlyViewedSchema.pre('save', function(next) {
  // Cập nhật lastUpdated
  this.lastUpdated = new Date();
  next();
});

// Static method: Thêm hoặc cập nhật sách đã xem
recentlyViewedSchema.statics.addOrUpdateView = async function(userId, bookId, duration = 0, interactionScore = 1) {
  // Validate và giới hạn input
  const validDuration = Math.max(0, duration);
  const validScore = Math.max(1, Math.min(5, interactionScore));
  
  // Tìm hoặc tạo document cho user
  let userHistory = await this.findOne({ userId });
  
  if (!userHistory) {
    // Tạo mới nếu chưa có
    userHistory = new this({
      userId,
      viewedBooks: []
    });
  }
  
  // Kiểm tra xem sách đã tồn tại trong lịch sử chưa
  const existingIndex = userHistory.viewedBooks.findIndex(
    item => item.bookId.toString() === bookId.toString()
  );
  
  if (existingIndex !== -1) {
    // CẬP NHẬT sách đã có - GIỮ THÔNG TIN QUAN TRỌNG
    const existingItem = userHistory.viewedBooks[existingIndex];
    
    // Cập nhật thông tin lần xem gần nhất
    existingItem.lastViewedAt = new Date();
    existingItem.lastDuration = validDuration;
    existingItem.lastInteractionScore = validScore;
    
    // TÍCH LŨY thông tin
    existingItem.totalDuration = (existingItem.totalDuration || 0) + validDuration;
    existingItem.viewCount = (existingItem.viewCount || 1) + 1;
    existingItem.maxInteractionScore = Math.max(
      existingItem.maxInteractionScore || 1, 
      validScore
    );
    
    // Di chuyển lên đầu danh sách (recent activity)
    userHistory.viewedBooks.splice(existingIndex, 1);
    userHistory.viewedBooks.unshift(existingItem);
  } else {
    // THÊM SÁCH MỚI
    const now = new Date();
    const newItem = {
      bookId: bookId,
      
      // Thông tin lần xem gần nhất
      lastViewedAt: now,
      lastDuration: validDuration,
      lastInteractionScore: validScore,
      
      // Thông tin tích lũy
      totalDuration: validDuration,
      viewCount: 1,
      maxInteractionScore: validScore,
      firstViewedAt: now
    };
    
    userHistory.viewedBooks.unshift(newItem);
  }
  
  // Giới hạn tối đa 40 sách (xóa những sách cũ nhất)
  if (userHistory.viewedBooks.length > 40) {
    userHistory.viewedBooks = userHistory.viewedBooks.slice(0, 40);
  }
  
  await userHistory.save();
  return userHistory;
};

// Static method: Lấy lịch sử xem gần đây
recentlyViewedSchema.statics.getRecentViews = async function(userId, limit = 20) {
  const userHistory = await this.findOne({ userId })
    .populate('viewedBooks.bookId', 'title slug coverImages category authors documentType averageRating description');
  
  if (!userHistory) {
    return { viewedBooks: [] };
  }
  
  // Giới hạn số lượng trả về
  const limitedBooks = userHistory.viewedBooks.slice(0, limit);
  
  return {
    ...userHistory.toObject(),
    viewedBooks: limitedBooks
  };
};

// Static method: Lấy dữ liệu tương tác (cho recommendation)
recentlyViewedSchema.statics.getUserInteractions = async function(userId) {
  const userHistory = await this.findOne({ userId })
    .populate('viewedBooks.bookId', 'category authors documentType keywords contentVector description title averageRating');
  
  if (!userHistory || !userHistory.viewedBooks.length) {
    return { viewedBooks: [] };
  }
  
  // Enrich data cho recommendation system
  const enrichedBooks = userHistory.viewedBooks.map(item => ({
    ...item.toObject(),
    
    // Metrics cho ML
    engagementScore: calculateEngagementScore(item),
    interestLevel: calculateInterestLevel(item),
    recencyWeight: calculateRecencyWeight(item.lastViewedAt || item.viewedAt),
    
    // Normalized metrics (0-1)
    normalizedDuration: Math.min(1, (item.totalDuration || 0) / 300000), // Max 5 phút
    normalizedViewCount: Math.min(1, (item.viewCount || 1) / 10), // Max 10 lần xem
    normalizedScore: ((item.maxInteractionScore || 1) - 1) / 4 // Scale 1-5 → 0-1
  }));
  
  return {
    ...userHistory.toObject(),
    viewedBooks: enrichedBooks
  };
};

// Helper functions cho recommendation metrics
function calculateEngagementScore(item) {
  const viewCount = item.viewCount || 1;
  const totalDuration = item.totalDuration || 0;
  const maxScore = item.maxInteractionScore || 1;
  
  // Weighted score: viewCount * duration * interaction
  return (viewCount * 0.3) + (Math.min(totalDuration/60000, 5) * 0.4) + (maxScore * 0.3);
}

function calculateInterestLevel(item) {
  const maxScore = item.maxInteractionScore || 1;
  const viewCount = item.viewCount || 1;
  
  if (maxScore >= 4 && viewCount >= 2) return 'high';
  if (maxScore >= 3 || viewCount >= 3) return 'medium';
  return 'low';
}

function calculateRecencyWeight(date) {
  const daysSince = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0.1, 1 - (daysSince / 30)); // Decay over 30 days
}

// Static method: Xóa một sách khỏi lịch sử
recentlyViewedSchema.statics.removeBook = async function(userId, bookId) {
  const result = await this.updateOne(
    { userId },
    { 
      $pull: { viewedBooks: { bookId: bookId } },
      $set: { lastUpdated: new Date() }
    }
  );
  
  return result.modifiedCount > 0;
};

// Static method: Xóa toàn bộ lịch sử
recentlyViewedSchema.statics.clearHistory = async function(userId) {
  const result = await this.updateOne(
    { userId },
    { 
      $set: { 
        viewedBooks: [],
        lastUpdated: new Date()
      }
    }
  );
  
  return result.modifiedCount > 0;
};

// Static method: Migration script cho dữ liệu cũ
recentlyViewedSchema.statics.migrateOldData = async function() {
  console.log('🔄 Starting migration of old recently viewed data...');
  
  const documents = await this.find({});
  let migratedCount = 0;
  
  for (const doc of documents) {
    let hasChanges = false;
    
    for (const item of doc.viewedBooks) {
      // Migrate old format to new format
      if (!item.lastViewedAt && item.viewedAt) {
        item.lastViewedAt = item.viewedAt;
        item.firstViewedAt = item.viewedAt;
        hasChanges = true;
      }
      
      if (!item.lastDuration && item.duration !== undefined) {
        item.lastDuration = item.duration;
        item.totalDuration = item.duration;
        hasChanges = true;
      }
      
      if (!item.lastInteractionScore && item.interactionScore) {
        item.lastInteractionScore = item.interactionScore;
        item.maxInteractionScore = item.interactionScore;
        hasChanges = true;
      }
      
      if (!item.viewCount) {
        item.viewCount = 1;
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      await doc.save();
      migratedCount++;
    }
  }
  
  console.log(`✅ Migration completed! Updated ${migratedCount} documents.`);
  return migratedCount;
};

const RecentlyViewed = mongoose.model('RecentlyViewed', recentlyViewedSchema);

export default RecentlyViewed;
