import crypto from 'crypto';
import qs from 'qs'; // Dùng qs thay vì querystring như VNPay mẫu
import moment from 'moment';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Cấu hình VNPay
const vnpConfig = {
    vnp_TmnCode: process.env.VNP_TMN_CODE , // Mã định danh merchant
    vnp_HashSecret: process.env.VNP_HASH_SECRET , // Secret key
    vnp_Url: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html', // URL thanh toán sandbox
    vnp_ReturnUrl: process.env.VNP_RETURN_URL || 'http://localhost:3000/api/payment/vnpay-return', // URL trả về
    vnp_IpnUrl: process.env.VNP_IPN_URL || 'http://localhost:3000/api/payment/vnpay-ipn', // URL IPN
    vnp_QueryUrl: process.env.VNP_API_URL || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction', // URL API truy vấn
};

// Hàm sắp xếp object theo key
function sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    keys.forEach(key => {
        sorted[key] = obj[key];
    });
    return sorted;
}

// Hàm tạo URL thanh toán
function createPaymentUrl(params) {
    let vnp_Params = {};
    
    // Các tham số cố định
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = vnpConfig.vnp_TmnCode;
    vnp_Params['vnp_CurrCode'] = 'VND';
      // Các tham số từ input
    vnp_Params['vnp_Locale'] = params.vnp_Locale || 'vn';
    vnp_Params['vnp_TxnRef'] = params.vnp_TxnRef;
    vnp_Params['vnp_OrderInfo'] = params.vnp_OrderInfo;
    vnp_Params['vnp_OrderType'] = params.vnp_OrderType || 'other';
    vnp_Params['vnp_Amount'] = params.vnp_Amount * 100; // Nhân 100 theo yêu cầu VNPay
    vnp_Params['vnp_ReturnUrl'] = params.vnp_ReturnUrl || vnpConfig.vnp_ReturnUrl;
    vnp_Params['vnp_IpAddr'] = params.vnp_IpAddr;
    vnp_Params['vnp_CreateDate'] = params.vnp_CreateDate;
    
    // KHÔNG thêm vnp_ExpireDate để match với VNPay mẫu - VNPay sẽ sử dụng thời gian hết hạn mặc định
    
    // Không truyền vnp_BankCode để cho phép khách hàng chọn phương thức thanh toán tại VNPay
    // Theo tài liệu VNPay: "Nếu loại bỏ tham số không gửi sang, khách hàng sẽ chọn phương thức thanh toán, ngân hàng thanh toán tại VNPAY"    // Sắp xếp tham số
    vnp_Params = sortObject(vnp_Params);
    
    // Tạo hash từ encoded data
    let signData = '';
    let sortedKeys = Object.keys(vnp_Params).sort();
    for (let i = 0; i < sortedKeys.length; i++) {
        let key = sortedKeys[i];
        if (i > 0) {
            signData += '&';
        }
        // Encode cả key và value
        signData += encodeURIComponent(key) + '=' + encodeURIComponent(vnp_Params[key]);
    }
    
    // Tạo chữ ký từ encoded data
    var hmac = crypto.createHmac("sha512", vnpConfig.vnp_HashSecret);
    var signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
    vnp_Params['vnp_SecureHash'] = signed;
    
    // Tạo URL với encode đúng cách
    var vnpUrl = vnpConfig.vnp_Url + '?' + qs.stringify(vnp_Params, { encode: true });
    
    return vnpUrl;
}

// Hàm xác thực chữ ký trả về
function verifyReturnUrl(vnp_Params) {
    let secureHash = vnp_Params['vnp_SecureHash'];
    
    // Tạo bản sao để không thay đổi object gốc
    let tempParams = { ...vnp_Params };
    delete tempParams['vnp_SecureHash'];
    delete tempParams['vnp_SecureHashType'];
    
    tempParams = sortObject(tempParams);
    
    // Tạo signData với encoded data (đồng nhất với createPaymentUrl)
    let signData = '';
    let sortedKeys = Object.keys(tempParams).sort();
    for (let i = 0; i < sortedKeys.length; i++) {
        let key = sortedKeys[i];
        if (i > 0) {
            signData += '&';
        }
        // Encode như createPaymentUrl
        signData += encodeURIComponent(key) + '=' + encodeURIComponent(tempParams[key]);
    }
    
    let hmac = crypto.createHmac("sha512", vnpConfig.vnp_HashSecret);
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
    
    return secureHash === signed;
}

