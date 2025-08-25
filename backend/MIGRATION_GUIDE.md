# Book Schema Migration Guide

## Mô tả

Script này được tạo để migrate dữ liệu Book từ cấu trúc cũ sang cấu trúc mới:

### Cấu trúc cũ:
```javascript
{
  bookFile: "https://s3.amazonaws.com/bucket/Book/file.pdf"
}
```

### Cấu trúc mới:
```javascript
{
  bookFiles: {
    pdf: "https://s3.amazonaws.com/bucket/Book/pdf/file.pdf",
    epub: "https://s3.amazonaws.com/bucket/Book/epub/file.epub"
  },
  availableFormats: ["pdf", "epub"],
  primaryFormat: "epub"
}
```

## Cách sử dụng

### 1. Kiểm tra thống kê hiện tại
```bash
npm run migrate:books:stats
```

### 2. Thực hiện migration
```bash
npm run migrate:books
```

### 3. Rollback nếu cần (khôi phục lại cấu trúc cũ)
```bash
npm run migrate:books:rollback
```

## Chi tiết Script

### Chức năng chính:

1. **migrate**: Chuyển đổi từ cấu trúc cũ sang mới
   - Tìm tất cả document có `bookFile` nhưng không có `bookFiles`
   - Xác định format file (PDF/EPUB) dựa trên URL
   - Tạo object `bookFiles` với format tương ứng
   - Tạo array `availableFormats`
   - Đặt `primaryFormat`
   - Xóa trường `bookFile` cũ

2. **rollback**: Khôi phục lại cấu trúc cũ
   - Tìm tất cả document có `bookFiles`
   - Lấy URL file (ưu tiên PDF, sau đó EPUB)
   - Đặt lại trường `bookFile`
   - Xóa các trường mới

3. **stats**: Hiển thị thống kê
   - Số lượng sách cấu trúc cũ vs mới
   - Ví dụ về cấu trúc

### Logic xác định format:

- Nếu URL chứa ".epub" hoặc "epub" → format = "epub"
- Ngược lại → format = "pdf" (mặc định)

### An toàn:

- Script không xóa dữ liệu gốc cho đến khi migration thành công
- Có chức năng rollback để khôi phục
- Hiển thị progress và kết quả chi tiết
- Xử lý lỗi cho từng document riêng biệt

## Lưu ý quan trọng

1. **Backup database** trước khi chạy migration
2. **Kiểm tra kết quả** bằng lệnh `stats` sau migration
3. **Test ứng dụng** sau migration để đảm bảo hoạt động bình thường
4. Script có thể chạy nhiều lần an toàn (idempotent)

## Ví dụ output

```
🚀 Bắt đầu migrate schema Book...
📊 Tìm thấy 15 sách cần migrate
✅ Migrated: Giáo trình Lập trình Web - Format: pdf
✅ Migrated: Sách EPUB Sample - Format: epub
...

📈 Kết quả migration:
✅ Thành công: 15 sách
❌ Lỗi: 0 sách
📊 Tổng cộng: 15 sách

🔍 Kiểm tra sau migration:
📚 Sách còn lại cấu trúc cũ: 0
📚 Sách đã có cấu trúc mới: 25
```

## Troubleshooting

### Lỗi kết nối MongoDB
- Kiểm tra file `.env` có đúng `MONGODB_URI`
- Đảm bảo MongoDB đang chạy

### Migration không thành công
- Kiểm tra quyền ghi database
- Xem log chi tiết để biết lỗi cụ thể
- Sử dụng `stats` để kiểm tra trạng thái hiện tại

### Sau migration ứng dụng lỗi
- Sử dụng `rollback` để khôi phục
- Kiểm tra code backend đã cập nhật schema chưa
- Kiểm tra frontend đã cập nhật API calls chưa
