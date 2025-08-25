# Machine Learning Data Export Guide (Optimized)

## 📁 Cấu trúc thư mục

```
backend/test/ml/
├── exportCollaborativeFilteringData.js  # Export dữ liệu thành CSV (simplified)
├── exports/                             # Thư mục chứa file CSV
├── IMPLICIT_RATING_GUIDE.md             # Hướng dẫn rating system
└── ML_EXPORT_GUIDE.md                   # File hướng dẫn này
```

## 🔧 Export Command

### Export dữ liệu cho Machine Learning

```bash
npm run ml:export-cf
```

**Chức năng:**

- ⚡ Sử dụng maxInteractionScore trực tiếp làm rating
- 📤 Export 4 file CSV tối ưu
- 📊 Generate summary statistics
- 📝 Tạo documentation file
- 🧹 Loại bỏ các trường không cần thiết

## 📊 Files được export (Optimized)

### **1. collaborative*filtering_data*[timestamp].csv** ⭐ MAIN DATASET

**Purpose**: Dữ liệu chính cho hybrid ML models

**Columns (8 trường):**

- `user_id`: ID người dùng
- `book_id`: ID sách
- `rating`: maxInteractionScore (1-5) - RATING CHÍNH
- `user_faculty`: Khoa của user (faculty-aware CF)
- `book_title`: Tên sách (content-based)
- `book_description`: Mô tả sách (content-based)
- `book_category`: Danh mục sách (content-based)
- `book_document_type`: Loại tài liệu (content-based)

**Sử dụng cho**: Hybrid CF, Neural CF, Matrix Factorization

### **2. cf*matrix_simple*[timestamp].csv** ⚡ BASIC CF

**Purpose**: Ma trận đơn giản cho thuật toán CF cơ bản

**Columns (3 trường):**

- `user_id`: ID người dùng
- `book_id`: ID sách
- `rating`: maxInteractionScore (1-5)

**Sử dụng cho**: User-based CF, Item-based CF, SVD

### **3. book*profiles*[timestamp].csv** 📚 CONTENT FEATURES

**Purpose**: Thông tin sách cho content-based filtering

**Columns:**

- `book_id`: ID sách
- `title`: Tên sách (cleaned)
- `description`: Mô tả sách (cleaned)
- `category`: Danh mục
- `document_type`: Loại tài liệu
- `interaction_count`: Số lượng tương tác (popularity)
- `avg_rating`: Rating trung bình (quality)

**Sử dụng cho**: Content-based filtering, popularity analysis

### **4. export*summary*[timestamp].txt** 📋 DOCUMENTATION

**Purpose**: Thống kê và metadata

**Content:**

- Dataset statistics
- Rating calculation method
- File structure documentation
- Next steps guide

## ⭐ Rating Calculation (Simplified)

**NEW APPROACH:**

```
rating = maxInteractionScore (direct from frontend)
```

**Loại bỏ:**

- ❌ Combined score với weighted formula
- ❌ Duration/frequency/recency calculations
- ❌ Complex normalization
- ❌ Multiple rating variants

**Frontend Rating Logic:**

```javascript
// BookDetail.vue - Simplified
function calculateMaxInteractionScore() {
  let score = 1; // Base score

  // Time bonus: +1 per 30s (max +3)
  score += Math.min(Math.floor(readingTime / 30), 3);

  // Scroll bonus: +1 if >50%, +2 if >80%
  if (scrollDepth > 80) score += 2;
  else if (scrollDepth > 50) score += 1;

  // Deep engagement: +1 if >2min + >70% scroll
  if (readingTime > 120 && scrollDepth > 70) score += 1;

  return Math.min(score, 5); // Cap at 5
}
```

**Benefits:**

- ✅ Frontend-Backend consistency
- ✅ Simplified export logic
- ✅ Faster processing
- ✅ Easier to understand and debug

## 🎯 ML Model Strategies (Updated)

### **1. Basic Collaborative Filtering**

```python
# Load simplified matrix
df = pd.read_csv('cf_matrix_simple_*.csv')

# Create user-item matrix
matrix = df.pivot(index='user_id', columns='book_id', values='rating')

# Calculate similarity
from sklearn.metrics.pairwise import cosine_similarity
user_similarity = cosine_similarity(matrix.fillna(0))
```

### **2. Hybrid Recommendations**

```python
# Load main dataset with content features
df = pd.read_csv('collaborative_filtering_data_*.csv')

# Faculty-aware CF
faculty_preferences = df.groupby(['user_faculty', 'book_category'])['rating'].mean()

# Content-based similarity
from sklearn.feature_extraction.text import TfidfVectorizer
tfidf = TfidfVectorizer(stop_words='english', max_features=1000)
book_features = tfidf.fit_transform(df['book_description'].fillna(''))
```

### **3. Matrix Factorization**

