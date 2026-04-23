/**
 * ============================================================================
 * BLOCKCHAIN.JS - Lớp Blockchain quản lý toàn bộ chuỗi khối
 * ============================================================================
 * 
 * Blockchain là một "sổ cái phân tán" gồm nhiều Block liên kết với nhau.
 * Lớp này quản lý:
 * - Chuỗi các block (chain)
 * - Hàng đợi giao dịch chờ xử lý (pendingTransactions - Mempool)
 * - Độ khó đào coin (difficulty)
 * 
 * @author Tiểu luận Blockchain - Cuối kỳ
 */

const Block = require('./Block');
const Transaction = require('./Transaction');

/**
 * Class Blockchain - Quản lý toàn bộ chuỗi khối
 */
class Blockchain {
    /**
     * Constructor - Khởi tạo Blockchain mới
     * 
     * Khi tạo mới, blockchain tự động có:
     * - Genesis Block (block đầu tiên, index = 0)
     * - Mảng pendingTransactions rỗng (Mempool)
     * - Độ khó mặc định = 4 (hash phải bắt đầu bằng "0000")
     */
    constructor() {
        this.chain = [this.createGenesisBlock()];  // Chuỗi block, bắt đầu với Genesis
        this.difficulty = 4;                        // Độ khó đào coin
        this.pendingTransactions = [];              // Mempool - hàng đợi giao dịch
    }

    /**
     * createGenesisBlock() - Tạo block khởi nguyên (Block đầu tiên)
     * 
     * Genesis Block là block đặc biệt:
     * - Index = 0
     * - previousHash = "0" (không có block trước)
     * - Dữ liệu thường là thông điệp đặc biệt
     * 
     * VÍ DỤ THỰC TẾ: Genesis Block của Bitcoin chứa dòng chữ:
     * "The Times 03/Jan/2009 Chancellor on brink of second bailout for banks"
     * 
     * @returns {Block} Genesis Block
     */
    createGenesisBlock() {
        return new Block(
            0,                                          // Index = 0
            new Date().toISOString(),                   // Thời gian hiện tại
            [],                                         // Giao dịch rỗng cho Genesis Block
            "0"                                         // Không có previousHash
        );
    }

    /**
     * getLatestBlock() - Lấy block mới nhất trong chuỗi
     * 
     * Block mới nhất luôn nằm ở cuối mảng chain.
     * Khi thêm block mới, ta cần hash của block này làm previousHash.
     * 
     * @returns {Block} Block cuối cùng trong chuỗi
     */
    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    /**
     * addTransaction() - Thêm giao dịch vào Mempool (hàng đợi)
     * 
     * @param {Object} transaction - Dữ liệu giao dịch
     */
    addTransaction(transaction) {
        if (!transaction.fromAddress || !transaction.toAddress) {
            throw new Error('❌ Giao dịch phải có địa chỉ người gửi và người nhận!');
        }

        // 1. Kiểm tra chữ ký
        if (!transaction.isValid()) {
            throw new Error('❌ Chữ ký giao dịch không hợp lệ!');
        }

        // 2. Kiểm tra trùng lặp trong Mempool (Hàng đợi)
        const isDuplicateMempool = this.pendingTransactions.some(tx => 
            tx.calculateHash && tx.calculateHash() === transaction.calculateHash()
        );
        if (isDuplicateMempool) {
            console.log('⚠️ Giao dịch đã tồn tại trong Mempool, bỏ qua.');
            return false;
        }

        // 3. Kiểm tra xem giao dịch đã tồn tại trong Blockchain chưa (Tránh Replay Attack)
        for (const block of this.chain) {
            const isAlreadyOnChain = block.transactions.some(tx => 
                tx.calculateHash && tx.calculateHash() === transaction.calculateHash()
            );
            if (isAlreadyOnChain) {
                throw new Error('❌ Giao dịch này đã được xác nhận trong một khối trước đó!');
            }
        }

        if (transaction.amount <= 0) {
            throw new Error('❌ Số lượng chuyển phải lớn hơn 0!');
        }

        // 2. KIỂM TRA SỐ DƯ (Ngăn chặn Double Spending)
        // Số dư khả dụng thực tế = Số dư trên chuỗi - Tổng tiền đang đợi trong Mempool
        const balanceOnChain = this.getBalanceOfAddress(transaction.fromAddress);
        const pendingAmount = this.pendingTransactions
            .filter(tx => tx.fromAddress === transaction.fromAddress)
            .reduce((sum, tx) => sum + Number(tx.amount), 0);

        const availableBalance = balanceOnChain - pendingAmount;

        // Kiểm tra lỗi Double Spending hoặc số dư không đủ
        if (availableBalance < transaction.amount) {
            throw new Error(`❌ Lỗi: Double Spending! Số dư khả dụng không đủ (Ví có: ${balanceOnChain} MBC, Đang đợi trong Mempool: ${pendingAmount} MBC, Yêu cầu thêm: ${transaction.amount} MBC)`);
        }

        this.pendingTransactions.push(transaction);
        console.log(`📝 Giao dịch hợp lệ đã được thêm vào Mempool. Tổng: ${this.pendingTransactions.length} đang chờ.`);
        return true; // Trả về true để thông báo thành công
    }

