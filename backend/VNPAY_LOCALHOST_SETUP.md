# VNPay Setup cho Localhost

## Vấn đề với Localhost

VNPay IPN (Instant Payment Notification) không thể gọi được localhost vì:

- VNPay cần gọi HTTP callback đến server của merchant
- Localhost không có public URL
- IPN sẽ không được gọi trong môi trường phát triển

## Giải pháp hiện tại

**ĐÃ CHUYỂN LOGIC TẠO BẢN QUYỀN SANG RETURN URL**

### Cấu hình hiện tại (Localhost):

- **Return URL**: CHÍNH THỨC - tạo bản quyền ebook
- **IPN**: BACKUP - chỉ tạo nếu Return URL thất bại

### Luồng hoạt động:

1. User thanh toán trên VNPay
2. VNPay redirect về Return URL với kết quả
3. Return URL:
   - Xác thực checksum
   - Cập nhật order status = 'completed'
   - **Tạo bản quyền ebook ngay lập tức**
   - Redirect user về frontend
4. IPN (nếu được gọi): Chỉ làm backup

## Khi deploy Production

### ⚠️ QUAN TRỌNG: Cần thay đổi lại khi deploy production

**Cần đổi vai trò:**

- **IPN**: CHÍNH THỨC - tạo bản quyền ebook
- **Return URL**: BACKUP - chỉ hiển thị kết quả

### Các thay đổi cần thiết:

**1. Trong `vnpayController.js` - function `vnpayReturn`:**

```javascript
// ĐỔI TỪ:
const licenseResult = await createEbookLicense(order._id, false); // false = chính thức
console.log(`🔑 [RETURN OFFICIAL] Đã tạo...`);

// THÀNH:
const licenseResult = await createEbookLicense(order._id, true); // true = backup
console.log(`🔑 [RETURN BACKUP] Đã tạo...`);
```

**2. Trong `vnpayController.js` - function `vnpayIpn`:**

```javascript
// ĐỔI TỪ:
const licenseResult = await createEbookLicense(order._id, true); // true = backup
console.log(`🔑 [IPN BACKUP] Đã tạo...`);

// THÀNH:
const licenseResult = await createEbookLicense(order._id, false); // false = chính thức
console.log(`🔑 [IPN OFFICIAL] Đã tạo...`);
```

**3. Cập nhật các log message:**

- `[RETURN OFFICIAL]` → `[RETURN BACKUP]`
- `[IPN BACKUP]` → `[IPN OFFICIAL]`

## Kiểm tra hoạt động

### Localhost testing:

```bash
# Xem log khi thanh toán
tail -f logs/app.log | grep -E "(RETURN|IPN|LICENSE)"

# Kiểm tra bản quyền được tạo
db.ebooklicenses.find({}).pretty()
```

### Các log cần thấy:

- `✅ [RETURN OFFICIAL] Đã cập nhật đơn hàng`
- `🔑 [RETURN OFFICIAL] Đã tạo X bản quyền ebook chính thức`
- `ℹ️ [IPN SKIP]` (nếu IPN được gọi)

## Backup Files

Nếu cần rollback:

```bash
# Backup file hiện tại
cp src/controllers/vnpayController.js src/controllers/vnpayController.localhost.js

# Restore bản production (nếu có)
cp src/controllers/vnpayController.production.js src/controllers/vnpayController.js
```

## Notes

- File `vnpayController.js` đã có comment hướng dẫn chi tiết
- Logic tạo bản quyền đã được tối ưu để tránh trùng lặp
- Xử lý lỗi đã được cải thiện với log chi tiết
- Schema đã được đơn giản hóa (Order, EbookLicense)

## Testing Checklist

- [ ] Thanh toán thành công tạo bản quyền
- [ ] Thanh toán thất bại không tạo bản quyền
- [ ] Không có log trùng lặp
- [ ] User được redirect đúng trang kết quả
- [ ] Database được cập nhật chính xác
