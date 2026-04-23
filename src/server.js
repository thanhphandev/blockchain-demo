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
const WebSocket = require('ws');
const Blockchain = require('./models/Blockchain');
const Transaction = require('./models/Transaction');

// ============================================
// KHỞI TẠO SERVER VÀ BLOCKCHAIN
// ============================================

const app = express();
const PORT = process.env.PORT || 3000;
const WS_PORT = parseInt(PORT) + 1000;

// Khởi tạo Blockchain instance
const myBlockchain = new Blockchain();

// Danh sách các node trong mạng P2P và các kết nối socket
const networkNodes = []; 
const sockets = [];

/**
 * QUẢN LÝ WEBSOCKET P2P
 */
const initP2PServer = () => {
    const server = new WebSocket.Server({ port: WS_PORT });
    server.on('connection', (ws) => {
        console.log(`📡 Kết nối P2P mới được thiết lập (Cổng ${WS_PORT}).`);
        initConnection(ws);
    });
    console.log(`📡 P2P WebSocket Server đang chạy tại cổng: ${WS_PORT}`);
};

const initConnection = (ws) => {
    sockets.push(ws);
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            handleMessage(ws, message);
        } catch (e) {}
    });
    ws.on('close', () => sockets.splice(sockets.indexOf(ws), 1));
    ws.on('error', () => sockets.splice(sockets.indexOf(ws), 1));
    
    // Gửi yêu cầu đồng bộ ngay khi kết nối
    write(ws, { type: 'REQUEST_CHAIN' });
};

const handleMessage = (ws, message) => {
    switch (message.type) {
        case 'NEW_TRANSACTION':
            try {
                const tx = message.data;
                const newTx = new Transaction(tx.fromAddress, tx.toAddress, tx.amount, tx.data, tx.timestamp, tx.signature);
                if (myBlockchain.addTransaction(newTx)) {
                    console.log('📩 Nhận giao dịch mới qua P2P.');
                }
            } catch (err) {}
            break;
        case 'NEW_BLOCK':
            console.log('📦 Nhận thông báo có Block mới! Đang đồng bộ...');
            resolveConflictsInternal();
            break;
        case 'REQUEST_CHAIN':
            write(ws, { type: 'RESPONSE_CHAIN', data: myBlockchain.chain });
            break;
        case 'RESPONSE_CHAIN':
            handleChainResponse(message.data);
            break;
    }
};

const broadcast = (message) => sockets.forEach(socket => write(socket, message));
const write = (ws, message) => ws.send(JSON.stringify(message));

const connectToNodes = (newNodes) => {
    newNodes.forEach(nodeUrl => {
        try {
            const url = new URL(nodeUrl);
            const wsUrl = `ws://${url.hostname}:${parseInt(url.port) + 1000}`;
            if (parseInt(url.port) === PORT) return;
            const ws = new WebSocket(wsUrl);
            ws.on('open', () => initConnection(ws));
            ws.on('error', () => {});
        } catch (err) {}
    });
};

const handleChainResponse = (receivedChain) => {
    if (receivedChain.length > myBlockchain.chain.length && myBlockchain.isChainValid(receivedChain).valid) {
        myBlockchain.chain = receivedChain;
        myBlockchain.pendingTransactions = [];
        broadcast({ type: 'CHAIN_UPDATED', data: myBlockchain.chain });
        console.log('✅ Chuỗi đã được cập nhật từ node khác.');
    }
};

const resolveConflictsInternal = async () => {
    let maxLength = myBlockchain.chain.length;
    let longestChain = null;
    for (const node of networkNodes) {
        try {
            const response = await axios.get(`${node}/chain`);
            const remoteChain = response.data.chain;
            if (remoteChain.length > maxLength && myBlockchain.isChainValid(remoteChain).valid) {
                maxLength = remoteChain.length;
                longestChain = remoteChain;
            }
        } catch (err) {}
    }
    if (longestChain) {
        myBlockchain.chain = longestChain;
        myBlockchain.pendingTransactions = [];
        broadcast({ type: 'CHAIN_UPDATED', data: myBlockchain.chain });
    }
};
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

        // LAN TỎA (BROADCAST) QUA WEBSOCKET P2P
        broadcast({
            type: 'NEW_TRANSACTION',
            data: tx
        });

        res.json({
            success: true,
            message: "✅ Giao dịch đã được thêm vào Mempool và lan tỏa toàn mạng (P2P)!",
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

    // THÔNG BÁO CHO MẠNG LƯỚI QUA WEBSOCKET (P2P)
    broadcast({
        type: 'NEW_BLOCK',
        data: newBlock
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

    // THÔNG BÁO CHO MẠNG LƯỚI QUA WEBSOCKET (P2P)
    broadcast({
        type: 'NEW_BLOCK',
        data: newBlock
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
        
        // Kết nối P2P WebSocket
        connectToNodes([nodeUrl]);

        res.json({
            success: true,
            message: `✅ Đã đăng ký node HTTP và kết nối P2P WebSocket: ${nodeUrl}`,
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
    const confirmedBalance = myBlockchain.getBalanceOfAddress(address);
    
    // Tính số dư đang chờ (tổng số tiền gửi đi trong Mempool)
    const pendingAmount = myBlockchain.pendingTransactions
        .filter(tx => tx.fromAddress === address)
        .reduce((sum, tx) => sum + tx.amount, 0);

    res.json({
        success: true,
        address: address,
        balance: confirmedBalance,
        pendingBalance: confirmedBalance - pendingAmount,
        inMempool: pendingAmount
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
    // Khởi tạo P2P WebSocket Server
    initP2PServer();

    // Tự động kết nối tới các node mặc định trong mạng lưới (localhost:3000, 3001, 3002)
    const defaultNodes = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
    console.log('🔄 Đang tự động kết nối tới các nút mạng lân cận...');
    connectToNodes(defaultNodes);

    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔗 MINI BLOCKCHAIN SIMULATION (P2P MODE)               ║
║   =======================================                ║
║                                                           ║
║   HTTP Server: http://localhost:${PORT}                     ║
║   P2P WebSocket: ws://localhost:${WS_PORT}                  ║
║                                                           ║
║   📚 API Endpoints:                                       ║
║   ─────────────────────────────────────────────           ║
║   GET  /chain            Xem toàn bộ blockchain           ║
║   GET  /difficulty       Xem độ khó hiện tại              ║
║   POST /add-transaction  Thêm giao dịch (P2P)             ║
║   GET  /pending          Xem giao dịch đang chờ           ║
║   GET  /mine             Đào block mới                    ║
║   GET  /is-valid         Kiểm tra tính toàn vẹn           ║
║                                                           ║
║   🌐 Trạng thái: Mạng lưới WebSockets đang hoạt động      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
});