    /**
     * minePendingTransactions() - Đào block mới từ các giao dịch đang chờ
     * 
     * Quy trình:
     * 1. Lấy tất cả giao dịch từ Mempool
     * 2. Tạo block mới chứa các giao dịch này
     * 3. Đào block (Proof of Work)
     * 4. Thêm block vào chuỗi
     * 5. Xóa Mempool
     * 
     * @returns {Block} Block vừa được đào
     */
    minePendingTransactions(miningRewardAddress) {
        // Tạo giao dịch phần thưởng cho thợ đào
        const rewardTx = new Transaction(null, miningRewardAddress, 12.5);
        this.pendingTransactions.push(rewardTx);

        // Tạo block mới chứa tất cả giao dịch đang chờ
        const block = new Block(
            this.chain.length,
            new Date().toISOString(),
            this.pendingTransactions,
            this.getLatestBlock().hash
        );

        console.log(`\n🔨 Bắt đầu đào Block #${block.index}...`);
        console.log(`   Số giao dịch: ${this.pendingTransactions.length}`);

        // Đào block với độ khó hiện tại
        block.mineBlock(this.difficulty);

        // Thêm block vào chuỗi
        this.chain.push(block);
        console.log(`✅ Block #${block.index} đã được thêm vào chuỗi!\n`);

        // Xóa Mempool sau khi đào xong
        this.pendingTransactions = [];

        return block;
    }

    /**
     * addBlock() - Thêm một block mới trực tiếp (không qua Mempool)
     * 
     * Hàm này dùng để thêm block với dữ liệu cụ thể ngay lập tức.
     * Trong thực tế ít dùng, nhưng hữu ích cho demo.
     * 
     * @param {Object} data - Dữ liệu cho block mới
     * @returns {Block} Block vừa được thêm
     */
    addBlock(data) {
        const block = new Block(
            this.chain.length,
            new Date().toISOString(),
            data,
            this.getLatestBlock().hash
        );

        console.log(`\n🔨 Bắt đầu đào Block #${block.index}...`);
        block.mineBlock(this.difficulty);
        this.chain.push(block);
        console.log(`✅ Block #${block.index} đã được thêm vào chuỗi!\n`);

        return block;
    }

