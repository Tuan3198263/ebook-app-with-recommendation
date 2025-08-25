import dotenv from 'dotenv';
import crypto from 'crypto';
import qs from 'qs';

// Load environment variables
dotenv.config();

// Test với dữ liệu từ URL thực tế
const testParams = {
    vnp_Amount: '1000000',
    vnp_Command: 'pay',
    vnp_CreateDate: '20250615121157',
    vnp_CurrCode: 'VND',
    vnp_IpAddr: '127.0.0.1',
    vnp_Locale: 'vn',
    vnp_OrderInfo: 'Order20250615121157',
    vnp_OrderType: 'other',
    vnp_ReturnUrl: 'http://localhost:3000/api/payment/vnpay-return',
    vnp_TmnCode: 'WXURUK2G',
    vnp_TxnRef: '20250615121157',
    vnp_Version: '2.1.0'
};

console.log('=== DEBUG HASH GENERATION ===');
console.log('Test Params:', testParams);
console.log('Hash Secret:', process.env.VNP_HASH_SECRET);

// Thử cách 1: qs.stringify với encode: false (như code mẫu VNPay NodeJS)
console.log('\n--- Method 1: qs.stringify with encode: false ---');
const signData1 = qs.stringify(testParams, { encode: false });
console.log('SignData1:', signData1);

const hmac1 = crypto.createHmac("sha512", process.env.VNP_HASH_SECRET);
const hash1 = hmac1.update(Buffer.from(signData1, 'utf-8')).digest("hex");
console.log('Hash1:', hash1);

// Thử cách 2: Manual concatenation không encode
console.log('\n--- Method 2: Manual concatenation (no encode) ---');
const sortedKeys = Object.keys(testParams).sort();
let signData2 = '';
for (let i = 0; i < sortedKeys.length; i++) {
    let key = sortedKeys[i];
    if (i > 0) {
        signData2 += '&';
    }
    signData2 += key + '=' + testParams[key];
}
console.log('SignData2:', signData2);

const hmac2 = crypto.createHmac("sha512", process.env.VNP_HASH_SECRET);
const hash2 = hmac2.update(Buffer.from(signData2, 'utf-8')).digest("hex");
console.log('Hash2:', hash2);

// Thử cách 3: Manual concatenation với encode
console.log('\n--- Method 3: Manual concatenation (with encode) ---');
let signData3 = '';
for (let i = 0; i < sortedKeys.length; i++) {
    let key = sortedKeys[i];
    if (i > 0) {
        signData3 += '&';
    }
    signData3 += encodeURIComponent(key) + '=' + encodeURIComponent(testParams[key]);
}
console.log('SignData3:', signData3);

const hmac3 = crypto.createHmac("sha512", process.env.VNP_HASH_SECRET);
const hash3 = hmac3.update(Buffer.from(signData3, 'utf-8')).digest("hex");
console.log('Hash3:', hash3);

console.log('\n=== COMPARISON ===');
console.log('Expected Hash: 8912d83ed93870faa29e64916b675f45aa194b3440cb99c1554fb2b04009702650de3c81125971797a72c165862a848f94ff3520a607a165e01dd81d71fca813');
console.log('Hash1 Match:', hash1 === '8912d83ed93870faa29e64916b675f45aa194b3440cb99c1554fb2b04009702650de3c81125971797a72c165862a848f94ff3520a607a165e01dd81d71fca813');
console.log('Hash2 Match:', hash2 === '8912d83ed93870faa29e64916b675f45aa194b3440cb99c1554fb2b04009702650de3c81125971797a72c165862a848f94ff3520a607a165e01dd81d71fca813');
console.log('Hash3 Match:', hash3 === '8912d83ed93870faa29e64916b675f45aa194b3440cb99c1554fb2b04009702650de3c81125971797a72c165862a848f94ff3520a607a165e01dd81d71fca813');
