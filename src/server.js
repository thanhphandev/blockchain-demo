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
const axios = require('axios');
const Blockchain = require('./models/Blockchain');
const Transaction = require('./models/Transaction');

// ============================================
// KHỞI TẠO SERVER VÀ BLOCKCHAIN
// ============================================

const app = express();
const PORT = process.env.PORT || 3000;

// Khởi tạo Blockchain instance
const myBlockchain = new Blockchain();

// Danh sách các node trong mạng P2P
const networkNodes = [];

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
app.post('/add-transaction', async (req, res) => {
    const { fromAddress, toAddress, amount, signature, timestamp } = req.body;

    try {
        const tx = new Transaction(fromAddress, toAddress, amount, timestamp);
        tx.signature = signature;

        myBlockchain.addTransaction(tx);

        // LAN TỎA (BROADCAST) Giao dịch tới các node khác trong mạng
        networkNodes.forEach(async (node) => {
            try {
                await axios.post(`${node}/receive-transaction`, req.body);
            } catch (err) {
                console.error(`❌ Không thể lan tỏa giao dịch tới ${node}`);
            }
        });

        res.json({
            success: true,
            message: "✅ Giao dịch đã được thêm vào Mempool và lan tỏa tới mạng lưới!",
            pendingCount: myBlockchain.pendingTransactions.length
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * POST /receive-transaction
 * Nhận giao dịch được lan tỏa từ các node khác (không re-broadcast để tránh lặp vô tận)
 */
app.post('/receive-transaction', (req, res) => {
    const { fromAddress, toAddress, amount, signature, timestamp } = req.body;
    try {
        const tx = new Transaction(fromAddress, toAddress, amount, timestamp);
        tx.signature = signature;
        
        // Thêm trực tiếp vào Mempool (Skip broadcast)
        myBlockchain.addTransaction(tx);
        
        res.json({ success: true, message: "📥 Đã nhận giao dịch lan tỏa." });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
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
app.get('/mine', async (req, res) => {
    const { minerAddress } = req.query;

    if (!minerAddress) {
        return res.status(400).json({
            success: false,
            message: "❌ Vui lòng cung cấp địa chỉ ví thợ đào (minerAddress)"
        });
    }

    console.log('\n📦 Yêu cầu đào block mới...');

    // Thực hiện đào block
    const newBlock = myBlockchain.minePendingTransactions(minerAddress);

    // THÔNG BÁO CHO MẠNG LƯỚI đồng bộ hóa
    networkNodes.forEach(async (node) => {
        try {
            await axios.get(`${node}/resolve-conflicts`);
        } catch (err) {
            console.log(`Node ${node} không phản hồi thông báo đào block.`);
        }
    });

    res.json({
        success: true,
        message: `✅ Block #${newBlock.index} đã được đào thành công và thông báo tới mạng lưới!`,
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
app.post('/mine', async (req, res) => {
    const { minerAddress } = req.body;

    if (!minerAddress) {
        return res.status(400).json({
            success: false,
            message: "❌ Vui lòng cung cấp địa chỉ ví thợ đào (minerAddress)"
        });
    }

    console.log('\n📦 Yêu cầu đào block mới...');

    // Thực hiện đào block
    const newBlock = myBlockchain.minePendingTransactions(minerAddress);

    // THÔNG BÁO CHO MẠNG LƯỚI đồng bộ hóa
    networkNodes.forEach(async (node) => {
        try {
            await axios.get(`${node}/resolve-conflicts`);
        } catch (err) {
            console.log(`Node ${node} không phản hồi thông báo đào block.`);
        }
    });

    res.json({
        success: true,
        message: `✅ Block #${newBlock.index} đã được đào thành công và thông báo tới mạng lưới!`,
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

    if (!newData) {
        return res.status(400).json({
            success: false,
            message: "❌ Vui lòng cung cấp dữ liệu mới (newData)"
        });
    }

    // Thực hiện "tấn công" bằng cách sửa giao dịch đầu tiên (nếu có) hoặc thay thế toàn bộ
    const result = myBlockchain.tamperBlock(index, newData);

    if (result.success) {
        res.json(result);
    } else {
        res.status(400).json(result);
    }
});

/**
 * POST /register-node
 * Đăng ký một node mới vào mạng P2P
 */
app.post('/register-node', (req, res) => {
    const { nodeUrl } = req.body;
    const currentNodeUrl = `http://localhost:${PORT}`;

    if (nodeUrl && !networkNodes.includes(nodeUrl) && nodeUrl !== currentNodeUrl) {
        networkNodes.push(nodeUrl);
        res.json({
            success: true,
            message: `✅ Đã đăng ký node: ${nodeUrl}`,
            nodes: networkNodes
        });
    } else {
        res.status(400).json({
            success: false,
            message: "❌ Node không hợp lệ hoặc đã tồn tại"
        });
    }
});

/**
 * GET /resolve-conflicts
 * Cơ chế đồng thuận: Tìm chuỗi dài nhất và hợp lệ nhất trong mạng
 */
app.get('/resolve-conflicts', async (req, res) => {
    let longestChain = null;
    let maxLength = myBlockchain.chain.length;

    try {
        const promises = networkNodes.map(node => axios.get(`${node}/chain`));
        const responses = await Promise.all(promises);

        for (const response of responses) {
            const remoteChain = response.data.chain;
            const remoteLength = response.data.length;

            if (remoteLength > maxLength) {
                // Giả lập instance blockchain để kiểm tra remoteChain
                const tempBlockchain = new Blockchain();
                tempBlockchain.chain = remoteChain;

                if (tempBlockchain.isChainValid().valid) {
                    maxLength = remoteLength;
                    longestChain = remoteChain;
                }
            }
        }

        if (longestChain) {
            myBlockchain.chain = longestChain;
            myBlockchain.pendingTransactions = [];
            return res.json({
                success: true,
                message: "✅ Đã cập nhật chuỗi mới dài hơn từ mạng!",
                newLength: myBlockchain.chain.length
            });
        }

        res.json({
            success: true,
            message: "✅ Chuỗi hiện tại đã là dài nhất và hợp lệ.",
            length: myBlockchain.chain.length
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "❌ Lỗi khi thực hiện đồng thuận: " + error.message
        });
    }
});

app.get('/balance/:address', (req, res) => {
    const address = req.params.address;
    const balance = myBlockchain.getBalanceOfAddress(address);

    res.json({
        success: true,
        address: address,
        balance: balance
    });
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
