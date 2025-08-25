import Book from '../models/book.js';
import Category from '../models/category.js';
import Author from '../models/author.js'; // Đảm bảo chữ a viết thường nếu file là author.js
import cloudinary from '../config/cloudinaryConfig.js';
import { uploadToS3, deleteFromS3 } from '../config/s3Config.js';
import mongoose from 'mongoose';

// @desc    Thêm sách mới
// @route   POST /api/books
// @access  Private (Admin)
export const createBook = async (req, res) => {
  // Theo dõi các file đã upload để xóa nếu xảy ra lỗi
  const uploadedResources = {
    cloudinaryUrls: [],
    s3Key: null
  };

  try {
    // Lấy dữ liệu từ request body
    const {
      title,
      category,
      authors,
      publisher,
      dimensions,
      publicationYear,
      isbn,
      language,
      description,
      documentType,
      pages,
      ebookOptions,
      active,
      featured
    } = req.body;

    // Kiểm tra dữ liệu cần thiết
    if (!title || !category || !description) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên sách, danh mục và mô tả'
      });
    }
    
    // Kiểm tra ít nhất một tác giả được chọn
    if (!authors || !Array.isArray(JSON.parse(authors)) || JSON.parse(authors).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ít nhất một tác giả'
      });
    }

    // Kiểm tra file ebook được upload - có thể là epub hoặc pdf hoặc cả hai
    if (!req.files || (!req.files.epubFile && !req.files.pdfFile)) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng tải lên ít nhất một file ebook (EPUB hoặc PDF)'
      });
    }

    // Kiểm tra tùy chọn giá ebook
    if (!ebookOptions) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng thêm ít nhất một tùy chọn giá cho ebook'
      });
    }

    // Parse dữ liệu nếu được gửi dưới dạng chuỗi JSON
    const parsedAuthors = JSON.parse(authors);
    const parsedEbookOptions = typeof ebookOptions === 'string' ? JSON.parse(ebookOptions) : ebookOptions;

    // Kiểm tra tùy chọn ebook hợp lệ
    if (!Array.isArray(parsedEbookOptions) || parsedEbookOptions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng thêm ít nhất một tùy chọn giá cho ebook'
      });
    }

    // Kiểm tra xem sách đã tồn tại chưa (dựa vào tên, ISBN nếu có)
    const existingBook = await Book.findOne({ 
      $or: [
        { title: { $regex: new RegExp(`^${title}$`, 'i') } },
        ...(isbn ? [{ isbn }] : [])
      ] 
    });

    if (existingBook) {
      return res.status(400).json({
        success: false,
        message: 'Sách với tên hoặc ISBN này đã tồn tại'
      });
    }

    // Xử lý upload nhiều hình ảnh bìa sách lên Cloudinary
    const coverImageUrls = [];
    if (req.files && req.files.coverImages) {
      const coverImageFiles = Array.isArray(req.files.coverImages) 
        ? req.files.coverImages 
        : [req.files.coverImages];
      
      for (const file of coverImageFiles) {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              folder: 'book_covers',
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );
          
          uploadStream.end(file.buffer);
        });
        
        // Theo dõi URL Cloudinary để có thể xóa nếu có lỗi
        uploadedResources.cloudinaryUrls.push({
          url: result.secure_url,
          publicId: result.public_id
        });
        
        coverImageUrls.push(result.secure_url);
      }
    }

    // Xử lý upload file ebook lên S3 - có thể có epub và/hoặc pdf
    const bookFiles = {};
    const uploadedS3Keys = [];

    // Xử lý file EPUB nếu có
    if (req.files.epubFile) {
      const epubFile = req.files.epubFile[0];
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const sanitizedFilename = epubFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const s3Filename = `${uniqueSuffix}-${sanitizedFilename}`;
      
      console.log(`Uploading EPUB file: ${s3Filename}`);
      
      const epubResult = await uploadToS3(
        epubFile.buffer,
        s3Filename,
        epubFile.mimetype,
        'epub'
      );

      if (!epubResult.success) {
        await cleanupUploadedResources(uploadedResources);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi upload file EPUB lên S3',
          error: epubResult.error
        });
      }

      bookFiles.epub = epubResult.url;
      uploadedS3Keys.push(epubResult.key);
    }

    // Xử lý file PDF nếu có
    if (req.files.pdfFile) {
      const pdfFile = req.files.pdfFile[0];
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const sanitizedFilename = pdfFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const s3Filename = `${uniqueSuffix}-${sanitizedFilename}`;
      
      console.log(`Uploading PDF file: ${s3Filename}`);
      
      const pdfResult = await uploadToS3(
        pdfFile.buffer,
        s3Filename,
        pdfFile.mimetype,
        'pdf'
      );

      if (!pdfResult.success) {
        // Xóa EPUB file nếu đã upload
        if (uploadedS3Keys.length > 0) {
          for (const key of uploadedS3Keys) {
            await deleteFromS3(key);
          }
        }
        await cleanupUploadedResources(uploadedResources);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi upload file PDF lên S3',
          error: pdfResult.error
        });
      }

      bookFiles.pdf = pdfResult.url;
      uploadedS3Keys.push(pdfResult.key);
    }

    // Lưu danh sách keys để cleanup nếu cần
    uploadedResources.s3Keys = uploadedS3Keys;

    // Tạo sách mới
    const newBook = new Book({
      title,
      category,
      authors: parsedAuthors,
      publisher,
      dimensions,
      publicationYear: parseInt(publicationYear) || undefined,
      isbn,
      language,
      description,
      documentType: documentType || 'other',
      pages: parseInt(pages) || undefined,
      coverImages: coverImageUrls,
      bookFiles: bookFiles,
      ebookOptions: parsedEbookOptions,
      active: active === 'true' || active === true || true, // Mặc định true nếu không có
      featured: featured === 'true' || featured === true || false // Mặc định false nếu không có
    });

    // Lưu sách vào cơ sở dữ liệu
    await newBook.save();

    res.status(201).json({
      success: true,
      message: 'Thêm sách thành công',
      data: newBook
    });

  } catch (error) {
    console.error('Lỗi khi tạo sách mới:', error);
    
    // Xóa tất cả các file đã upload nếu có lỗi
    await cleanupUploadedResources(uploadedResources);
    
    // Xử lý lỗi validation
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0]
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo sách mới',
      error: error.message
    });
  }
};

