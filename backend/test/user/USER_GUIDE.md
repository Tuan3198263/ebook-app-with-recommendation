# Hướng dẫn xử lý Users cho Collaborative Filtering

## 📁 Cấu trúc thư mục

```
backend/test/user/
├── userStatistics.js    # Thống kê users hiện có
├── createUsers.js       # Tạo users mới
└── USER_GUIDE.md       # File hướng dẫn này
```

## 🔧 Scripts đã thêm vào package.json

### 1. Thống kê Users hiện tại

```bash
npm run user:stats
```

**Chức năng:**

- Đếm tổng số users trong database
- Phân bố theo role (student/admin/teacher)
- Phân bố theo faculty (khoa)
- Top 10 major phổ biến nhất
- Thống kê users có đầy đủ thông tin profile
- Hiển thị 5 users mới nhất
- Thống kê đăng ký theo tháng

### 2. Tạo Users mới

```bash
# Tạo 175 users (mặc định)
npm run user:create

# Tạo số lượng users tùy chỉnh
npm run user:create 100
npm run user:create 200
```

**Chức năng:**

- Tạo users với thông tin realistic
- Faculty/Major được phân bố theo trọng số thực tế
- Email theo format: lastname + initials + number@student.ctu.edu.vn
- Password mặc định: 123456 (sẽ được hash tự động)
- Role: student (100%)
- Tuổi: 18-25 tuổi

## 📊 Đặc điểm Users được tạo

### **Thông tin cơ bản:**

- **Tên**: 80+ tên sinh viên Việt Nam realistic
- **Email**: Format chuẩn sinh viên CTU
- **Password**: 123456 (được hash với bcrypt)
- **Role**: student (theo yêu cầu)
- **DateOfBirth**: Random 18-25 tuổi

### **Faculty Distribution (Trọng số realistic):**

- Công nghệ thông tin & truyền thông: 20%
- Khoa học tự nhiên: 18%
- Nông nghiệp: 15%
- Kinh tế: 15%
- Sư phạm: 12%
- Khoa học xã hội & nhân văn: 10%
- Ngoại ngữ: 5%
- Thủy sản: 5%

### **Data Validation:**

- ✅ Tuân thủ hoàn toàn User schema hiện có
- ✅ Email unique validation
- ✅ Tên không chứa ký tự đặc biệt
- ✅ Faculty/Major từ facultiesAndMajors.js
- ✅ Password được hash tự động (bcrypt)

## 🎯 Mục đích cho Collaborative Filtering

### **Với 175 users sẽ có:**

- ~35 users Công nghệ thông tin
- ~30 users Khoa học tự nhiên
- ~25 users Nông nghiệp
- ~25 users Kinh tế
- ~20 users Sư phạm
- ~18 users Khoa học xã hội & nhân văn
- ~10 users Ngoại ngữ
- ~10 users Thủy sản

### **Phù hợp cho Model:**

- **User-based CF**: Đủ users để tính similarity
- **Faculty-based recommendations**: Users cùng khoa có sở thích tương tự
- **Cross-faculty analysis**: Một số users có thể thích sách ngoài chuyên ngành
- **Cold start problem**: Handle được nhờ faculty/major information

## 📝 Ví dụ User được tạo

```javascript
{
  name: "Nguyễn Văn An",
  email: "annv001@student.ctu.edu.vn",
  password: "$2a$10$hashedPassword...", // Hash của "123456"
  dateOfBirth: "2001-03-15T00:00:00.000Z",
  faculty: "Công nghệ thông tin và truyền thông",
  major: "Công nghệ thông tin",
  role: "student"
}
```

## 🚀 Workflow đề xuất

### **Bước 1: Kiểm tra hiện trạng**

```bash
npm run user:stats
```

### **Bước 2: Tạo users nếu cần**

```bash
# Nếu cần 175 users cho CF model
npm run user:create 175
```

### **Bước 3: Verify kết quả**

```bash
npm run user:stats
```

### **Bước 4: Tạo RecentlyViewed data**

Sau khi có đủ users, bước tiếp theo sẽ tạo user-book interactions.

## ⚠️ Lưu ý quan trọng

### **Database Impact:**

- Script sử dụng `insertMany` với batches để tối ưu performance
- Tự động skip nếu email đã tồn tại (duplicate email)
- Connection được đóng tự động sau khi hoàn thành

### **Password Security:**

- Tất cả users có password mặc định: `123456`
- Password được hash tự động theo User schema middleware
- Trong production cần yêu cầu users đổi password

### **Faculty/Major Data:**

- Dựa trên `facultiesAndMajors.js` đã cập nhật
- Phản ánh cấu trúc thực tế của Đại học Cần Thơ
- Mapping với 6 categories sách hiện có

### **Email Format:**

- Theo chuẩn email sinh viên CTU
- Tự động giải quyết duplicate bằng suffix số
- Ví dụ: `annv001@student.ctu.edu.vn`, `annv0011@student.ctu.edu.vn`

## 🔄 Next Steps

Sau khi tạo users, bước tiếp theo sẽ là:

1. **Tạo RecentlyViewed interactions** (user-book interactions)
2. **Export collaborative filtering data**
3. **Build User-based CF model** trên Google Colab
4. **Integrate model** vào backend API

Users data này sẽ là nền tảng cho việc xây dựng Collaborative Filtering model hiệu quả! 🎯