// Hàm xác thực IPN
function verifyIpnCall(vnp_Params) {
    let secureHash = vnp_Params['vnp_SecureHash'];
    let orderInfo = vnp_Params['vnp_OrderInfo'];
    let orderId = vnp_Params['vnp_TxnRef'];
    let amount = vnp_Params['vnp_Amount'];
    let paymentStatus = vnp_Params['vnp_ResponseCode'];
    
    // Tạo bản sao để không thay đổi object gốc
    let tempParams = { ...vnp_Params };
    delete tempParams['vnp_SecureHash'];
    delete tempParams['vnp_SecureHashType'];      tempParams = sortObject(tempParams);
      // Tạo chuỗi để ký (encode theo format VNPay)
    let signData = '';
    let sortedKeys = Object.keys(tempParams).sort();
    for (let i = 0; i < sortedKeys.length; i++) {
        let key = sortedKeys[i];
        if (i > 0) {
            signData += '&';
        }
        // Encode như code PHP mẫu
        signData += encodeURIComponent(key) + '=' + encodeURIComponent(tempParams[key]);
    }
    
    let hmac = crypto.createHmac("sha512", vnpConfig.vnp_HashSecret);
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
    
    let isValidSignature = secureHash === signed;
    let isSuccess = paymentStatus === '00';
    
    return {
        isValid: isValidSignature,
        isSuccess: isSuccess,
        orderId: orderId,
        amount: amount / 100, // Chia 100 để trở về số tiền gốc
        orderInfo: orderInfo,
        paymentStatus: paymentStatus,
        ...tempParams
    };
}

// Hàm truy vấn giao dịch
async function queryTransaction(params) {
    try {
        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'querydr';
        vnp_Params['vnp_TmnCode'] = vnpConfig.vnp_TmnCode;
        vnp_Params['vnp_TxnRef'] = params.vnp_TxnRef;
        vnp_Params['vnp_OrderInfo'] = params.vnp_OrderInfo;
        vnp_Params['vnp_TransactionNo'] = params.vnp_TransactionNo || '';
        vnp_Params['vnp_TransactionDate'] = params.vnp_TransactionDate;
        vnp_Params['vnp_CreateDate'] = params.vnp_CreateDate;
        vnp_Params['vnp_IpAddr'] = params.vnp_IpAddr;        vnp_Params = sortObject(vnp_Params);
        
        // Tạo chuỗi để ký (không encode)
        let signData = '';
        let sortedKeys = Object.keys(vnp_Params).sort();
        for (let i = 0; i < sortedKeys.length; i++) {
            let key = sortedKeys[i];
            if (i > 0) {
                signData += '&';
            }
            signData += key + '=' + vnp_Params[key];
        }
        
        let hmac = crypto.createHmac("sha512", vnpConfig.vnp_HashSecret);
        let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
        vnp_Params['vnp_SecureHash'] = signed;
        
        // Tạo body cho request (có encode)
        let requestBody = '';
        let sortedKeysWithHash = Object.keys(vnp_Params).sort();
        for (let i = 0; i < sortedKeysWithHash.length; i++) {
            let key = sortedKeysWithHash[i];
            if (i > 0) {
                requestBody += '&';
            }
            requestBody += key + '=' + encodeURIComponent(vnp_Params[key]);
        }
        
        // Gửi request đến VNPay API
        const response = await fetch(vnpConfig.vnp_QueryUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: requestBody
        });
        
        const result = await response.text();
        return querystring.parse(result);
        
    } catch (error) {
        throw new Error(`Query transaction failed: ${error.message}`);
    }
}

export default {
    createPaymentUrl,
    verifyReturnUrl,
    verifyIpnCall,
    queryTransaction,
    config: vnpConfig
};