// Hàm trợ giúp để xóa các resource đã upload nếu quá trình tạo sách thất bại
async function cleanupUploadedResources(resources) {
  try {
    // Xóa các ảnh bìa từ Cloudinary
    if (resources.cloudinaryUrls && resources.cloudinaryUrls.length > 0) {
      for (const item of resources.cloudinaryUrls) {
        if (item.publicId) {
          await cloudinary.uploader.destroy(item.publicId);
          console.log(`Đã xóa ảnh Cloudinary: ${item.publicId}`);
        }
      }
    }
    
    // Xóa các file sách từ S3 (có thể có nhiều file)
    if (resources.s3Key) {
      await deleteFromS3(resources.s3Key);
      console.log(`Đã xóa file S3: ${resources.s3Key}`);
    }
    
    // Xóa nhiều file S3 nếu có
    if (resources.s3Keys && resources.s3Keys.length > 0) {
      for (const key of resources.s3Keys) {
        await deleteFromS3(key);
        console.log(`Đã xóa file S3: ${key}`);
      }
    }
  } catch (cleanupError) {
    console.error('Lỗi khi dọn dẹp tài nguyên:', cleanupError);
  }
}

// @desc    Lấy danh sách tất cả sách
// @route   GET /api/books
// @access  Public
export const getAllBooks = async (req, res) => {
  try {
    const books = await Book
      .find({})
      .populate('category', 'name')
      .populate('authors', 'name')
      .select('-bookFiles') // Không lấy link file sách
      .sort('-createdAt');
    
    // Tính toán thống kê theo loại tài liệu
    const stats = {
      total: books.length,
      byDocumentType: {
        textbook: books.filter(book => book.documentType === 'textbook').length,
        other: books.filter(book => book.documentType === 'other').length
      }
    };
    
    res.status(200).json({
      success: true,
      count: books.length,
      stats: stats,
      data: books
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách sách:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách sách',
      error: error.message
    });
  }
};

