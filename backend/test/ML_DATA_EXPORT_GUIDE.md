# Hướng dẫn xuất dữ liệu cho Machine Learning

## Mô tả

File `exportBooksForML.js` được tạo để truy xuất dữ liệu sách từ MongoDB và xuất ra các định dạng phù hợp cho việc xây dựng model Content-Based Filtering.

## Chức năng chính

### 1. Xử lý dữ liệu

- **Loại bỏ HTML tags** từ trường `description`
- **Populate** thông tin category
- **Chỉ lấy 5 trường cần thiết**: id, title, category, documentType, description

### 2. Output files

#### `books_for_ml.json`

File JSON với 5 trường cần thiết:

```json
{
  "id": "book_id",
  "title": "Tên sách",
  "category": "Tên danh mục",
  "documentType": "textbook hoặc other",
  "description": "Mô tả đã loại bỏ HTML"
}
```

#### `books_for_ml.csv`

File CSV với 5 cột:

- id, title, category, documentType, description
- Phù hợp cho pandas, scikit-learn

#### `data_statistics.json`

Thống kê tổng quan về dataset:

- Số lượng sách, danh mục
- Loại tài liệu (documentType)

## Cách sử dụng

### 1. Chạy từ terminal

```bash
# Di chuyển vào thư mục backend
cd backend

# Chạy script export
npm run export:ml-data
```

### 2. Chạy trực tiếp

```bash
node test/exportBooksForML.js
```

## Yêu cầu

### Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/luanvan
```

### Dependencies

- mongoose
- fs (built-in)
- path (built-in)

## Features cho Content-Based Filtering

### Trường dữ liệu được xuất:

- **id**: ID sách (string)
- **title**: Tên sách (string)
- **category**: Tên danh mục (string)
- **documentType**: Loại tài liệu - textbook/other (string)
- **description**: Mô tả đã loại bỏ HTML tags (string)

## Sử dụng trong Python

```python
import pandas as pd
import json

# Đọc dữ liệu CSV
df = pd.read_csv('test/ml_data/books_for_ml.csv')

# Hoặc đọc JSON
with open('test/ml_data/books_for_ml.json', 'r', encoding='utf-8') as f:
    books_data = json.load(f)

df_json = pd.DataFrame(books_data)

# Text feature chính cho TF-IDF
text_features = df['description'].fillna('')

# Categorical features
categorical_features = ['category', 'documentType']

# Xem thống kê
print(f"Số lượng sách: {len(df)}")
print(f"Số danh mục: {df['category'].nunique()}")
print(f"Loại tài liệu: {df['documentType'].unique()}")
```

## Lưu ý

- Script tự động tạo thư mục `test/ml_data/` nếu chưa có
- Chỉ lấy sách có `active: true`
- HTML tags được loại bỏ hoàn toàn từ description
- **Không chuẩn hóa text** - sẽ làm khi xây dựng model
- **Chỉ 5 trường cần thiết**: id, title, category, documentType, description
