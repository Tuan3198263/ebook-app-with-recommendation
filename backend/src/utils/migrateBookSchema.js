import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Tạo __dirname tương thích với ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load biến môi trường từ nhiều vị trí có thể
const envPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../../.env')
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`📄 Đã load .env từ: ${envPath}`);
    break;
  }
}

// Kiểm tra và hiển thị thông tin kết nối
const checkEnvVariables = () => {
  console.log('🔍 Kiểm tra biến môi trường:');
  
  // Hỗ trợ cả MONGODB_URI và DB_URI
  const mongoUri = process.env.MONGODB_URI || process.env.DB_URI;
  
  console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Có' : '❌ Không có'}`);
  console.log(`DB_URI: ${process.env.DB_URI ? '✅ Có' : '❌ Không có'}`);
  
  if (mongoUri) {
    // Đặt lại biến MONGODB_URI để mongoose sử dụng
    process.env.MONGODB_URI = mongoUri;
    console.log('✅ Sử dụng URI:', mongoUri.replace(/:\/\/[^@]*@/, '://***:***@')); // Ẩn password
    return true;
  }
  
  console.log('\n💡 Gợi ý:');
  console.log('1. Kiểm tra file .env có tồn tại không');
  console.log('2. Đảm bảo MONGODB_URI hoặc DB_URI được định nghĩa trong .env');
  console.log('3. Chạy script từ thư mục backend/ hoặc root/');
  console.log('\nVí dụ .env:');
  console.log('MONGODB_URI=mongodb://localhost:27017/your-database');
  console.log('hoặc');
  console.log('DB_URI=mongodb+srv://user:pass@cluster.mongodb.net/database');
  return false;
};

