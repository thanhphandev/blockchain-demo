/**
 * ============================================================================
 * SERVER.JS - API Server cho Mini Blockchain Simulation
 * ============================================================================
 * 
 * Server này cung cấp các API endpoints để:
 * - Xem toàn bộ blockchain (/chain)
 * - Thêm giao dịch vào Mempool (/add-transaction)
 * - Đào block mới (/mine)
 * - Kiểm tra tính toàn vẹn (/is-valid)
 * - Giả lập tấn công (/tamper/:index)
 * 
 * @author Tiểu luận Blockchain - Cuối kỳ
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const Blockchain = require('./models/Blockchain');

// ============================================
// KHỞI TẠO SERVER VÀ BLOCKCHAIN
// ============================================

const app = express();
const PORT = process.env.PORT || 3000;

// Khởi tạo Blockchain instance
// Đây là "sổ cái" chính của hệ thống
const myBlockchain = new Blockchain();

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

// Cho phép nhận JSON từ client
app.use(express.json());

// Cho phép CORS (Cross-Origin Resource Sharing)
// Cần thiết khi frontend và backend chạy trên domain/port khác nhau
app.use(cors());

// Phục vụ file tĩnh từ thư mục public
// (HTML, CSS, JavaScript của frontend)
app.use(express.static(path.join(__dirname, '../public')));

// ============================================
// API ENDPOINTS
// ============================================

/**
 * GET /chain
 * Trả về toàn bộ chuỗi Blockchain dạng JSON
 * 
 * Response:
 * {
 *   success: true,
 *   length: number,
 *   chain: Block[]
 * }
 */
app.get('/chain', (req, res) => {
    res.json({
        success: true,
        length: myBlockchain.chain.length,
        chain: myBlockchain.chain
    });
});

/**
 * GET /difficulty
 * Trả về độ khó hiện tại của việc đào coin
 * 
 * Response:
 * {
 *   difficulty: number,
 *   description: string
 * }
 */
app.get('/difficulty', (req, res) => {
    res.json({
        difficulty: myBlockchain.difficulty,
        description: `Hash phải bắt đầu bằng ${myBlockchain.difficulty} số 0`
    });
});

/**
 * POST /add-transaction
 * Thêm một giao dịch mới vào Mempool (hàng đợi chờ đào)
 * 
 * Body: { data: "Nội dung giao dịch" }
 * 
 * Response:
 * {
 *   success: true,
 *   message: string,
 *   pendingCount: number,
 *   transaction: Object
 * }
 */
app.post('/add-transaction', (req, res) => {
    const { data } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!data) {
        return res.status(400).json({
            success: false,
            message: "❌ Vui lòng cung cấp dữ liệu giao dịch (data)"
        });
    }

    // Tạo object giao dịch
    const transaction = { data };

    // Thêm vào Mempool
    myBlockchain.addTransaction(transaction);

    res.json({
        success: true,
        message: "✅ Giao dịch đã được thêm vào Mempool!",
        pendingCount: myBlockchain.pendingTransactions.length,
        transaction: myBlockchain.pendingTransactions[myBlockchain.pendingTransactions.length - 1]
    });
});

/**
 * GET /pending
 * Xem danh sách các giao dịch đang chờ trong Mempool
 * 
 * Response:
 * {
 *   success: true,
 *   count: number,
 *   transactions: Array
 * }
 */
app.get('/pending', (req, res) => {
    res.json({
        success: true,
        count: myBlockchain.pendingTransactions.length,
        transactions: myBlockchain.pendingTransactions
    });
});

/**
 * GET /mine
 * Đào block mới từ các giao dịch đang chờ trong Mempool
 * 
 * Quá trình:
 * 1. Lấy tất cả giao dịch từ Mempool
 * 2. Tạo block mới
 * 3. Thực hiện Proof of Work
 * 4. Thêm block vào chuỗi
 * 5. Xóa Mempool
 * 
 * Response:
 * {
 *   success: true,
 *   message: string,
 *   block: Block
 * }
 */
app.get('/mine', (req, res) => {
    console.log('\n📦 Yêu cầu đào block mới...');

    // Thực hiện đào block
    const newBlock = myBlockchain.minePendingTransactions();

    res.json({
        success: true,
        message: `✅ Block #${newBlock.index} đã được đào thành công!`,
        block: newBlock,
        chainLength: myBlockchain.chain.length
    });
});

