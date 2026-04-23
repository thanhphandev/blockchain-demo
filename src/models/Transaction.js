/**
 * ============================================================================
 * TRANSACTION.JS - Mô hình Giao Dịch chuẩn cấu trúc Blockchain
 * ============================================================================
 * 
 * Đại diện cho một giao dịch chuyển coin.
 * Bao gồm các tính năng Production Standard:
 * - Hashing dữ liệu giao dịch.
 * - Ký điện tử (Elliptic Curve Digital Signature Algorithm - ECDSA).
 * - Xác minh chữ ký số (Verify Signature).
 */

const SHA256 = require('crypto-js/sha256');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1'); // Chuẩn P-256k1 (Dùng cho Bitcoin)

class Transaction {
    /**
     * @param {string} fromAddress Địa chỉ ví người gửi (Public Key dạng Hex). Nếu là thưởng đào coin (Mining Reward), giá trị này là null/system.
     * @param {string} toAddress Địa chỉ ví người nhận (Public Key dạng Hex)
     * @param {number} amount Số lượng coin chuyển
     * @param {number} [timestamp] Thời điểm tạo giao dịch (không bắt buộc)
     */
    constructor(fromAddress, toAddress, amount, timestamp) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = Number(amount); // Ép kiểu Number để tránh lỗi cộng chuỗi
        this.timestamp = timestamp || Date.now();
        this.signature = ''; // Chữ ký sẽ được thêm sau khi ký
    }

    /**
     * Băm thông tin giao dịch để chuẩn bị ký
     * Không bao gồm chữ ký trong lúc băm.
     */
    calculateHash() {
        return SHA256(this.fromAddress + this.toAddress + this.amount + this.timestamp).toString();
    }

    /**
     * Ký giao dịch bằng Private Key
     * 
     * @param {Object} signingKey Object KeyPair sinh ra từ thư viện Elliptic
     */
    signTransaction(signingKey) {
        // Kiểm tra xem Private Key có khớp với ví From không
        // Người dùng chỉ có thể dùng Private key của họ để ký cho địa chỉ ví của họ.
        if (signingKey.getPublic('hex') !== this.fromAddress) {
            throw new Error('❌ Lỗi Bảo Mật: Bạn không thể ký giao dịch thay cho ví khác!');
        }

        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64');
        this.signature = sig.toDER('hex');
    }

    /**
     * Xác minh tính hợp lệ của giao dịch
     * Các trường hợp đặc biệt:
     * - Giao dịch thưởng khai thác (Reward) không có chữ ký.
     * - Các giao dịch khác bắt buộc phải có đủ fromAddress, toAddress, amount > 0 và Chữ ký đúng.
     */
    isValid() {
        // Giao dịch từ Hệ thống (Phần thưởng đào coin)
        if (this.fromAddress === null || this.fromAddress === '0000000000000000000000000000000000000000000000000000000000000000') {
            return true;
        }

        if (!this.signature || this.signature.length === 0) {
            throw new Error('❌ Giao dịch thiếu chữ ký!');
        }

        if (this.amount <= 0) {
            throw new Error('❌ Số lượng chuyển phải lớn hơn 0!');
        }

        if (!this.toAddress) {
            throw new Error('❌ Thiếu địa chỉ người nhận!');
        }

        // Tái tạo lại Public Key object từ chuỗi Hex
        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');

        // Xác minh xem chữ ký (từ lúc tạo) có khớp với Dữ liệu gốc và Public Key không
        return publicKey.verify(this.calculateHash(), this.signature);
    }
}

module.exports = Transaction;
