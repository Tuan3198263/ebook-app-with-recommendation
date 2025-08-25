import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Tạo __dirname tương thích với ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load biến môi trường
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Đọc trực tiếp từ file .env nếu biến môi trường chưa được thiết lập
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION || !process.env.AWS_S3_BUCKET) {
    try {
        const envPath = path.resolve(__dirname, '../../.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const accessKeyId = envContent.match(/AWS_ACCESS_KEY_ID=(.+)/);
            const secretAccessKey = envContent.match(/AWS_SECRET_ACCESS_KEY=(.+)/);
            const region = envContent.match(/AWS_REGION=(.+)/);
            const bucket = envContent.match(/AWS_S3_BUCKET=(.+)/);
            
            if (accessKeyId && accessKeyId[1]) process.env.AWS_ACCESS_KEY_ID = accessKeyId[1];
            if (secretAccessKey && secretAccessKey[1]) process.env.AWS_SECRET_ACCESS_KEY = secretAccessKey[1];
            if (region && region[1]) process.env.AWS_REGION = region[1];
            if (bucket && bucket[1]) process.env.AWS_S3_BUCKET = bucket[1];
        }
    } catch (error) {
        console.error('Lỗi khi đọc file .env:', error.message);
    }
}

// Log thông tin để kiểm tra (không log Secret Key cho mục đích bảo mật)
console.log('AWS Config:', {
    region: process.env.AWS_REGION || 'Not set',
    bucket: process.env.AWS_S3_BUCKET || 'Not set',
    accessKeyExists: !!process.env.AWS_ACCESS_KEY_ID,
    secretKeyExists: !!process.env.AWS_SECRET_ACCESS_KEY
});

// Khởi tạo S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Hàm kiểm tra file type cho ebook
const fileFilter = (req, file, cb) => {
    // Các định dạng ebook phổ biến
    const allowedTypes = /jpeg|jpg|png|gif|pdf|epub|mobi|azw|azw3|fb2|cbz|cbr|djvu|txt|rtf|odt|doc|docx/;
    
    // Kiểm tra đuôi file
    const extname = allowedTypes.test(
        path.extname(file.originalname).toLowerCase()
    );
    
    // Kiểm tra mimetype
    const mimetype = file.mimetype;
    
    if (extname) {
        // Đối với file PDF và các file document
        if (mimetype === 'application/pdf' || 
            mimetype === 'application/epub+zip' || 
            mimetype === 'application/x-mobipocket-ebook' ||
            mimetype.includes('image/') ||
            mimetype.includes('text/') ||
            mimetype.includes('application/')) {
            return cb(null, true);
        }
        cb(null, true);
    } else {
        cb(new Error('Định dạng file không được hỗ trợ! Vui lòng upload file ebook hoặc hình ảnh hợp lệ.'));
    }
};

// Cấu hình upload file lên S3
const uploadS3 = multer({
    storage: multerS3({
        s3: s3Client,
        bucket: process.env.AWS_S3_BUCKET,
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            // Tạo tên file duy nhất với thời gian
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            // Lưu vào thư mục Book trong bucket
            const filename = 'Book/' + uniqueSuffix + path.extname(file.originalname);
            cb(null, filename);
        }
    }),
    limits: { fileSize: 100 * 1024 * 1024 }, // Giới hạn kích thước file 100MB (ebook có thể lớn)
    fileFilter
});

// Hàm upload trực tiếp file lên S3 từ buffer hoặc stream
const uploadToS3 = async (fileBuffer, filename, mimetype) => {
    try {
        // Điều chỉnh đường dẫn lưu file
        let adjustedKey = filename;
        if (filename.startsWith('Books/')) {
            adjustedKey = filename;
        } else if (filename.startsWith('Book/Books/')) {
            adjustedKey = filename;
        } else if (filename.startsWith('Book/')) {
            adjustedKey = filename;
        } else {
            adjustedKey = `Book/${filename}`;
        }

        console.log(`Attempting to upload to path: ${adjustedKey}`);
        
        const uploadParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: adjustedKey,
            Body: fileBuffer,
            ContentType: mimetype,
        };

        const upload = new Upload({
            client: s3Client,
            params: uploadParams
        });

        // Thêm xử lý tiến trình upload (tùy chọn)
        upload.on('httpUploadProgress', (progress) => {
            console.log(`Upload progress: ${progress.loaded}/${progress.total}`);
        });

        // Thực hiện upload và trả về kết quả
        const result = await upload.done();
        console.log('Upload successful:', result.Key);
        
        // Tạo URL công khai nếu bucket được cấu hình phù hợp
        const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${adjustedKey}`;
        
        return {
            success: true,
            url: fileUrl,
            key: result.Key || adjustedKey
        };
    } catch (error) {
        console.error('Chi tiết lỗi khi upload file lên S3:', {
            message: error.message,
            code: error.code,
            requestId: error.$metadata?.requestId
        });
        return { 
            success: false, 
            error: error.message,
            code: error.code,
            help: "Lỗi khi upload file lên S3. Vui lòng kiểm tra cấu hình bucket và IAM policy."
        };
    }
};

// Hàm xóa file từ S3
const deleteFromS3 = async (fileKey) => {
    try {
        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: fileKey
        };

        await s3Client.send(new DeleteObjectCommand(params));
        return { success: true };
    } catch (error) {
        console.error('Lỗi khi xóa file từ S3:', error);
        return { success: false, error: error.message };
    }
};

export { uploadS3, uploadToS3, deleteFromS3, s3Client };