/**
 * POST /mine (Alternative)
 * Đào block với dữ liệu được cung cấp trực tiếp (không qua Mempool)
 * 
 * Body: { data: "Nội dung giao dịch" }
 */
app.post('/mine', (req, res) => {
    const { data } = req.body;

    // Nếu có data, thêm vào pending trước
    if (data) {
        myBlockchain.addTransaction({ data });
    }

    console.log('\n📦 Yêu cầu đào block mới với dữ liệu trực tiếp...');

    // Thực hiện đào block
    const newBlock = myBlockchain.minePendingTransactions();

    res.json({
        success: true,
        message: `✅ Block #${newBlock.index} đã được đào thành công!`,
        block: newBlock,
        chainLength: myBlockchain.chain.length
    });
});

/**
 * GET /is-valid
 * Kiểm tra tính toàn vẹn của toàn bộ Blockchain
 * 
 * Kiểm tra 3 điều kiện:
 * 1. Hash của mỗi block khớp với dữ liệu
 * 2. previousHash khớp với hash của block trước
 * 3. Hash thỏa mãn điều kiện Proof of Work
 * 
 * Response:
 * {
 *   valid: boolean,
 *   message: string,
 *   invalidBlockIndex: number | null
 * }
 */
app.get('/is-valid', (req, res) => {
    const validation = myBlockchain.isChainValid();

    res.json({
        success: true,
        ...validation
    });
});

/**
 * POST /tamper/:index
 * Giả lập tấn công: Sửa đổi dữ liệu của một block
 * 
 * ⚠️ CHỈ DÙNG CHO MỤC ĐÍCH DEMO!
 * 
 * Params: index - Vị trí block cần sửa
 * Body: { newData: "Dữ liệu giả mạo" }
 * 
 * Response:
 * {
 *   success: boolean,
 *   message: string,
 *   tamperedBlock?: Block
 * }
 */
app.post('/tamper/:index', (req, res) => {
    const index = parseInt(req.params.index);
    const { newData } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!newData) {
        return res.status(400).json({
            success: false,
            message: "❌ Vui lòng cung cấp dữ liệu mới (newData)"
        });
    }

    // Thực hiện "tấn công"
    const result = myBlockchain.tamperBlock(index, { data: newData });

    if (result.success) {
        res.json(result);
    } else {
        res.status(400).json(result);
    }
});

/**
 * GET /info
 * Lấy thông tin tổng quan về Blockchain
 * 
 * Response:
 * {
 *   chainLength: number,
 *   difficulty: number,
 *   pendingTransactions: number,
 *   latestBlockHash: string
 * }
 */
app.get('/info', (req, res) => {
    res.json({
        success: true,
        ...myBlockchain.getChainInfo()
    });
});

/**
 * POST /reset
 * Reset blockchain về trạng thái ban đầu (chỉ có Genesis Block)
 * 
 * ⚠️ CHỈ DÙNG CHO MỤC ĐÍCH DEMO!
 */
app.post('/reset', (req, res) => {
    // Tạo blockchain mới
    myBlockchain.chain = [myBlockchain.createGenesisBlock()];
    myBlockchain.pendingTransactions = [];

    console.log('\n🔄 Blockchain đã được reset!\n');

    res.json({
        success: true,
        message: "✅ Blockchain đã được reset về trạng thái ban đầu!",
        chainLength: myBlockchain.chain.length
    });
});

// ============================================
// KHỞI ĐỘNG SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔗 MINI BLOCKCHAIN SIMULATION                          ║
║   =======================================                ║
║                                                           ║
║   Server đang chạy tại: http://localhost:${PORT}            ║
║                                                           ║
║   📚 API Endpoints:                                       ║
║   ─────────────────────────────────────────────           ║
║   GET  /chain            Xem toàn bộ blockchain           ║
║   GET  /difficulty       Xem độ khó hiện tại              ║
║   POST /add-transaction  Thêm giao dịch vào Mempool       ║
║   GET  /pending          Xem giao dịch đang chờ           ║
║   GET  /mine             Đào block mới                    ║
║   POST /mine             Đào block với data               ║
║   GET  /is-valid         Kiểm tra tính toàn vẹn           ║
║   POST /tamper/:index    Giả lập tấn công                 ║
║   POST /reset            Reset blockchain                 ║
║                                                           ║
║   🌐 Mở trình duyệt để xem giao diện Demo                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
});
