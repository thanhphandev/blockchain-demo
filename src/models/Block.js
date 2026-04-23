/**
 * ============================================================================
 * BLOCK.JS - Lớp Block đại diện cho một khối trong Blockchain
 * ============================================================================
 * 
 * Mỗi Block trong Blockchain chứa các thông tin:
 * - index: Vị trí của block trong chuỗi (0, 1, 2, ...)
 * - timestamp: Thời điểm block được tạo
 * - transactions: Dữ liệu giao dịch (có thể là bất kỳ thông tin nào)
 * - previousHash: Mã hash của block trước đó (tạo liên kết chuỗi)
 * - hash: Mã hash của chính block này
 * - nonce: Số ngẫu nhiên dùng trong quá trình đào (Proof of Work)
 * 
 * @author Tiểu luận Blockchain - Cuối kỳ
 */

// Import thư viện crypto-js để tạo mã hash SHA256
const SHA256 = require('crypto-js/sha256');

/**
 * Class Block - Đại diện cho một khối trong chuỗi Blockchain
 * 
 * Mỗi block giống như một "trang sổ cái" chứa các giao dịch.
 * Các trang được nối với nhau bằng mã hash, tạo thành chuỗi liên kết.
 */
class Block {
    /**
     * Constructor - Khởi tạo một Block mới
     * 
     * @param {number} index - Vị trí của block trong chuỗi
     * @param {string} timestamp - Thời điểm tạo block (ISO string)
     * @param {Array|Object} transactions - Dữ liệu giao dịch
     * @param {string} previousHash - Hash của block trước đó
     */
    constructor(index, timestamp, transactions, previousHash = '', nonce = 0, hash = '') {
        this.index = index;                    // Số thứ tự block
        this.timestamp = timestamp;            // Thời gian tạo
        this.transactions = transactions;      // Dữ liệu giao dịch
        this.previousHash = previousHash;      // Hash của block trước
        this.nonce = nonce;                    // Số dùng cho Proof of Work (mặc định 0)
        this.hash = hash || this.calculateHash(); // Hash của block này
    }

    /**
     * calculateHash() - Tính mã hash SHA256 cho block
     * 
     * Hash được tính từ TẤT CẢ dữ liệu của block:
     * - index, previousHash, timestamp, transactions, nonce
     * 
     * Nếu BẤT KỲ thông tin nào thay đổi, hash sẽ HOÀN TOÀN khác.
     * Đây là nguyên lý cốt lõi đảm bảo tính bất biến của Blockchain.
     * 
     * @returns {string} Mã hash SHA256 dạng hex
     */
    calculateHash() {
        // Nối tất cả dữ liệu thành một chuỗi và tính hash
        return SHA256(
            this.index +
            this.previousHash +
            this.timestamp +
            JSON.stringify(this.transactions) +
            this.nonce
        ).toString();
    }

    /**
     * mineBlock(difficulty) - Đào block với độ khó cho trước (Proof of Work)
     * 
     * ============================================================================
     * GIẢI THÍCH CƠ CHẾ PROOF OF WORK (PoW):
     * ============================================================================
     * 
     * Proof of Work là cơ chế bảo mật quan trọng nhất của Blockchain.
     * Nó yêu cầu máy tính phải "làm việc" (tính toán) để tìm ra một hash hợp lệ.
     * 
     * VÍ DỤ: Với difficulty = 4, hash hợp lệ phải bắt đầu bằng "0000"
     * 
     * TẠI SAO CƠ CHẾ NÀY BẢO VỆ BLOCKCHAIN?
     * ----------------------------------------------------------------------------
     * 
     * 1. CHI PHÍ THỜI GIAN:
     *    - Để tìm được hash bắt đầu bằng "0000", máy phải thử hàng triệu lần
     *    - Mỗi lần thử, nonce tăng lên 1 và tính lại hash
     *    - Với difficulty = 4, trung bình cần ~65,000 lần thử
     * 
     * 2. CHỐNG SỬA ĐỔI DỮ LIỆU:
     *    - Nếu hacker muốn sửa dữ liệu ở Block #5:
     *      + Hash của Block #5 thay đổi
     *      + previousHash của Block #6 không khớp nữa
     *      + Hacker phải đào lại Block #6, #7, #8... đến block mới nhất
     *    - Trong khi hacker đào lại, mạng lưới đã thêm nhiều block mới
     *    - Hacker KHÔNG BAO GIỜ đuổi kịp được chuỗi chính
     * 
     * 3. QUY TẮC CHUỖI DÀI NHẤT:
     *    - Mạng Blockchain luôn chấp nhận chuỗi dài nhất là chuỗi hợp lệ
     *    - Để chiếm quyền kiểm soát, hacker cần >51% sức mạnh tính toán toàn mạng
     *    - Với Bitcoin, điều này gần như BẤT KHẢ THI về mặt kinh tế
     * 
     * ============================================================================
     * 
     * @param {number} difficulty - Số lượng số 0 ở đầu hash cần đạt được
     */
    mineBlock(difficulty) {
        // Tạo chuỗi target: ví dụ difficulty=4 => target = "0000"
        const target = Array(difficulty + 1).join("0");
        
        // Ghi nhận thời gian bắt đầu đào
        const startTime = Date.now();
        
        // Vòng lặp thử từng giá trị nonce cho đến khi tìm được hash hợp lệ
        // Đây chính là quá trình "đào coin" - liên tục thử và sai
        while (this.hash.substring(0, difficulty) !== target) {
            // Tăng nonce lên 1
            this.nonce++;
            // Tính lại hash với nonce mới
            this.hash = this.calculateHash();
        }
        
        // Tính thời gian đào
        const miningTime = (Date.now() - startTime) / 1000;
        
        // Log kết quả đào thành công
        console.log(`⛏️  Block đã được đào thành công!`);
        console.log(`   - Nonce tìm được: ${this.nonce}`);
        console.log(`   - Thời gian đào: ${miningTime} giây`);
        console.log(`   - Hash: ${this.hash}`);
    }
}

// Export class Block để sử dụng ở các module khác
module.exports = Block;
