import User from '../models/user.js';
import RecentlyViewed from '../models/recentlyViewed.js';
import Book from '../models/book.js';
import axios from 'axios';

// Map faculty name (trong DB) → code (gửi cho Flask API)
const reverseFacultyMapping = {
    "Khoa Công nghệ Thông tin": "cntt",
    "Khoa Khoa học Tự nhiên": "khtn",
    "Khoa Kinh tế": "kinh_te",
    "Khoa Giáo dục": "giao_duc",
    "Khoa Chính Trị": "chinh_tri",
    "Khoa Văn học": "van_hoc"
};

const mapFacultyNameToCode = (facultyName) => {
    return reverseFacultyMapping[facultyName] || null;
};

// ✅ 1. Lấy faculty và lịch sử xem
export const getUserFacultyAndHistory = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId).select('faculty');
        const history = await RecentlyViewed.findOne({ userId }).select('viewedBooks.bookId');
        const bookIds = history ? history.viewedBooks.map(item => item.bookId) : [];

        return res.status(200).json({
            faculty: user?.faculty || '',
            bookIds
        });
    } catch (error) {
        console.error('Lỗi khi lấy thông tin user:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thông tin user',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// ✅ 2. Lấy sách nổi bật (cold-start hoàn toàn)
export const getFeaturedBooks = async (req, res) => {

    try {
        const limit = 8;
        const featuredBooks = await Book.find({
            featured: true,
            active: true
        })
      
        .select('title slug coverImages')
        .sort({ createdAt: -1 })
        .limit(limit);

        return res.status(200).json({
            success: true,
            data: featuredBooks,
            message: 'Danh sách sách nổi bật',
            type: 'FEATURED_BOOKS',
            count: featuredBooks.length
        });

    } catch (error) {
        console.error('Lỗi khi lấy sách nổi bật:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy sách nổi bật',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// ✅ 3. Hàm tổng: xử lý gợi ý
export const recommendBooks = async (req, res) => {
    try {
        

        const userId = req.user.id;

        // Lấy faculty + lịch sử xem
        const user = await User.findById(userId).select('faculty');
        const history = await RecentlyViewed.findOne({ userId }).select('viewedBooks.bookId');
        const bookIds = history ? history.viewedBooks.map(item => item.bookId.toString()) : [];

        const facultyCode = mapFacultyNameToCode(user?.faculty);

        // Cold-start hoàn toàn
        if (!facultyCode && bookIds.length === 0) {
            return getFeaturedBooks(req, res);
        }

        // 📦 Tạo payload gửi Flask
        let payload = {};
        if (bookIds.length > 0) {
            payload = { book_ids: bookIds, top_k: 8 };
        } else if (facultyCode) {
            payload = { faculty: facultyCode, top_k: 8 };
        }

        // 🧾 Ghi log các sách đã đọc (nếu có)
        if (payload.book_ids) {
            const viewedBooks = await Book.find({ _id: { $in: payload.book_ids } }).select('title');
            const titles = viewedBooks.map(b => {
                const maxLen = 30;
                return b.title.length > maxLen ? b.title.slice(0, maxLen) + '...' : b.title;
            });
            console.log("📚 Các sách đã đọc:", titles);
        }

        const flaskUrl = 'http://localhost:5001/recommend';
        const response = await axios.post(flaskUrl, payload);
        const recommendationList = response.data;

        const bookIdList = recommendationList.map(b => b.book_id);

        // Truy vấn chi tiết sách (chỉ sách đang active)
        const books = await Book.find({ _id: { $in: bookIdList }, active: true })
            .select('title slug coverImages');

        // Gắn thêm score cho từng sách từ response Flask
        const booksWithScore = books.map(book => {
            const matched = recommendationList.find(r => r.book_id === book._id.toString());
            return {
                ...book.toObject(),
                score: matched ? matched.score : null
            };
        });

        return res.status(200).json({
            success: true,
            data: booksWithScore,
            message: 'Gợi ý sách cá nhân hóa',
            type: 'PERSONALIZED_RECOMMENDATION',
            count: booksWithScore.length
        });

    } catch (error) {
        console.error('Lỗi khi gợi ý sách:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi gợi ý sách',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};