    /**
     * isChainValid() - Kiểm tra tính toàn vẹn của toàn bộ chuỗi
     * 
     * Hàm này duyệt qua từng block và kiểm tra 3 ĐIỀU KIỆN QUAN TRỌNG:
     * 
     * 1. HASH HỢP LỆ: Hash của block phải khớp với dữ liệu bên trong
     *    → Nếu ai đó sửa dữ liệu, hash sẽ thay đổi và bị phát hiện
     * 
     * 2. LIÊN KẾT NGUYÊN VẸN: previousHash phải khớp với hash của block trước
     *    → Đảm bảo chuỗi không bị đứt đoạn hoặc chèn block giả
     * 
     * 3. PROOF OF WORK HỢP LỆ: Hash phải thỏa mãn độ khó (bắt đầu bằng số 0)
     *    → Ngăn chặn việc tạo block giả mà không thực hiện đào
     * 
     * @returns {Object} { valid: boolean, message: string, invalidBlockIndex: number|null }
     */
    isChainValid(chainToValidate = this.chain) {
        // Tạo chuỗi target để kiểm tra PoW
        const target = Array(this.difficulty + 1).join("0");

        // Duyệt từ block thứ 1 (bỏ qua Genesis Block)
        for (let i = 1; i < chainToValidate.length; i++) {
            let currentBlock = chainToValidate[i];
            const previousBlock = chainToValidate[i - 1];

            // console.log(`🔍 Đang kiểm tra Block #${i}...`);

            // Đảm bảo block là một instance của lớp Block để có các phương thức cần thiết
            if (typeof currentBlock.calculateHash !== 'function') {
                currentBlock = new Block(
                    currentBlock.index,
                    currentBlock.timestamp,
                    currentBlock.transactions,
                    currentBlock.previousHash,
                    currentBlock.nonce,
                    currentBlock.hash
                );
            }

            // ========================================
            // KIỂM TRA 1: Hash có khớp với dữ liệu không?
            // ========================================
            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return {
                    valid: false,
                    message: `❌ Block #${i} bị sửa đổi! Hash không khớp với dữ liệu.`,
                    invalidBlockIndex: i
                };
            }

            // ========================================
            // KIỂM TRA 2: Liên kết với block trước có nguyên vẹn?
            // ========================================
            if (currentBlock.previousHash !== previousBlock.hash) {
                return {
                    valid: false,
                    message: `❌ Block #${i} mất liên kết! previousHash không khớp với Block #${i - 1}.`,
                    invalidBlockIndex: i
                };
            }

            // ========================================
            // KIỂM TRA 3: Hash có thỏa mãn Proof of Work không?
            // ========================================
            // Hash phải bắt đầu bằng số lượng số 0 tương ứng difficulty
            // Điều này ngăn chặn việc tạo block giả mà không đào thực sự
            if (currentBlock.hash.substring(0, this.difficulty) !== target) {
                return {
                    valid: false,
                    message: `❌ Block #${i} có hash không hợp lệ! Không đủ độ khó PoW.`,
                    invalidBlockIndex: i
                };
            }
        }

