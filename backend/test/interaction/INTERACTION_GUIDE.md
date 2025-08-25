# Hướng dẫn quản lý RecentlyViewed Interactions

## 📁 Cấu trúc thư mục

```
backend/test/interaction/
├── recentlyViewedStats.js       # Thống kê interactions hiện có
├── createRecentlyViewed.js      # Tạo interactions mới
└── INTERACTION_GUIDE.md        # File hướng dẫn này
```

## 🔧 Scripts đã thêm vào package.json

### 1. Thống kê Interactions hiện tại

```bash
npm run interaction:stats
```

**Chức năng:**

- Tổng quan interactions (users, books, views)
- Phân bố số sách theo user (1-5, 6-15, 16-25, 26-40)
- Top users có nhiều tương tác nhất
- Top sách được xem nhiều nhất
- Phân bố theo category sách
- Phân bố theo faculty của users
- Phân bố interaction scores (1-5)
- Timeline interactions theo ngày
- Data quality check (missing references, coverage)

### 2. Tạo RecentlyViewed Interactions

```bash
npm run interaction:create
```

**Chức năng:**

- Tạo interactions cho tất cả students trong database
- Phân bố realistic phù hợp cho Collaborative Filtering
- Faculty bias (users xem sách liên quan đến chuyên ngành)
- Mỗi user có 1-40 sách với distribution thực tế
- Interaction scores realistic (1-5)
- Timestamps trong 30 ngày gần đây

## 📊 Cấu hình Interactions phù hợp ML Model

### **User-Book Distribution (Realistic):**

- **20% users ít tương tác** (1-5 sách) - New users, ít thời gian
- **40% users tương tác trung bình** (6-15 sách) - Regular users
- **25% users tương tác nhiều** (16-25 sách) - Active users
- **15% users rất tích cực** (26-40 sách) - Power users, researchers

### **Faculty Bias (Content-based + Collaborative):**

Mỗi faculty có xu hướng xem sách theo tỷ lệ:

- **Công nghệ thông tin**: 50% Công nghệ, 20% Khoa học, 30% khác
- **Khoa học Tự nhiên**: 60% Khoa học, 20% Công nghệ, 20% khác
- **Kinh tế**: 50% Kinh tế, 15% Khoa học, 35% khác
- **Sư phạm**: 45% Giáo dục, 20% Khoa học, 35% khác
- **Khoa học Xã hội**: 40% Văn học, 25% Giáo dục, 35% khác
- **Nông nghiệp**: 45% Khoa học, 20% Công nghệ, 35% khác
- **Thủy sản**: 50% Khoa học, 20% Công nghệ, 30% khác
- **Môi trường**: 55% Khoa học, 25% Công nghệ, 20% khác

### **Interaction Score Distribution:**

- **Score 1** (5%): Không thích, xem qua loa
- **Score 2** (15%): Ít thích, không phù hợp
- **Score 3** (40%): Bình thường, có ích nhưng không nổi bật
- **Score 4** (30%): Thích, hữu ích cho học tập
- **Score 5** (10%): Rất thích, rất hữu ích, recommends cho bạn bè

### **Temporal Patterns:**

- **firstViewedAt**: 1-30 ngày trước (random)
- **lastViewedAt**: Trong 30 ngày gần đây
- **viewCount**: 1-5 lần xem cho mỗi sách
- **totalDuration**: 30 giây - 10 phút (realistic reading time)

## 🎯 Đặc điểm dữ liệu cho Machine Learning

### **Sparsity Control:**

- Target user coverage: 80-90% (≥160/200 users có interactions)
- Average interactions/user: 12-15 sách
- Tổng interactions: ~2400-3000 user-book pairs

### **Faculty-Category Alignment:**

- 70% interactions theo faculty bias (realistic behavior)
- 30% cross-faculty interactions (exploration, diversity)
- Giảm cold start problem nhờ faculty information

### **Quality Metrics:**

- Interaction score trung bình: 2.8-3.2/5
- Duration trung bình: 2-4 phút/interaction
- View count trung bình: 1.8-2.5 lần/sách

### **Popular Books Pattern (80/20 Rule):**

- 20% sách sẽ có 80% total views (popular books)
- Tạo long tail distribution realistic
- Giúp model học được popularity patterns

## 📝 Ví dụ RecentlyViewed document được tạo

```javascript
{
  userId: ObjectId("..."),
  viewedBooks: [
    {
      bookId: ObjectId("..."),
      lastViewedAt: "2025-07-15T10:30:00.000Z",
      lastDuration: 180000,        // 3 phút
      lastInteractionScore: 4,     // Thích sách này
      totalDuration: 540000,       // 9 phút tổng
      viewCount: 3,                // Đã xem 3 lần
      maxInteractionScore: 4,      // Score cao nhất
      firstViewedAt: "2025-07-10T09:15:00.000Z"
    },
    // ... 5-25 sách khác
  ],
  lastUpdated: "2025-07-15T10:30:00.000Z"
}
```

## 🚀 Workflow đề xuất

### **Bước 1: Kiểm tra hiện trạng users**

```bash
npm run user:stats
```

Đảm bảo có ≥150 students với faculty/major đầy đủ.

### **Bước 2: Kiểm tra interactions hiện có**

```bash
npm run interaction:stats
```

### **Bước 3: Tạo interactions mới**

```bash
npm run interaction:create
```

### **Bước 4: Verify kết quả**

```bash
npm run interaction:stats
```

### **Bước 5: Export data cho ML model**

Tạo script export interactions cho Collaborative Filtering.

## ⚠️ Lưu ý quan trọng

### **Database Impact:**

- Script sẽ **XÓA TẤT CẢ** RecentlyViewed cũ trước khi tạo mới
- Sử dụng RecentlyViewed.create() tuân thủ schema validation
- Connection được đóng tự động sau completion

### **Realistic Behavior Modeling:**

- Faculty bias phản ánh hành vi thực tế sinh viên
- Interaction scores có phân bố realistic (ít extreme values)
- Temporal patterns mô phỏng activity gần đây
- Duration và view count reasonable cho reading behavior

### **ML Model Readiness:**

- User coverage ≥80% đảm bảo đủ dữ liệu cho CF
- Faculty information giải quyết cold start problem
- Interaction scores làm implicit feedback cho recommendation
- Temporal data cho time-based recommendations

### **Performance Considerations:**

- Batch processing 25 users một lần để tránh memory issues
- Aggregation queries được optimize với indexes
- Error handling cho từng user riêng biệt

## 🔄 Next Steps

Sau khi tạo interactions:

1. **Export data cho Collaborative Filtering model**
2. **Analyze user similarity patterns**
3. **Build User-based CF model** trên Google Colab
4. **Integrate recommendations** vào API endpoints
5. **A/B test** Content-based vs Collaborative Filtering

RecentlyViewed data này sẽ là core dataset cho Collaborative Filtering system! 🎯

## 📊 Expected Results

Với 200 students và cấu hình này, expected output:

- **~180-190 users** có interactions (90%+ coverage)
- **~2500-3000 total** user-book interactions
- **~13-15 interactions/user** trung bình
- **Faculty bias** rõ ràng nhưng vẫn có diversity
- **Quality scores** phân bố realistic cho training

Dữ liệu này sẽ cho phép training Collaborative Filtering model hiệu quả với matrix factorization hoặc deep learning approaches! 🚀
