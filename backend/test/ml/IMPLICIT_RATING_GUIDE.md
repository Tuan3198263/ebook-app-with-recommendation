# Collaborative Filtering Rating System Guide

## 📊 Tổng quan

Hệ thống rating mới được đơn giản hóa để sử dụng trực tiếp `maxInteractionScore` từ frontend làm rating chính cho Collaborative Filtering. Loại bỏ các công thức tính toán phức tạp và tập trung vào dữ liệu hành vi thực tế.

## ⭐ Rating System (Simplified)

### Rating chính = maxInteractionScore

**Công thức đơn giản:**

```
rating = maxInteractionScore (1-5)
```

- **Nguồn**: Được tính toán trực tiếp trên frontend (BookDetail.vue)
- **Thang điểm**: 1-5 (integer)
- **Đồng bộ**: Frontend và Backend sử dụng cùng giá trị

### Logic Frontend (BookDetail.vue)

```javascript
function calculateMaxInteractionScore() {
  let score = 1; // Base score

  // Time bonus: +1 point per 30 seconds (max +3)
  score += Math.min(Math.floor(readingTime / 30), 3);

  // Scroll bonus: +1 if >50%, +2 if >80%
  if (scrollDepth > 80) score += 2;
  else if (scrollDepth > 50) score += 1;

  // Deep engagement bonus: +1 if >2min + >70% scroll
  if (readingTime > 120 && scrollDepth > 70) score += 1;

  return Math.min(score, 5); // Cap at 5
}
```

### Điều kiện đạt điểm tối đa (5 điểm)

- ⏱️ **Thời gian đọc**: >= 90 giây (1.5 phút) → +3 điểm
- 📜 **Cuộn trang**: >= 80% → +2 điểm
- 🔥 **Deep engagement**: Thời gian >2 phút + cuộn >70% → +1 điểm
- 📊 **Tổng**: 1 + 3 + 2 = 6 → Cap tại 5 điểm

## 📁 Files được export (Updated)

### 1. collaborative_filtering_data.csv ⭐ MAIN

**Purpose**: Dữ liệu chính cho training hybrid ML models

**Structure (8 columns):**

```csv
user_id,book_id,rating,user_faculty,book_title,book_description,book_category,book_document_type
```

**Key Features:**

- ✅ **rating** = maxInteractionScore (1-5)
- ✅ **user_faculty** = Faculty-aware recommendations
- ✅ **book_title, book_description** = Content-based features
- ✅ **book_category, book_document_type** = Item categories

### 2. cf_matrix_simple.csv ⚡ BASIC CF

**Purpose**: Ma trận đơn giản cho thuật toán CF cơ bản

**Structure (3 columns):**

```csv
user_id,book_id,rating
```

**Key Features:**

- ✅ Chỉ có core data cần thiết
- ✅ Perfect cho basic CF algorithms
- ✅ Lightweight và fast loading

### 3. book_profiles.csv 📚 CONTENT-BASED

**Purpose**: Thông tin sách cho content-based filtering

**Structure:**

```csv
book_id,title,description,category,document_type,interaction_count,avg_rating
```

**Key Features:**

- ✅ **interaction_count** = Popularity indicator
- ✅ **avg_rating** = Quality indicator
- ✅ Content features cho hybrid recommendations

## ❌ Files đã được loại bỏ

- ~~user_profiles.csv~~ (redundant - có thể tính từ main data)
- ~~faculty_category_affinity.csv~~ (redundant - có thể groupby từ main data)
- ~~Các duration_score, frequency_score~~ (không cần thiết)

## 🔄 Backend Export Logic

```javascript
// Simplified export logic
const csvData = interactionData.map((item) => {
  const finalRating = item.max_interaction_score || 1;

  return {
    user_id: item.user_id.toString(),
    book_id: item.book_id.toString(),
    rating: finalRating.toString(), // Direct from maxInteractionScore
    user_faculty: item.user_faculty,
    book_title: item.book_title,
    book_description: cleanHtmlText(item.book_description),
    book_category: item.book_category,
    book_document_type: item.book_document_type,
  };
});
```

## 💡 ML Implementation Examples

### Basic Collaborative Filtering

```python
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

# Load simplified matrix
df = pd.read_csv('cf_matrix_simple_*.csv')

# Create user-item matrix
matrix = df.pivot(index='user_id', columns='book_id', values='rating')

# Calculate user similarity
user_similarity = cosine_similarity(matrix.fillna(0))
```

### Hybrid Recommendations

```python
# Load full dataset
df = pd.read_csv('collaborative_filtering_data_*.csv')

# Faculty-aware recommendations
faculty_bias = df.groupby(['user_faculty', 'book_category'])['rating'].mean()

# Content-based similarity using book features
from sklearn.feature_extraction.text import TfidfVectorizer
tfidf = TfidfVectorizer(stop_words='english')
book_features = tfidf.fit_transform(df['book_description'])
```

### User Analysis (replacing user_profiles.csv)

```python
# Calculate user stats from main data
user_stats = df.groupby('user_id').agg({
    'rating': ['count', 'mean'],
    'user_faculty': 'first'
}).round(2)

user_stats.columns = ['interaction_count', 'avg_rating', 'faculty']
```

## ✅ Lợi ích của hệ thống mới

### 🎯 **Simplicity**

- ❌ Loại bỏ công thức phức tạp
- ✅ Rating trực tiếp từ frontend behavior
- ✅ Ít file CSV hơn để quản lý

### 📊 **Consistency**

- ✅ Frontend và Backend sử dụng cùng rating
- ✅ Không có discrepancy giữa systems
- ✅ Dữ liệu đáng tin cậy hơn

### ⚡ **Performance**

- ✅ Export nhanh hơn (ít tính toán)
- ✅ File nhỏ hơn (ít columns)
- ✅ ML training hiệu quả hơn

### 🔧 **Maintainability**

- ✅ Code đơn giản hơn
- ✅ Dễ debug và troubleshoot
- ✅ Focus vào core ML features

## 🚀 Workflow Recommendation

1. **Data Generation**: `npm run test:create-users`, `npm run test:create-interactions`
2. **Data Export**: `npm run ml:export-cf`
3. **ML Training**: Upload CSV to Google Colab
4. **Model Evaluation**: Test on holdout data
5. **Production**: Deploy trained model

Rating system đã được tối ưu hoá cho máy học! 🎯