// @desc    Lấy chi tiết sách
// @route   GET /api/books/:slug
// @access  Public
export const getBookDetail = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Tìm kiếm chỉ theo slug
    const book = await Book.findOne({
      slug: slug,
      active: true
    })
    .populate('category', 'name slug')
    .populate('authors', 'name slug bio');
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }
    
    res.status(200).json({
      success: true,
      data: book
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết sách:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết sách',
      error: error.message
    });
  }
};

// @desc    Lấy chi tiết sách theo ID
// @route   GET /api/books/detail/:id
// @access  Public
export const getBookDetailById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra ID có hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID sách không hợp lệ'
      });
    }
    
    // Tìm kiếm theo ID
    const book = await Book.findOne({
      _id: id,
      active: true
    })
    .populate('category', 'name slug')
    .populate('authors', 'name slug bio');
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }
    
    res.status(200).json({
      success: true,
      data: book
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết sách theo ID:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết sách',
      error: error.message
    });
  }
};

// @desc    Chỉnh sửa thông tin sách
// @route   PUT /api/books/:id
// @access  Private (Admin)
export const updateBook = async (req, res) => {
  // Theo dõi các file đã upload để xóa nếu xảy ra lỗi
  const uploadedResources = {
    cloudinaryUrls: [],
    s3Key: null
  };

  try {
    const { id } = req.params;

    // Tìm sách cần cập nhật
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }

    // Lấy dữ liệu từ request body
    const {
      title,
      category,
      authors,
      publisher,
      dimensions,
      publicationYear,
      isbn,
      language,
      description,
      documentType,
      pages,
      ebookOptions,
      active,
      featured,
      removeCoverImages
    } = req.body;

    // Cập nhật các trường thông tin cơ bản
    if (title) book.title = title;
    if (category) book.category = category;
    if (publisher) book.publisher = publisher;
    if (dimensions) book.dimensions = dimensions;
    if (publicationYear) book.publicationYear = parseInt(publicationYear);
    if (isbn) book.isbn = isbn;
    if (language) book.language = language;
    if (description !== undefined) book.description = description;
    if (documentType) book.documentType = documentType;
    if (pages) book.pages = parseInt(pages);
    if (active !== undefined) book.active = active === 'true' || active === true;
    if (featured !== undefined) book.featured = featured === 'true' || featured === true;

    // Cập nhật tác giả nếu có
    if (authors) {
      const parsedAuthors = typeof authors === 'string' ? JSON.parse(authors) : authors;
      if (Array.isArray(parsedAuthors) && parsedAuthors.length > 0) {
        book.authors = parsedAuthors;
      }
    }

    // Cập nhật tùy chọn ebook
    if (ebookOptions) {
      const parsedEbookOptions = typeof ebookOptions === 'string' ? JSON.parse(ebookOptions) : ebookOptions;
      if (Array.isArray(parsedEbookOptions) && parsedEbookOptions.length > 0) {
        book.ebookOptions = parsedEbookOptions;
      }
    }

    // Xử lý xóa ảnh bìa cũ nếu có yêu cầu
    if (removeCoverImages && Array.isArray(JSON.parse(removeCoverImages))) {
      const imagesToRemove = JSON.parse(removeCoverImages);
      // Lọc ra các URL của các ảnh cần giữ lại
      const remainingImages = book.coverImages.filter((_, index) => !imagesToRemove.includes(index));
      book.coverImages = remainingImages;
    }

    // Xử lý upload ảnh bìa mới nếu có
    if (req.files && req.files.coverImages) {
      const coverImageFiles = Array.isArray(req.files.coverImages) 
        ? req.files.coverImages 
        : [req.files.coverImages];
      
      for (const file of coverImageFiles) {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              folder: 'book_covers',
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          
          uploadStream.end(file.buffer);
        });
        
        // Theo dõi URL Cloudinary để có thể xóa nếu có lỗi
        uploadedResources.cloudinaryUrls.push({
          url: result.secure_url,
          publicId: result.public_id
        });
        
        // Thêm URL mới vào mảng coverImages
        book.coverImages.push(result.secure_url);
      }
    }

    // Xử lý upload file ebook mới nếu có
    const uploadedS3Keys = [];
    
    // Xử lý file EPUB mới nếu có
    if (req.files && req.files.epubFile) {
      const epubFile = req.files.epubFile[0];
      
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const sanitizedFilename = epubFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const s3Filename = `${uniqueSuffix}-${sanitizedFilename}`;
      
      const epubResult = await uploadToS3(
        epubFile.buffer,
        s3Filename,
        epubFile.mimetype,
        'epub'
      );

      if (!epubResult.success) {
        await cleanupUploadedResources(uploadedResources);
        return res.status(500).json({
          success: false,
          message: 'Không thể tải file EPUB lên S3',
          error: epubResult.error
        });
      }

      // Xóa file EPUB cũ trên S3 nếu có
      if (book.bookFiles && book.bookFiles.epub) {
        const oldKey = book.bookFiles.epub.split('/').slice(-2).join('/');
        if (oldKey) {
          await deleteFromS3(oldKey).catch(err => {
            console.warn('Không thể xóa file EPUB cũ từ S3:', err);
          });
        }
      }

      // Cập nhật URL file EPUB mới
      if (!book.bookFiles) book.bookFiles = {};
      book.bookFiles.epub = epubResult.url;
      uploadedS3Keys.push(epubResult.key);
    }

    // Xử lý file PDF mới nếu có
    if (req.files && req.files.pdfFile) {
      const pdfFile = req.files.pdfFile[0];
      
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const sanitizedFilename = pdfFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const s3Filename = `${uniqueSuffix}-${sanitizedFilename}`;
      
      const pdfResult = await uploadToS3(
        pdfFile.buffer,
        s3Filename,
        pdfFile.mimetype,
        'pdf'
      );

      if (!pdfResult.success) {
        // Xóa EPUB file nếu đã upload trong request này
        if (uploadedS3Keys.length > 0) {
          for (const key of uploadedS3Keys) {
            await deleteFromS3(key);
          }
        }
        await cleanupUploadedResources(uploadedResources);
        return res.status(500).json({
          success: false,
          message: 'Không thể tải file PDF lên S3',
          error: pdfResult.error
        });
      }

      // Xóa file PDF cũ trên S3 nếu có
      if (book.bookFiles && book.bookFiles.pdf) {
        const oldKey = book.bookFiles.pdf.split('/').slice(-2).join('/');
        if (oldKey) {
          await deleteFromS3(oldKey).catch(err => {
            console.warn('Không thể xóa file PDF cũ từ S3:', err);
          });
        }
      }

      // Cập nhật URL file PDF mới
      if (!book.bookFiles) book.bookFiles = {};
      book.bookFiles.pdf = pdfResult.url;
      uploadedS3Keys.push(pdfResult.key);
    }

    // Lưu keys để cleanup nếu cần
    if (uploadedS3Keys.length > 0) {
      uploadedResources.s3Keys = uploadedS3Keys;
    }

    // Lưu thay đổi
    await book.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật sách thành công',
      data: book
    });

  } catch (error) {
    console.error('Lỗi khi cập nhật sách:', error);
    
    // Xóa tất cả các file đã upload nếu có lỗi
    await cleanupUploadedResources(uploadedResources);
    
    // Xử lý lỗi validation
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0]
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật sách',
      error: error.message
    });
  }
};