// Kết nối MongoDB
const connectDB = async () => {
  try {
    if (!checkEnvVariables()) {
      process.exit(1);
    }

    console.log('🔌 Đang kết nối MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Kết nối MongoDB thành công');
    
    // Hiển thị thông tin database
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📊 Database: ${dbName}`);
    
  } catch (error) {
    console.error('❌ Lỗi kết nối MongoDB:', error.message);
    console.log('\n💡 Kiểm tra:');
    console.log('- MongoDB server có đang chạy không?');
    console.log('- Connection string có đúng không?');
    console.log('- Network/firewall có chặn không?');
    process.exit(1);
  }
};

// Schema cũ cho tham chiếu
const oldBookSchema = new mongoose.Schema({}, { strict: false });
const OldBook = mongoose.model('OldBook', oldBookSchema, 'books');

// Hàm migrate dữ liệu
const migrateBookSchema = async () => {
  try {
    console.log('🚀 Bắt đầu migrate schema Book...');

    // Tìm tất cả các document có cấu trúc cũ (có bookFile nhưng không có bookFiles)
    const booksToMigrate = await OldBook.find({
      bookFile: { $exists: true },
      bookFiles: { $exists: false }
    });

    console.log(`📊 Tìm thấy ${booksToMigrate.length} sách cần migrate`);

    if (booksToMigrate.length === 0) {
      console.log('✅ Không có sách nào cần migrate');
      return;
    }

    let migratedCount = 0;
    let errorCount = 0;

    for (const book of booksToMigrate) {
      try {
        // Xác định format file dựa trên URL hoặc extension
        const bookFileUrl = book.bookFile;
        let format = 'pdf'; // Mặc định là PDF
        
        if (bookFileUrl) {
          const lowerUrl = bookFileUrl.toLowerCase();
          if (lowerUrl.includes('.epub') || lowerUrl.includes('epub')) {
            format = 'epub';
          }
        }

        // Tạo object bookFiles mới
        const bookFiles = {};
        bookFiles[format] = bookFileUrl;

        // Tạo availableFormats array
        const availableFormats = [format];

        // Cập nhật document
        const updateResult = await OldBook.updateOne(
          { _id: book._id },
          {
            $set: {
              bookFiles: bookFiles,
              availableFormats: availableFormats,
              primaryFormat: format
            },
            $unset: {
              bookFile: 1 // Xóa trường cũ
            }
          }
        );

        if (updateResult.modifiedCount > 0) {
          migratedCount++;
          console.log(`✅ Migrated: ${book.title || book._id} - Format: ${format}`);
        } else {
          console.log(`⚠️  Không thể update: ${book.title || book._id}`);
        }

      } catch (error) {
        errorCount++;
        console.error(`❌ Lỗi khi migrate sách ${book.title || book._id}:`, error.message);
      }
    }

    console.log('\n📈 Kết quả migration:');
    console.log(`✅ Thành công: ${migratedCount} sách`);
    console.log(`❌ Lỗi: ${errorCount} sách`);
    console.log(`📊 Tổng cộng: ${booksToMigrate.length} sách`);

    // Kiểm tra kết quả sau migration
    const remainingOldBooks = await OldBook.find({
      bookFile: { $exists: true },
      bookFiles: { $exists: false }
    }).countDocuments();

    const newBooks = await OldBook.find({
      bookFiles: { $exists: true }
    }).countDocuments();

    console.log('\n🔍 Kiểm tra sau migration:');
    console.log(`📚 Sách còn lại cấu trúc cũ: ${remainingOldBooks}`);
    console.log(`📚 Sách đã có cấu trúc mới: ${newBooks}`);

  } catch (error) {
    console.error('❌ Lỗi trong quá trình migration:', error);
  }
};

// Hàm rollback (khôi phục lại cấu trúc cũ nếu cần)
const rollbackMigration = async () => {
  try {
    console.log('🔄 Bắt đầu rollback migration...');

    const booksToRollback = await OldBook.find({
      bookFiles: { $exists: true },
      availableFormats: { $exists: true }
    });

    console.log(`📊 Tìm thấy ${booksToRollback.length} sách cần rollback`);

    let rollbackCount = 0;

    for (const book of booksToRollback) {
      try {
        // Lấy URL file từ bookFiles (ưu tiên PDF, sau đó EPUB)
        let bookFileUrl = null;
        if (book.bookFiles.pdf) {
          bookFileUrl = book.bookFiles.pdf;
        } else if (book.bookFiles.epub) {
          bookFileUrl = book.bookFiles.epub;
        }

        if (bookFileUrl) {
          await OldBook.updateOne(
            { _id: book._id },
            {
              $set: {
                bookFile: bookFileUrl
              },
              $unset: {
                bookFiles: 1,
                availableFormats: 1,
                primaryFormat: 1
              }
            }
          );

          rollbackCount++;
          console.log(`✅ Rollback: ${book.title || book._id}`);
        }

      } catch (error) {
        console.error(`❌ Lỗi rollback sách ${book.title || book._id}:`, error.message);
      }
    }

    console.log(`\n✅ Rollback hoàn tất: ${rollbackCount} sách`);

  } catch (error) {
    console.error('❌ Lỗi trong quá trình rollback:', error);
  }
};

// Hàm hiển thị thống kê hiện tại
const showCurrentStats = async () => {
  try {
    console.log('📊 Thống kê hiện tại:');

    const oldStructureCount = await OldBook.find({
      bookFile: { $exists: true },
      bookFiles: { $exists: false }
    }).countDocuments();

    const newStructureCount = await OldBook.find({
      bookFiles: { $exists: true }
    }).countDocuments();

    const totalBooks = await OldBook.countDocuments();

    console.log(`📚 Tổng số sách: ${totalBooks}`);
    console.log(`📚 Cấu trúc cũ (bookFile): ${oldStructureCount}`);
    console.log(`📚 Cấu trúc mới (bookFiles): ${newStructureCount}`);

    // Hiển thị một vài ví dụ
    const oldExamples = await OldBook.find({
      bookFile: { $exists: true },
      bookFiles: { $exists: false }
    }).limit(3).select('title bookFile');

    const newExamples = await OldBook.find({
      bookFiles: { $exists: true }
    }).limit(3).select('title bookFiles availableFormats primaryFormat');

    if (oldExamples.length > 0) {
      console.log('\n📖 Ví dụ cấu trúc cũ:');
      oldExamples.forEach(book => {
        console.log(`  - ${book.title}: ${book.bookFile}`);
      });
    }

    if (newExamples.length > 0) {
      console.log('\n📖 Ví dụ cấu trúc mới:');
      newExamples.forEach(book => {
        console.log(`  - ${book.title}:`);
        console.log(`    Formats: ${book.availableFormats?.join(', ')}`);
        console.log(`    Primary: ${book.primaryFormat}`);
        if (book.bookFiles?.epub) console.log(`    EPUB: ${book.bookFiles.epub}`);
        if (book.bookFiles?.pdf) console.log(`    PDF: ${book.bookFiles.pdf}`);
      });
    }

  } catch (error) {
    console.error('❌ Lỗi khi hiển thị thống kê:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();

  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'migrate':
      await migrateBookSchema();
      break;
    case 'rollback':
      await rollbackMigration();
      break;
    case 'stats':
      await showCurrentStats();
      break;
    default:
      console.log('📋 Sử dụng:');
      console.log('  node migrateBookSchema.js migrate   - Chuyển đổi từ cấu trúc cũ sang mới');
      console.log('  node migrateBookSchema.js rollback  - Khôi phục lại cấu trúc cũ');
      console.log('  node migrateBookSchema.js stats     - Hiển thị thống kê hiện tại');
      break;
  }

  await mongoose.connection.close();
  console.log('🔒 Đã đóng kết nối MongoDB');
};

// Chạy script
main().catch((error) => {
  console.error('❌ Lỗi:', error);
  process.exit(1);
});
