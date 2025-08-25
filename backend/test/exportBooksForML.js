import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import Book from '../src/models/book.js';
import Category from '../src/models/category.js';
import Author from '../src/models/author.js';
import connectToDatabase from '../src/db.js';

// Hàm loại bỏ HTML tags
const stripHtmlTags = (html) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '') // Loại bỏ tất cả HTML tags
    .replace(/&nbsp;/g, ' ') // Thay thế &nbsp; bằng space
    .replace(/&amp;/g, '&') // Thay thế &amp; bằng &
    .replace(/&lt;/g, '<') // Thay thế &lt; bằng <
    .replace(/&gt;/g, '>') // Thay thế &gt; bằng >
    .replace(/&quot;/g, '"') // Thay thế &quot; bằng "
    .replace(/&#39;/g, "'") // Thay thế &#39; bằng '
    .replace(/\s+/g, ' ') // Thay thế nhiều space bằng 1 space
    .trim(); // Loại bỏ space đầu cuối
};

// Hàm truy xuất và xử lý dữ liệu sách
const exportBooksData = async () => {
  try {
    console.log('🔍 Đang truy xuất dữ liệu sách...');
    
    // Kiểm tra kết nối database
    console.log('🔗 Database name:', mongoose.connection.name);
    console.log('🔗 Connection state:', mongoose.connection.readyState);
    
    // Đếm tổng số sách trong database (không filter)
    const totalBooks = await Book.countDocuments();
    console.log(`📊 Tổng số sách trong database: ${totalBooks}`);
    
    // Đếm số sách active
    const activeBooks = await Book.countDocuments({ active: true });
    console.log(`📊 Số sách active: ${activeBooks}`);
    
    // Lấy tất cả sách với populate category (bỏ filter active để test)
    const books = await Book.find()
      .populate('category', 'name')
      .lean();

    console.log(`📚 Tìm thấy ${books.length} sách (không filter active)`);
    
    // Nếu vẫn 0, in ra sample để debug
    if (books.length === 0) {
      console.log('⚠️ Không tìm thấy sách nào. Kiểm tra collection name và dữ liệu...');
      
      // List tất cả collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('📋 Các collections có sẵn:', collections.map(c => c.name));
      
      return;
    }

    // Xử lý dữ liệu cho ML - chỉ lấy những trường cần thiết
    const processedBooks = books.map(book => {
      // Xử lý description - chỉ loại bỏ HTML, không chuẩn hóa
      const cleanDescription = stripHtmlTags(book.description);

      return {
        id: book._id.toString(),
        title: book.title,
        category: book.category?.name || '',
        documentType: book.documentType,
        description: cleanDescription
      };
    });

    // Thống kê dữ liệu
    const stats = {
      totalBooks: processedBooks.length,
      categories: [...new Set(processedBooks.map(b => b.category))].filter(Boolean),
      documentTypes: [...new Set(processedBooks.map(b => b.documentType))]
    };

    // Tạo thư mục output nếu chưa có
    const outputDir = path.join(process.cwd(), 'test', 'ml_data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Xuất file JSON
    const jsonPath = path.join(outputDir, 'books_for_ml.json');
    fs.writeFileSync(jsonPath, JSON.stringify(processedBooks, null, 2), 'utf8');

    // Xuất file CSV
    const csvHeaders = ['id', 'title', 'category', 'documentType', 'description'];
    
    const csvRows = processedBooks.map(book => [
      book.id,
      `"${book.title.replace(/"/g, '""')}"`,
      `"${book.category.replace(/"/g, '""')}"`,
      book.documentType,
      `"${book.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
    const csvPath = path.join(outputDir, 'books_for_ml.csv');
    fs.writeFileSync(csvPath, csvContent, 'utf8');

    // Xuất file thống kê
    const statsPath = path.join(outputDir, 'data_statistics.json');
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), 'utf8');

    console.log('\n✅ Xuất dữ liệu thành công!');
    console.log(`📁 Thư mục output: ${outputDir}`);
    console.log(`📄 File JSON: books_for_ml.json (${processedBooks.length} records)`);
    console.log(`📊 File CSV: books_for_ml.csv`);
    console.log(`📈 File thống kê: data_statistics.json`);
    
    console.log('\n📊 Thống kê dữ liệu:');
    console.log(`- Tổng số sách: ${stats.totalBooks}`);
    console.log(`- Số danh mục: ${stats.categories.length}`);
    console.log(`- Loại tài liệu: ${stats.documentTypes.join(', ')}`);
    console.log(`- Các danh mục: ${stats.categories.join(', ')}`);

  } catch (error) {
    console.error('❌ Lỗi khi xuất dữ liệu:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔒 Đã đóng kết nối database');
  }
};

// Chạy script
const main = async () => {
  console.log('🚀 Bắt đầu xuất dữ liệu sách cho Machine Learning...\n');
  await connectToDatabase();
  await exportBooksData();
};

main().catch(console.error);