// @desc    Toggle book active status (hide/show)
// @route   PATCH /api/books/:id/toggle-status
// @access  Private (Admin)
export const toggleBookStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findById(id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }
    
    // Toggle status based on request body or simply toggle the current value
    const newStatus = req.body.status !== undefined ? req.body.status : !book.active;
    book.active = newStatus;
    
    await book.save();
    
    res.status(200).json({
      success: true,
      message: `Đã ${book.active ? 'hiển thị' : 'ẩn'} sách thành công`,
      data: {
        _id: book._id,
        title: book.title,
        active: book.active
      }
    });
  } catch (error) {
    console.error('Lỗi khi thay đổi trạng thái sách:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thay đổi trạng thái sách',
      error: error.message
    });
  }
};

// @desc    Toggle book featured status
// @route   PATCH /api/books/:id/toggle-featured
// @access  Private (Admin)
export const toggleFeaturedStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findById(id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }
    
    // Toggle featured status based on request body or simply toggle the current value
    const newFeaturedStatus = req.body.featured !== undefined ? req.body.featured : !book.featured;
    book.featured = newFeaturedStatus;
    
    await book.save();
    
    res.status(200).json({
      success: true,
      message: `Đã ${book.featured ? 'đánh dấu' : 'bỏ đánh dấu'} sách nổi bật thành công`,
      data: {
        _id: book._id,
        title: book.title,
        featured: book.featured
      }
    });
  } catch (error) {
    console.error('Lỗi khi thay đổi trạng thái nổi bật của sách:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thay đổi trạng thái nổi bật của sách',
      error: error.message
    });
  }
};