        // Tất cả block đều hợp lệ
        return {
            valid: true,
            message: "✅ Blockchain hoàn toàn hợp lệ! Tất cả các block đều nguyên vẹn.",
            invalidBlockIndex: null
        };
    }

    /**
     * replaceChain() - Thay thế chuỗi hiện tại bằng chuỗi mới (Đồng bộ P2P)
     * 
     * @param {Array} newChain - Chuỗi mới nhận được từ mạng
     * @returns {boolean} Kết quả thay thế
     */
    replaceChain(newChain) {
        if (newChain.length <= this.chain.length) {
            // Im lặng hoặc log nhẹ nếu chuỗi ngắn hơn
            return false;
        }

        console.log(`⛓️  Đang kiểm tra chuỗi mới (Độ dài: ${newChain.length})...`);
        const validation = this.isChainValid(newChain);
        if (!validation.valid) {
            console.log(`❌ Chuỗi mới không hợp lệ: ${validation.message}`);
            return false;
        }

        // Hydrate: Chuyển đổi POJO sang class instances
        this.chain = newChain.map(b => {
            if (typeof b.calculateHash === 'function') return b;
            return new Block(b.index, b.timestamp, b.transactions, b.previousHash, b.nonce, b.hash);
        });

        this.pendingTransactions = [];
        console.log(`✅ Chấp nhận chuỗi mới. Độ dài hiện tại: ${this.chain.length}`);
        return true;
    }

    /**
     * tamperBlock() - Giả lập tấn công: Sửa đổi dữ liệu của một block
     * 
     * ⚠️ CẢNH BÁO: Hàm này CHỈ dùng cho mục đích DEMO!
     * 
     * Khi gọi hàm này:
     * - Dữ liệu của block sẽ bị thay đổi
     * - Hash KHÔNG được tính lại (để mô phỏng tấn công)
     * - Khi gọi isChainValid(), chuỗi sẽ bị phát hiện là không hợp lệ
     * 
     * Điều này giúp demo rằng Blockchain có khả năng phát hiện dữ liệu bị sửa đổi.
     * 
     * @param {number} index - Vị trí block cần sửa
     * @param {Object} newData - Dữ liệu mới (giả mạo)
     * @returns {Object} Kết quả thao tác
     */
    tamperBlock(index, newData) {
        // Kiểm tra index hợp lệ
        if (index < 0 || index >= this.chain.length) {
            return {
                success: false,
                message: `❌ Không tìm thấy Block #${index}`
            };
        }

        // Không cho phép sửa Genesis Block
        if (index === 0) {
            return {
                success: false,
                message: "❌ Không thể sửa Genesis Block!"
            };
        }

        // LƯU hash cũ để so sánh
        const oldHash = this.chain[index].hash;
        const oldData = JSON.stringify(this.chain[index].transactions);

        // SỬA ĐỔI dữ liệu (mô phỏng tấn công)
        // Chúng ta đưa dữ liệu giả mạo vào một transaction mới để giữ cấu trúc mảng []
        this.chain[index].transactions = [{
            fromAddress: "Hacker",
            toAddress: "Malicious",
            amount: 999999,
            data: newData, // Lưu chuỗi giả mạo vào trường data
            timestamp: Date.now()
        }];

        // KHÔNG tính lại hash - đây là điểm mấu chốt của demo
        // Trong thực tế, hacker sẽ cố gắng sửa dữ liệu mà không đào lại

        console.log(`\n🔓 TAMPER ATTACK trên Block #${index}:`);
        console.log(`   Dữ liệu cũ: ${oldData}`);
        console.log(`   Dữ liệu mới: ${JSON.stringify(newData)}`);
        console.log(`   Hash (giữ nguyên): ${this.chain[index].hash}`);
        console.log(`\n⚠️  Block đã bị sửa đổi! Gọi /is-valid để kiểm tra.\n`);

        return {
            success: true,
            message: `🔓 Block #${index} đã bị sửa đổi thành công!`,
            tamperedBlock: this.chain[index]
        };
    }

    /**
     * getBalanceOfAddress() - Tính số dư của một địa chỉ ví
     * 
     * Duyệt qua toàn bộ chuỗi khối để tính toán số dư.
     * Số dư = (Tổng nhận) - (Tổng gửi)
     * 
     * @param {string} address - Địa chỉ ví cần kiểm tra
     * @returns {number} Số dư
     */
    getBalanceOfAddress(address) {
        let balance = 0;

        for (const block of this.chain) {
            // Đảm bảo block.transactions là mảng trước khi lặp
            if (Array.isArray(block.transactions)) {
                for (const trans of block.transactions) {
                    if (trans.fromAddress === address) {
                        balance -= Number(trans.amount);
                    }

                    if (trans.toAddress === address) {
                        balance += Number(trans.amount);
                    }
                }
            }
        }

        return balance;
    }

    /**
     * getChainInfo() - Lấy thông tin tổng quan về blockchain
     * 
     * @returns {Object} Thông tin tổng quan
     */
    getChainInfo() {
        return {
            chainLength: this.chain.length,
            difficulty: this.difficulty,
            pendingTransactions: this.pendingTransactions.length,
            latestBlockHash: this.getLatestBlock().hash.substring(0, 20) + '...'
        };
    }
}

// Export class Blockchain
module.exports = Blockchain;
