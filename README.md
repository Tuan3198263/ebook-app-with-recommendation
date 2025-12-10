# 📚 Hệ Thống Sách Điện Tử – Tích Hợp Gợi Ý  
🌐 Demo: http://ebookctu.ddns.net/


Hệ thống cho phép người dùng xem sách, tìm kiếm, mua sách, quản lý tài khoản, và nhận gợi ý sách dựa trên hành vi cá nhân.  
---

## ⚙️ 1. Cài đặt & Chạy dự án trên máy local

### 📥 Clone dự án
```bash
git clone https://github.com/Tuan3198263/ebook-app-with-recommendation
cd ebook-app-with-recommendation
```
---

## 🖥️ Backend

### 📦 Cài đặt dependencies
```bash
cd backend
npm install
```

### 🔧 Tạo file môi trường `.env`
Ví dụ:
```
# JWT secret key
JWT_SECRET=your_jwt_secret_key

# Database
DB_URI=your_database_uri

# Cloudinary configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Admin verification
ADMIN_VERIFICATION_CODE=your_admin_verification_code

# Email service
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_password

# Server port
PORT=3000

# URLs
BACKEND_URL=your_backend_url
FRONTEND_URL=your_frontend_url

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=your_aws_region
AWS_S3_BUCKET=your_aws_s3_bucket

# VNPay Configuration (Thông tin chính thức từ VNPay)
VNP_TMN_CODE=your_vnp_tmn_code
VNP_HASH_SECRET=your_vnp_hash_secret
VNP_URL=your_vnp_payment_url
VNP_API_URL=your_vnp_api_url
VNP_RETURN_URL=your_vnp_return_url
VNP_IPN_URL=your_vnp_ipn_url

```

### ▶️ Chạy server Backend
```bash
npm run dev
```
---

## 🌐 Frontend

### 📦 Cài đặt dependencies
```bash
cd ../frontend
npm install
```
### 🔧 Tạo file môi trường `.env`
```
# GHN Production
VITE_GHN_API_TOKEN=your_gnh_prod_token_here
VITE_GHN_SHOP_ID=your_prod_shop_id

# GHN Development
VITE_GHN_API_TOKEN_DEV=your_gnh_dev_token_here
VITE_GHN_SHOP_ID_DEV=your_dev_shop_id

```

### ▶️ Chạy Frontend
```bash
npm run dev
```
---

## 🧠 Recommendation Service (Python + Flask)

### 📦 Cài đặt trường ảo (venv)
```bash
cd recommendation_service
python -m venv venv
```
### 📦 Kích hoạt môi trường ảo (venv)
```bash
Windowns: venv\Scripts\activate

MacOS / Linux: source venv/bin/activate

```
### 📦 Cài đặt dependencies
```bash
pip install flask numpy pandas gunicorn

```
### ▶️ Chạy Recommendation Service
```bash
python app_fix.py

```
---

## 🚀 2. Công nghệ sử dụng

- **Frontend:** HTML, CSS, JavaScript, Bootstrap, VueJS  
- **Backend:** Node.js + Express.js, Python + FLask.
- **Database:** MongoDB  

### 🔗 Tích hợp & Dịch vụ bên ngoài
- **VNPay API** – Thanh toán trực tuyến
- **AWS S3** – Lưu trữ file PDF / EPUB
- **Cloudinary** – Upload hình ảnh sản phẩm
---

## 📌 3. Chức năng chính

### 👤 Người dùng
- Đăng ký / đăng nhập  
- Hồ sơ cá nhân  
- Xem danh sách sách
- Tìm kiếm + bộ lọc  
- Xem chi tiết sách
- Yêu thích sách
- Đánh giá sách  
- Giỏ hàng (Thêm/xóa/cập nhật gói thuê/thanh toán)
- Thanh toán
- Bản quyền sách đã mua 
- Xem lịch sử đơn hàng  
- Đọc sách online (Tiện ích: Mục lục, dấu trang, ghi chú, tải PDF, tùy chỉnh giao diện...)
- Gợi ý tài liệu cá nhân hóa

  
### 🛠️ Quản trị viên
- Quản lý danh mục / tác giả
- Quản lý sách
- Quản lý đơn hàng  
- Quản lý người dùng  
---

## 🧱 4. Cấu trúc thư mục

```
project/
│
├── backend/
│   ├── src/
│   │   ├── controllers/      # Xử lý logic
│   │   ├── models/           # Schema Mongoose
│   │   ├── routes/           # API endpoint
│   │   ├── config/           # Cấu hình (DB, VNpay, AWS..)
│   │   ├── middleware/       # Auth, errorHandler...
│   │   └── utils/            # Hàm tiện ích
│   └── index.js              # Khởi động backend
│
├── frontend/
│   ├── public/               # File tĩnh
│   └── src/
│       ├── components/       # Component nhỏ
│       ├── views/            # Trang lớn
│       ├── router/           # Vue Router
│       ├── store/            # Pinia
│       ├── services/         # Chứa các hàm gọi API 
│       ├── assets/           # Ảnh, CSS, fonts
│       ├── main.js           # Entry point
│       └── App.vue           # Root component
|
├── recommendation_service/   # Dịch vụ gợi ý sách độc lập (Python/ML)
│   ├── app.py                # Điểm khởi chạy của API/Service gợi ý
│   ├── requirements.txt      # Các thư viện Python cần thiết
│   ├── similarity_matrix.pkl # Ma trận tương đồng (dùng cho gợi ý)
|   ├── objectid_to_index.json# Mapping ID sách MongoDB -> index vector
|   ├── index_to_objectid.json# Mapping index vector -> ID sách MongoDB
│   ├── books_model_data.pkl  # Dữ liệu/Tham số cho mô hình
│   └── book_vectors.pkl      # Vector biểu diễn của sách
│
└── README.md
```

---

## 🎉 Ghi chú
- VNPay / AWS / Cloudinary cần key hợp lệ.  