// @desc    Lấy danh sách sách theo danh mục
// @route   GET /api/books/by-category/:slug
// @access  Public
export const getBooksByCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const { 
      documentType, 
      author,
      sort = 'relevance',
      page = 1,
      limit = 6
    } = req.query;

    // Chuyển page và limit thành số
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Tìm danh mục theo slug
    const category = await Category.findOne({ slug, active: true });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    // Xây dựng bộ lọc (bỏ bookType filter)
    const filter = { 
      category: category._id,
      active: true
    };

    // Thêm bộ lọc loại tài liệu nếu được chỉ định (getBooksByCategory)
    if (documentType && ['textbook', 'other'].includes(documentType)) {
      filter.documentType = documentType;
    }

    // Thêm bộ lọc tác giả nếu được chỉ định
    if (author) {
      // Tìm tác giả theo slug
      const authorObj = await Author.findOne({ slug: author });
      if (authorObj) {
        filter.authors = { $in: [authorObj._id] };
      }
    }

    // Xây dựng tùy chọn sắp xếp
    let sortOption = {};

    switch (sort) {
      case 'title_asc':
        sortOption = { title: 1 };
        break;
      case 'title_desc':
        sortOption = { title: -1 };
        break;
      case 'price_asc':
      case 'price_desc':
        // Sắp xếp theo giá ebook
        break;
      case 'relevance':
      default:
        sortOption = { featured: -1, createdAt: -1 };
        break;
    }

    // Chọn các trường cần thiết
    const select = 'title slug coverImages ebookOptions averageRating totalReviews featured documentType authors pages';

    // Nếu sắp xếp theo giá ebook
    if (sort === 'price_asc' || sort === 'price_desc') {
      const sortDirection = sort === 'price_asc' ? 1 : -1;

      const totalDocs = await Book.countDocuments(filter);

      const books = await Book.aggregate([
        { $match: filter },
        // Lookup để lấy thông tin tác giả
        {
          $lookup: {
            from: 'authors',
            localField: 'authors',
            foreignField: '_id',
            as: 'authors'
          }
        },
        {
          $addFields: {
            // Sắp xếp theo giá ebook thấp nhất
            sortPrice: {
              $cond: {
                if: { $gt: [{ $size: '$ebookOptions' }, 0] },
                then: { $min: '$ebookOptions.price' },
                else: 0
              }
            }
          }
        },
        { $sort: { sortPrice: sortDirection } },
        { $skip: skip },
        { $limit: limitNum },
        {
          $project: {
            title: 1,
            slug: 1,
            coverImages: 1,
            ebookOptions: 1,
            averageRating: 1,
            totalReviews: 1,
            featured: 1,
            documentType: 1,
            authors: { _id: 1, name: 1, slug: 1 },
            pages: 1
          }
        }
      ]);

      return res.status(200).json({
        success: true,
        count: books.length,
        totalPages: Math.ceil(totalDocs / limitNum),
        currentPage: pageNum,
        category: {
          _id: category._id,
          name: category.name,
          slug: category.slug
        },
        data: books
      });
    }

    // Đối với các phương thức sắp xếp khác, sử dụng find thông thường với phân trang
    const totalDocs = await Book.countDocuments(filter);
    const books = await Book.find(filter)
      .select(select)
      .sort(sortOption)
      .populate('authors', 'name slug')
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: books.length,
      totalPages: Math.ceil(totalDocs / limitNum),
      currentPage: pageNum,
      category: {
        _id: category._id,
        name: category.name,
        slug: category.slug
      },
      data: books
    });
  } catch (error) {
    console.error('Lỗi khi lấy sách theo danh mục:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy sách theo danh mục',
      error: error.message
    });
  }
};

