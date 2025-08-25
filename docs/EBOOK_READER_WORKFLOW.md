# Luồng hoạt động chức năng đọc sách và tối ưu hóa tài nguyên

## 🔄 Luồng hoạt động hiện tại

### 1. Khởi tạo trang đọc sách

```
Người dùng → /reader/:slug → BookReader.vue
  ↓
Kiểm tra thông tin sách (bookService.getBookBySlug)
  ↓
Kiểm tra quyền truy cập (licenseService.checkAccess)
  ↓
Lấy thông tin reader (readerService.getReaderData)
  ↓
Tải nội dung file (readerService.getEbookProxyUrl)
  ↓
ReaderContent.vue render EPUB
```

### 2. Mỗi lần F5 (Refresh) trang

```
Toàn bộ luồng trên được thực hiện lại
  ↓
Gọi lại proxy endpoint: /api/reader/proxy/:bookId/:format
  ↓
Backend fetch lại file từ S3 (TỐN PHÍ AWS S3)
  ↓
Stream file về frontend
  ↓
EPUB.js render lại từ đầu
```

## 💰 Chi phí AWS S3 hiện tại

### Khi người dùng F5:

- ✅ **KHÔNG tốn phí** cho signed URL (chỉ tạo URL)
- ❌ **CÓ TỐN PHÍ** cho proxy endpoint vì:
  - Mỗi lần proxy gọi S3 = 1 GET request
  - AWS S3 tính phí theo số request GET
  - File EPUB lớn (~ 700KB) = data transfer cost

### Ước tính chi phí:

```
1 file EPUB 700KB:
- GET request: $0.0004 per 1,000 requests
- Data transfer: $0.09 per GB (first 1GB free/month)

Nếu 1000 lần F5/ngày:
- Request cost: $0.0004
- Transfer cost: ~$0.063 (700KB × 1000 × $0.09/GB)
- Tổng: ~$0.0634/ngày
```

## 🚀 Giải pháp tối ưu hóa

### 1. Browser Caching (Ưu tiên cao)

```javascript
// Trong readerController.js
export const proxyEbook = async (req, res) => {
  try {
    // ... existing code ...

    // Set cache headers
    res.setHeader("Cache-Control", "public, max-age=86400"); // 24 hours
    res.setHeader("ETag", `"${bookId}-${format}"`);
    res.setHeader("Last-Modified", new Date().toUTCString());

    // Check if client has cached version
    const clientETag = req.headers["if-none-match"];
    if (clientETag === `"${bookId}-${format}"`) {
      return res.status(304).end(); // Not Modified
    }

    // ... stream file ...
  } catch (error) {
    // ... error handling ...
  }
};
```

### 2. Memory Cache trong backend (Trung bình)

```javascript
// Thêm vào readerController.js
const fileCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export const proxyEbook = async (req, res) => {
  const cacheKey = `${bookId}-${format}`;
  const cached = fileCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    // Serve from memory cache
    res.setHeader("Content-Type", cached.contentType);
    return res.send(cached.data);
  }

  // Fetch from S3 and cache
  const s3Response = await s3Client.send(command);
  fileCache.set(cacheKey, {
    data: s3Response.Body,
    contentType: contentType,
    timestamp: Date.now(),
  });

  // Stream to client
  s3Response.Body.pipe(res);
};
```

### 3. CDN Integration (Dài hạn)

```javascript
// Sử dụng CloudFront hoặc CloudFlare
// Cache files tại edge locations
// TTL: 24 hours cho ebook files
```

### 4. Local Storage trong Frontend (Ngay lập tức)

```javascript
// Trong ReaderContent.vue
const loadEbookFromCache = async () => {
  const cacheKey = `ebook-${props.bookData.id}-${props.currentFormat}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    try {
      const arrayBuffer = new Uint8Array(JSON.parse(cached)).buffer;
      return arrayBuffer;
    } catch (error) {
      localStorage.removeItem(cacheKey);
    }
  }
  return null;
};

const saveEbookToCache = (arrayBuffer) => {
  const cacheKey = `ebook-${props.bookData.id}-${props.currentFormat}`;
  const uint8Array = new Uint8Array(arrayBuffer);
  localStorage.setItem(cacheKey, JSON.stringify(Array.from(uint8Array)));
};
```

## 📈 Kết quả tối ưu hóa dự kiến

### Với Browser Caching:

- Lần đầu: 1 S3 request
- F5 tiếp theo: 0 S3 request (304 Not Modified)
- Tiết kiệm: 95% chi phí

### Với Memory Cache:

- Nhiều user cùng đọc 1 sách: 1 S3 request cho tất cả
- Tiết kiệm: 80-90% chi phí

### Với Local Storage:

- Sau lần đầu: Không cần request mạng
- Trải nghiệm: Tức thì, offline-capable
- Tiết kiệm: 99% chi phí

## 🛠️ Implementation Plan

### Phase 1 (Tuần này):

1. ✅ Implement browser caching headers
2. ✅ Add ETag support
3. ✅ Test với F5 multiple times

### Phase 2 (Tuần sau):

1. Local storage caching
2. Cache management (size limits, expiry)
3. Fallback mechanism

### Phase 3 (Tương lai):

1. Memory cache trong backend
2. CDN integration
3. Cache invalidation strategy

## 🔧 Code cần sửa ngay

### Backend - readerController.js:

```javascript
// Add caching headers to prevent repeated S3 calls
res.setHeader("Cache-Control", "public, max-age=86400");
res.setHeader("ETag", `"${bookId}-${format}"`);
```

### Frontend - ReaderContent.vue:

```javascript
// Check cache before fetching
const cachedData = await loadEbookFromCache();
if (cachedData) {
  epubBook.value = window.ePub(cachedData);
  return;
}
// ... existing fetch logic ...
await saveEbookToCache(arrayBuffer);
```

## 📊 Monitoring

### Metrics cần theo dõi:

- S3 request count per day
- Cache hit rate
- Average loading time
- User engagement metrics

### Tools:

- AWS CloudWatch for S3 metrics
- Browser DevTools for cache verification
- Custom analytics for user behavior