```python
# Using Surprise library
from surprise import Dataset, Reader, SVD
reader = Reader(rating_scale=(1, 5))
data = Dataset.load_from_df(df[['user_id', 'book_id', 'rating']], reader)

# Train SVD model
svd = SVD(n_factors=50, random_state=42)
```

### **4. Neural Collaborative Filtering**

```python
# Using TensorFlow/Keras
import tensorflow as tf

# Embedding layers for users and books
user_embedding = tf.keras.layers.Embedding(n_users, 50)
book_embedding = tf.keras.layers.Embedding(n_books, 50)

# Additional features: faculty, category as categorical inputs
```

## 📈 Expected Performance

### **Optimized Metrics:**

- **Matrix Density**: 1-3% (standard for rec systems)
- **User Coverage**: 90%+ (most users have interactions)
- **Item Coverage**: 70%+ (most books have interactions)
- **Average Rating**: 2.8-3.5 (realistic range)
- **Rating Distribution**: Balanced across 1-5 scale

### **Quality Indicators:**

- ✅ No duplicate user-item pairs
- ✅ Rating values strictly 1-5 (integer)
- ✅ All required fields populated
- ✅ Faculty distribution balanced
- ✅ Category distribution realistic

## 🚀 Optimized Workflow

### **Phase 1: Data Preparation**

```bash
# Generate test data
npm run test:create-users
npm run test:create-interactions

# Export for ML
npm run ml:export-cf
```

### **Phase 2: ML Development** (Google Colab)

1. **Upload CSV files** to Colab
2. **Load main dataset**: `pd.read_csv('collaborative_filtering_data_*.csv')`
3. **Basic EDA**: Check data quality, distributions
4. **Train models**: CF, Matrix Factorization, Hybrid
5. **Evaluate**: RMSE, Precision@K, Diversity metrics

### **Phase 3: Model Selection**

1. **Compare algorithms**: User-based vs Item-based vs SVD
2. **Hyperparameter tuning**: Grid search optimal parameters
3. **Cross-validation**: Ensure robust performance
4. **A/B testing setup**: Compare against existing system

### **Phase 4: Production Integration**

1. **Export model**: Save trained model (pickle/joblib)
2. **API integration**: Create recommendation endpoint
3. **Real-time inference**: Fast recommendation serving
4. **Monitoring**: Track click-through rates, conversions

## � Advanced Techniques (Simplified)

### **1. Faculty-aware Recommendations:**

```python
# Calculate faculty bias directly from main data
faculty_bias = df.groupby(['user_faculty', 'book_category'])['rating'].agg(['mean', 'count'])

# Apply bias to recommendations
def faculty_weighted_score(user_faculty, book_category, base_score):
    bias = faculty_bias.loc[(user_faculty, book_category), 'mean']
    return 0.8 * base_score + 0.2 * bias
```

### **2. Cold Start Solutions:**

```python
# New users: use faculty-based recommendations
def recommend_for_new_user(user_faculty):
    popular_in_faculty = df[df['user_faculty'] == user_faculty]\
        .groupby('book_id')['rating'].mean().sort_values(ascending=False)
    return popular_in_faculty.head(10)

# New books: use category-based recommendations
def recommend_new_book(book_category):
    category_lovers = df[df['book_category'] == book_category]['user_id'].unique()
    return category_lovers
```

### **3. Content Enhancement:**

```python
# Enhance book profiles with additional features
books = pd.read_csv('book_profiles_*.csv')

# TF-IDF on descriptions
from sklearn.feature_extraction.text import TfidfVectorizer
tfidf = TfidfVectorizer(max_features=500, stop_words='english')
book_content_features = tfidf.fit_transform(books['description'])

# Combine with CF scores
hybrid_score = 0.7 * cf_score + 0.3 * content_similarity_score
```

## 🔍 Quality Checks (Streamlined)

### **Data Validation:**

- ✅ Rating range: 1-5 (integer)
- ✅ No missing user_id/book_id
- ✅ Faculty distribution: ~16.7% per faculty (6 faculties)
- ✅ Category distribution: Balanced across book categories
- ✅ Interaction minimum: Each user has >= 5 interactions

### **Model Validation:**

- ✅ RMSE < 1.0 (good prediction accuracy)
- ✅ Coverage > 70% (diverse recommendations)
- ✅ Precision@10 > 0.3 (relevant recommendations)
- ✅ Faculty bias reasonable (not extreme)
- ✅ No cold start issues

## 📊 Success Metrics

### **Offline Evaluation:**

- **RMSE**: < 0.8 (excellent), < 1.0 (good)
- **Precision@K**: > 0.3 (K=10)
- **Recall@K**: > 0.2 (K=10)
- **Coverage**: > 70% of books recommended
- **Diversity**: Intra-list diversity > 0.7

### **Online Evaluation:**

- **Click-through Rate**: Improvement over baseline
- **Conversion Rate**: Downloads/purchases increase
- **Session Duration**: Users engage longer
- **Return Rate**: Users come back more frequently

Dữ liệu export đã được tối ưu hoá cho máy học hiệu quả! 🎯