// @desc    Tìm kiếm sách theo từ khóa với bộ lọc và phân trang
// @route   GET /api/books/search
// @access  Public
export const searchBooks = async (req, res) => {
  try {
    const { 
      q: keyword,
      documentType, 
      category,
      author,
      sort = 'relevance',
      page = 1,
      limit = 6
    } = req.query;

    // Kiểm tra từ khóa tìm kiếm
    if (!keyword || keyword.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập từ khóa tìm kiếm'
      });
    }

    // Chuyển page và limit thành số
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Xây dựng bộ lọc cơ bản (bỏ bookType filter)
    const searchRegex = { 
      $regex: keyword.trim(), 
      $options: 'i' 
    };
    
    const filter = { 
      active: true,
      $or: [
        { title: searchRegex }, //tiêu đề
        { description: searchRegex } // mô tả
      ]
    };

    // Thêm bộ lọc loại tài liệu nếu được chỉ định (searchBooks)
    if (documentType && ['textbook', 'other'].includes(documentType)) {
      filter.documentType = documentType;
    }

    // Thêm bộ lọc danh mục nếu được chỉ định
    if (category) {
      const categoryObj = await Category.findOne({ slug: category, active: true });
      if (categoryObj) {
        filter.category = categoryObj._id;
      }
    }

    // Thêm bộ lọc tác giả nếu được chỉ định
    if (author) {
      const authorObj = await Author.findOne({ slug: author });
      if (authorObj) {
        filter.authors = { $in: [authorObj._id] };
      }
    }

    // Xây dựng tùy chọn sắp xếp (bỏ logic sách giấy)
    let sortOption = {};

    switch (sort) {
      case 'title_asc':
        sortOption = { title: 1 };
        break;
      case 'title_desc':
        sortOption = { title: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'rating':
        sortOption = { averageRating: -1, totalReviews: -1 };
        break;
      case 'price_asc':
      case 'price_desc':
        // Sắp xếp theo giá ebook
        break;
      case 'relevance':
      default:
        // Sắp xếp theo độ liên quan: sách nổi bật trước, rating cao, mới nhất
        sortOption = { 
          featured: -1, 
          averageRating: -1,
          createdAt: -1 
        };
        break;
    }

    // Chọn các trường cần thiết (bỏ paperBookInfo)
    const select = 'title slug coverImages ebookOptions averageRating totalReviews featured documentType authors pages category createdAt';

    // Nếu sắp xếp theo giá ebook
    if (sort === 'price_asc' || sort === 'price_desc') {
      const sortDirection = sort === 'price_asc' ? 1 : -1;

      const totalDocs = await Book.countDocuments(filter);

      const books = await Book.aggregate([
        { $match: filter },
        // ...existing code for lookup...
        {
          $addFields: {
            // Sắp xếp theo giá ebook thấp nhất
            sortPrice: {
              $cond: {
                if: { $gt: [{ $size: '$ebookOptions' }, 0] },
                then: { $min: '$ebookOptions.price' },
                else: 0
              }
            }
          }
        },
        { $sort: { sortPrice: sortDirection } },
        { $skip: skip },
        { $limit: limitNum },
        {
          $project: {
            title: 1,
            slug: 1,
            coverImages: 1,
            ebookOptions: 1,
            averageRating: 1,
            totalReviews: 1,
            featured: 1,
            documentType: 1,
            pages: 1,
            createdAt: 1,
            authors: { _id: 1, name: 1, slug: 1 },
            category: { _id: 1, name: 1, slug: 1 }
          }
        }
      ]);

      return res.status(200).json({
        success: true,
        count: books.length,
        totalPages: Math.ceil(totalDocs / limitNum),
        currentPage: pageNum,
        keyword: keyword.trim(),
        data: books
      });
    }

    // Đối với các phương thức sắp xếp khác
    const totalDocs = await Book.countDocuments(filter);
    
    const books = await Book.find(filter)
      .select(select)
      .sort(sortOption)
      .populate('authors', 'name slug')
      .populate('category', 'name slug')
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: books.length,
      totalPages: Math.ceil(totalDocs / limitNum),
      currentPage: pageNum,
      keyword: keyword.trim(),
      data: books
    });
  } catch (error) {
    console.error('Lỗi khi tìm kiếm sách:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tìm kiếm sách',
      error: error.message
    });
  }
};
