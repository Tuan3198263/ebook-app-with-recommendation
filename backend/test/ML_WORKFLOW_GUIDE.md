# 🚀 ML Data Generation Workflow Guide

## 📋 Tổng quan quy trình

Quy trình tạo dữ liệu cho Machine Learning gồm 4 bước chính:

1. **🗑️ Xóa dữ liệu cũ** (deleteStudentUsers)
2. **👥 Tạo users** (createUsers)
3. **📚 Tạo interactions** (createRecentlyViewed)
4. **📤 Export data** (exportCollaborativeFilteringData)

---

## 🔄 Workflow chi tiết

### **Bước 1: Xóa student users cũ** 🗑️

**Mục đích:** Làm sạch database để tạo dữ liệu mới

```bash
# Chạy với flag --force để xác nhận xóa
npm run user:delete -- --force
```

**⚠️ Lưu ý quan trọng:**

- Script này sẽ xóa **TẤT CẢ** users có role = 'student'
- Xóa luôn recently viewed data của các student users
- **KHÔNG** xóa admin/teacher users
- Bắt buộc phải dùng `--force` flag để tránh xóa nhầm

**Output mong đợi:**

```
✅ Đã xóa student users: 1000
✅ Đã xóa recently viewed: 5000
📈 Student users còn lại: 0
📈 Tổng users còn lại: 5 (admin/teacher)
```

---

### **Bước 2: Tạo student users mới** 👥

**Mục đích:** Tạo 1000 student users với phân bố đồng đều theo khoa

```bash
npm run user:create
```

**Tự động tạo:**

- **1000 student users** (default)
- **Phân bố đồng đều** theo 6 khoa (~167 users/khoa)
- **Email unique** (tự động handle collision)
- **Password mặc định:** "123456"
- **Chỉ role 'student'**

**Output mong đợi:**

```
👥 KẾT QUÁ TẠO USER:
✅ Đã tạo thành công: 1000/1000 users
📊 PHÂN BỐ THEO KHOA:
   - Công nghệ Thông tin: 167 users (16.7%)
   - Khoa học Tự nhiên: 167 users (16.7%)
   - Kinh tế: 166 users (16.6%)
   [...]
```

**Customize số lượng:**

```bash
# Tạo 500 users thay vì 1000
node test/user/createUsers.js 500
```

---

### **Bước 3: Tạo interaction data** 📚

**Mục đích:** Tạo dữ liệu tương tác realistic giữa users và books

```bash
npm run interaction:create
```

**Tự động tạo:**

- **5-15 interactions** per user (random)
- **maxInteractionScore** realistic (1-5) với phân bố đẹp
- **Faculty bias** (ưu tiên sách của khoa mình)
- **Preference patterns** (25% high, 55% neutral, 20% low)
- **Position bias** (sách đầu tiên có tỷ lệ cao hơn)

**Algorithm highlights:**

```javascript
// Faculty bias: 70% sách của khoa mình, 30% khoa khác
// Preference distribution:
//   - 25% high preference (rating 4-5)
//   - 55% neutral (rating 2-4)
//   - 20% low preference (rating 1-2)
// Position bias: Sách đầu có 2x probability
```

**Output mong đợi:**

```
📊 KẾT QUÁ TẠO INTERACTIONS:
✅ Đã tạo cho 1000/1000 users
📈 Tổng interactions: ~8500
📊 Rating distribution:
   - Rating 1: 850 (10%)
   - Rating 2: 1700 (20%)
   - Rating 3: 2975 (35%)
   - Rating 4: 2125 (25%)
   - Rating 5: 850 (10%)
📊 Faculty bias successful: 70% same-faculty interactions
```

---

### **Bước 4: Export dữ liệu cho ML** 📤

**Mục đích:** Tạo CSV files cho training ML models

```bash
npm run ml:export-cf
```

**Files được tạo:**

1. **collaborative*filtering_data*[timestamp].csv** ⭐ (Main - 8 columns)
2. **cf*matrix_simple*[timestamp].csv** ⚡ (Basic CF - 3 columns)
3. **book*profiles*[timestamp].csv** 📚 (Content features)
4. **export*summary*[timestamp].txt** 📋 (Documentation)

**Output mong đợi:**

```
📊 EXPORT SUMMARY:
✅ Main dataset: collaborative_filtering_data_2025-08-03T10-30-00.csv
✅ Simplified matrix: cf_matrix_simple_2025-08-03T10-30-00.csv
✅ Book profiles: book_profiles_2025-08-03T10-30-00.csv

📈 DATASET STATISTICS:
- Total interactions: 8543
- Unique users: 1000
- Unique books: 156
- Average rating: 2.85/5
- Matrix density: 5.48%
```

**Folder output:**

```
backend/test/ml/exports/
├── collaborative_filtering_data_2025-08-03T10-30-00.csv
├── cf_matrix_simple_2025-08-03T10-30-00.csv
├── book_profiles_2025-08-03T10-30-00.csv
└── export_summary_2025-08-03T10-30-00.txt
```

---

## 🔧 Commands tham khảo

### **Full workflow (chạy tuần tự):**

```bash
# Bước 1: Xóa dữ liệu cũ
npm run user:delete -- --force

# Bước 2: Tạo 1000 users
npm run user:create

# Bước 3: Tạo interactions
npm run interaction:create

# Bước 4: Export cho ML
npm run ml:export-cf
```

### **Commands kiểm tra:**

```bash
# Kiểm tra user statistics
npm run user:stats

# Kiểm tra interaction statistics
npm run interaction:stats

# Kiểm tra user details
npm run user:check
```

### **Commands tùy chỉnh:**

```bash
# Tạo số lượng user khác (thay vì 1000)
node test/user/createUsers.js 500

# Xóa chỉ một phần users (manual)
node test/user/deleteStudentUsers.js --force

# Export với custom settings
node test/ml/exportCollaborativeFilteringData.js
```

---

## ⚠️ Lưu ý quan trọng

### **Trước khi chạy:**

- ✅ Đảm bảo MongoDB đang chạy
- ✅ Có đủ books trong database (ít nhất 50 books)
- ✅ Backup database nếu cần (prod environment)

### **Sau khi chạy:**

- ✅ Kiểm tra file CSV trong `test/ml/exports/`
- ✅ Validate data quality bằng `npm run interaction:stats`
- ✅ Upload CSV files lên Google Colab để train ML

### **Troubleshooting:**

- 🔍 Nếu createUsers fail: Kiểm tra unique email constraints
- 🔍 Nếu createInteractions fail: Kiểm tra có đủ books không
- 🔍 Nếu export fail: Kiểm tra có interaction data không

---

## 🎯 Next Steps sau khi có CSV

### **Upload to Google Colab:**

```python
# Load main dataset
import pandas as pd
df = pd.read_csv('collaborative_filtering_data_*.csv')

# Basic CF matrix
cf_matrix = pd.read_csv('cf_matrix_simple_*.csv')

# Book features for content-based
books = pd.read_csv('book_profiles_*.csv')
```

### **ML Models to try:**

1. **User-based CF** (cosine similarity)
2. **Item-based CF** (item similarity)
3. **Matrix Factorization** (SVD, NMF)
4. **Neural CF** (deep learning)
5. **Hybrid** (CF + Content-based)

### **Evaluation metrics:**

- **RMSE** (Root Mean Square Error)
- **Precision@K** (relevant items in top K)
- **Recall@K** (coverage of relevant items)
- **NDCG@K** (ranking quality)

---

🎉 **Workflow hoàn chỉnh để tạo dữ liệu ML chất lượng cao!**
