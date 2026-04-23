/**
 * ============================================================================
 * SCRIPT.JS - Logic Frontend cho Mini Blockchain Simulation
 * ============================================================================
 * 
 * File này xử lý:
 * - Gọi API đến backend
 * - Render blocks lên giao diện
 * - Xử lý các sự kiện người dùng
 * - Hiển thị thông báo toast
 * 
 * @author Tiểu luận Blockchain - Cuối kỳ
 */

// ============================================
// CONSTANTS - Hằng số
// ============================================

// URL của API server
const API_URL = '';  // Để trống vì frontend và backend cùng server

// ============================================
// DOM ELEMENTS - Các phần tử DOM
// ============================================

// Dashboard elements
const chainStatusBadge = document.getElementById('chainStatus');
const difficultyValue = document.getElementById('difficultyValue');
const chainLengthSpan = document.getElementById('chainLength');
const pendingCountSpan = document.getElementById('pendingCount');

// Action buttons
const validateBtn = document.getElementById('validateBtn');
const resetBtn = document.getElementById('resetBtn');
const addTxBtn = document.getElementById('addTxBtn');
const mineBtn = document.getElementById('mineBtn');

// Form inputs
const txDataInput = document.getElementById('txData');

// Mempool section
const mempoolSection = document.getElementById('mempoolSection');
const mempoolList = document.getElementById('mempoolList');
const mempoolBadge = document.getElementById('mempoolBadge');

// Blockchain viewer
const blockchainViewer = document.getElementById('blockchainViewer');

// Toast elements
const toastEl = document.getElementById('toast');
const toastIcon = document.getElementById('toastIcon');
const toastTitle = document.getElementById('toastTitle');
const toastBody = document.getElementById('toastBody');

// Bootstrap Toast instance
let toast;

// Lưu trữ thông tin về block không hợp lệ
let invalidBlockIndex = null;

// ============================================
// INITIALIZATION - Khởi tạo
// ============================================

/**
 * Khởi tạo ứng dụng khi trang web được tải
 */
document.addEventListener('DOMContentLoaded', () => {
    // Khởi tạo Bootstrap Toast
    toast = new bootstrap.Toast(toastEl);

    // Tải dữ liệu ban đầu
    loadBlockchain();
    loadPendingTransactions();
    loadDifficulty();

    // Gán các event listeners
    setupEventListeners();
});

/**
 * Thiết lập các event listeners cho các nút và form
 */
const setupEventListeners = () => {
    // Nút Validate Chain
    validateBtn.addEventListener('click', validateChain);

    // Nút Reset
    resetBtn.addEventListener('click', resetBlockchain);

    // Nút Add Transaction
    addTxBtn.addEventListener('click', addTransaction);

    // Nút Mine
    mineBtn.addEventListener('click', mineBlock);

    // Cho phép nhấn Enter để thêm giao dịch
    txDataInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTransaction();
        }
    });
};

// ============================================
// API CALLS - Gọi API
// ============================================

/**
 * Tải toàn bộ blockchain từ server
 */
const loadBlockchain = async () => {
    try {
        const response = await fetch(`${API_URL}/chain`);
        const data = await response.json();

        if (data.success) {
            renderBlockchain(data.chain);
            chainLengthSpan.textContent = data.length;
        }
    } catch (error) {
        console.error('Lỗi khi tải blockchain:', error);
        showToast('error', 'Lỗi', 'Không thể kết nối đến server!');
    }
};

/**
 * Tải danh sách giao dịch đang chờ (Mempool)
 */
const loadPendingTransactions = async () => {
    try {
        const response = await fetch(`${API_URL}/pending`);
        const data = await response.json();

        if (data.success) {
            renderMempool(data.transactions);
            pendingCountSpan.textContent = data.count;
            mempoolBadge.textContent = data.count;

            // Hiển thị/ẩn mempool section
            if (data.count > 0) {
                mempoolSection.classList.remove('d-none');
            } else {
                mempoolSection.classList.add('d-none');
            }
        }
    } catch (error) {
        console.error('Lỗi khi tải mempool:', error);
    }
};

/**
 * Tải độ khó hiện tại
 */
const loadDifficulty = async () => {
    try {
        const response = await fetch(`${API_URL}/difficulty`);
        const data = await response.json();
        difficultyValue.textContent = data.difficulty;
    } catch (error) {
        console.error('Lỗi khi tải difficulty:', error);
    }
};

/**
 * Thêm giao dịch mới vào Mempool
 */
const addTransaction = async () => {
    const data = txDataInput.value.trim();

    if (!data) {
        showToast('warning', 'Cảnh báo', 'Vui lòng nhập dữ liệu giao dịch!');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/add-transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data })
        });

        const result = await response.json();

        if (result.success) {
            showToast('success', 'Thành công', result.message);
            txDataInput.value = '';
            loadPendingTransactions();
        } else {
            showToast('error', 'Lỗi', result.message);
        }
    } catch (error) {
        console.error('Lỗi khi thêm giao dịch:', error);
        showToast('error', 'Lỗi', 'Không thể thêm giao dịch!');
    }
};

/**
 * Đào block mới
 */
const mineBlock = async () => {
    // Hiển thị trạng thái đang đào
    setMiningState(true);

    try {
        const response = await fetch(`${API_URL}/mine`);
        const data = await response.json();

        if (data.success) {
            showToast('success', 'Đào thành công!',
                `Block #${data.block.index} với nonce ${data.block.nonce}`);

            // Reload blockchain và mempool
            await loadBlockchain();
            await loadPendingTransactions();

            // Validate lại chain
            await validateChain(false);  // false = không hiện toast
        }
    } catch (error) {
        console.error('Lỗi khi đào block:', error);
        showToast('error', 'Lỗi', 'Không thể đào block!');
    } finally {
        setMiningState(false);
    }
};

/**
 * Kiểm tra tính toàn vẹn của blockchain
 * @param {boolean} showNotification - Có hiển thị toast hay không
 */
const validateChain = async (showNotification = true) => {
    try {
        const response = await fetch(`${API_URL}/is-valid`);
        const data = await response.json();

        // Cập nhật trạng thái trên UI
        updateChainStatus(data.valid, data.invalidBlockIndex);

        // Lưu block không hợp lệ để đánh dấu UI
        invalidBlockIndex = data.invalidBlockIndex;

        // Render lại blockchain để cập nhật trạng thái các block
        await loadBlockchain();

        if (showNotification) {
            if (data.valid) {
                showToast('success', 'Hợp lệ', data.message);
            } else {
                showToast('error', 'Không hợp lệ', data.message);
            }
        }
    } catch (error) {
        console.error('Lỗi khi validate:', error);
        showToast('error', 'Lỗi', 'Không thể kiểm tra blockchain!');
    }
};

/**
 * Reset blockchain về trạng thái ban đầu
 */
const resetBlockchain = async () => {
    if (!confirm('Bạn có chắc muốn reset blockchain? Tất cả dữ liệu sẽ bị mất!')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/reset`, { method: 'POST' });
        const data = await response.json();

        if (data.success) {
            showToast('success', 'Đã reset', data.message);
            invalidBlockIndex = null;
            updateChainStatus(true, null);
            await loadBlockchain();
            await loadPendingTransactions();
        }
    } catch (error) {
        console.error('Lỗi khi reset:', error);
        showToast('error', 'Lỗi', 'Không thể reset blockchain!');
    }
};

/**
 * Giả lập tấn công - sửa đổi dữ liệu của một block
 * @param {number} index - Vị trí block cần sửa
 */
const tamperBlock = async (index) => {
    const newData = prompt(`Nhập dữ liệu giả mạo cho Block #${index}:`, 'HACKED: Chuyển 1000 BTC');

    if (newData === null) return;  // Người dùng nhấn Cancel

    try {
        const response = await fetch(`${API_URL}/tamper/${index}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newData })
        });

        const data = await response.json();

        if (data.success) {
            showToast('warning', 'TẤN CÔNG!', data.message);

            // Validate để phát hiện lỗi
            await validateChain();
        } else {
            showToast('error', 'Lỗi', data.message);
        }
    } catch (error) {
        console.error('Lỗi khi tamper:', error);
        showToast('error', 'Lỗi', 'Không thể sửa đổi block!');
    }
};

// ============================================
// UI RENDERING - Render giao diện
// ============================================

/**
 * Render toàn bộ blockchain lên giao diện
 * @param {Array} chain - Mảng các block
 */
const renderBlockchain = (chain) => {
    blockchainViewer.innerHTML = '';

    chain.forEach((block, idx) => {
        // Thêm block card
        const blockCard = createBlockCard(block, idx);
        blockchainViewer.appendChild(blockCard);

        // Thêm mũi tên liên kết (trừ block cuối)
        if (idx < chain.length - 1) {
            const arrow = createChainArrow(idx);
            blockchainViewer.appendChild(arrow);
        }
    });
};

/**
 * Tạo card hiển thị thông tin một block
 * @param {Object} block - Dữ liệu block
 * @param {number} idx - Vị trí trong mảng
 * @returns {HTMLElement} Block card element
 */
const createBlockCard = (block, idx) => {
    const card = document.createElement('div');
    card.className = 'block-card';

    // Đánh dấu Genesis Block
    if (block.index === 0) {
        card.classList.add('genesis');
    }

    // Đánh dấu block không hợp lệ
    if (invalidBlockIndex !== null && block.index >= invalidBlockIndex) {
        card.classList.add('invalid');
    }

    // Format timestamp
    const time = new Date(block.timestamp).toLocaleString('vi-VN');

    // Format transactions data
    let txData = '';
    if (Array.isArray(block.transactions)) {
        txData = block.transactions.map(tx =>
            typeof tx === 'object' ? (tx.data || JSON.stringify(tx)) : tx
        ).join(', ');
    } else if (typeof block.transactions === 'object') {
        txData = block.transactions.message || block.transactions.data || JSON.stringify(block.transactions);
    } else {
        txData = String(block.transactions);
    }

    card.innerHTML = `
        <!-- Block Header -->
        <div class="block-header">
            <span class="block-index">
                ${block.index === 0 ? 'Genesis' : `Block #${block.index}`}
            </span>
            <span class="block-time">${time}</span>
        </div>
        
        <!-- Block Body -->
        <div class="block-body">
            <!-- Data -->
            <div class="block-field">
                <div class="block-field-label">Data (Transactions)</div>
                <div class="block-field-value data">${escapeHtml(txData)}</div>
            </div>
            
            <!-- Previous Hash -->
            <div class="block-field">
                <div class="block-field-label">⬅️ Previous Hash</div>
                <div class="block-field-value prev-hash">
                    <span class="text-truncate-hash" title="${block.previousHash}">
                        ${truncateHash(block.previousHash)}
                    </span>
                    <button class="copy-btn" onclick="copyToClipboard('${block.previousHash}')">
                        <i class="bi bi-clipboard"></i>
                    </button>
                </div>
            </div>
            
            <!-- Current Hash -->
            <div class="block-field">
                <div class="block-field-label">🔐 Current Hash</div>
                <div class="block-field-value hash">
                    <span class="text-truncate-hash" title="${block.hash}">
                        ${truncateHash(block.hash)}
                    </span>
                    <button class="copy-btn" onclick="copyToClipboard('${block.hash}')">
                        <i class="bi bi-clipboard"></i>
                    </button>
                </div>
            </div>
            
            <!-- Nonce -->
            <div class="block-field">
                <div class="block-field-label">🎲 Nonce</div>
                <div class="block-field-value nonce">${block.nonce.toLocaleString()}</div>
            </div>
        </div>
        
        <!-- Block Actions -->
        ${block.index !== 0 ? `
        <div class="block-actions">
            <button class="btn btn-sm btn-outline-danger" onclick="tamperBlock(${block.index})">
                <i class="bi bi-bug me-1"></i>
                Tamper
            </button>
        </div>
        ` : ''}
    `;

    return card;
};

/**
 * Tạo mũi tên liên kết giữa các block
 * @param {number} idx - Vị trí block trước mũi tên
 * @returns {HTMLElement} Arrow element
 */
const createChainArrow = (idx) => {
    const arrow = document.createElement('div');
    arrow.className = 'chain-arrow';

    // Kiểm tra nếu liên kết bị đứt
    if (invalidBlockIndex !== null && idx + 1 >= invalidBlockIndex) {
        arrow.classList.add('invalid');
        arrow.classList.add('broken');
        arrow.innerHTML = '<span class="break-icon"><i class="bi bi-x-circle-fill"></i></span>';
    }

    return arrow;
};

/**
 * Render danh sách giao dịch trong Mempool
 * @param {Array} transactions - Mảng giao dịch
 */
const renderMempool = (transactions) => {
    mempoolList.innerHTML = '';

    transactions.forEach((tx, idx) => {
        const chip = document.createElement('div');
        chip.className = 'tx-chip';

        const data = tx.data || JSON.stringify(tx);
        const time = tx.timestamp ? new Date(tx.timestamp).toLocaleTimeString('vi-VN') : '';

        chip.innerHTML = `
            <i class="bi bi-clock text-warning"></i>
            <span class="tx-data" title="${escapeHtml(data)}">${escapeHtml(data)}</span>
            ${time ? `<span class="tx-time">${time}</span>` : ''}
        `;

        mempoolList.appendChild(chip);
    });
};

// ============================================
// UI HELPERS - Hàm hỗ trợ UI
// ============================================

/**
 * Cập nhật badge trạng thái blockchain
 * @param {boolean} isValid - Chain có hợp lệ không
 * @param {number|null} invalidIdx - Vị trí block không hợp lệ
 */
const updateChainStatus = (isValid, invalidIdx) => {
    if (isValid) {
        chainStatusBadge.className = 'badge bg-success fs-6 px-3 py-2';
        chainStatusBadge.innerHTML = '<i class="bi bi-shield-check me-1"></i> Chain Valid';
    } else {
        chainStatusBadge.className = 'badge bg-danger fs-6 px-3 py-2';
        chainStatusBadge.innerHTML = `<i class="bi bi-shield-x me-1"></i> Invalid at #${invalidIdx}`;
    }
};

/**
 * Cập nhật UI khi đang đào
 * @param {boolean} isMining - Đang đào hay không
 */
const setMiningState = (isMining) => {
    const miningText = mineBtn.querySelector('.mining-text');
    const miningSpinner = mineBtn.querySelector('.mining-spinner');

    if (isMining) {
        mineBtn.disabled = true;
        mineBtn.classList.add('mining');
        miningText.classList.add('d-none');
        miningSpinner.classList.remove('d-none');
    } else {
        mineBtn.disabled = false;
        mineBtn.classList.remove('mining');
        miningText.classList.remove('d-none');
        miningSpinner.classList.add('d-none');
    }
};

/**
 * Hiển thị thông báo toast
 * @param {string} type - 'success', 'error', 'warning', 'info'
 * @param {string} title - Tiêu đề
 * @param {string} message - Nội dung
 */
const showToast = (type, title, message) => {
    // Icon và màu theo loại
    const icons = {
        success: 'bi-check-circle-fill text-success',
        error: 'bi-x-circle-fill text-danger',
        warning: 'bi-exclamation-triangle-fill text-warning',
        info: 'bi-info-circle-fill text-info'
    };

    toastIcon.className = `bi ${icons[type] || icons.info} me-2`;
    toastTitle.textContent = title;
    toastBody.textContent = message;

    toast.show();
};

/**
 * Rút gọn hash để hiển thị
 * @param {string} hash - Mã hash đầy đủ
 * @returns {string} Hash rút gọn
 */
const truncateHash = (hash) => {
    if (!hash || hash.length <= 16) return hash;
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 6)}`;
};

/**
 * Escape HTML để tránh XSS
 * @param {string} text - Text cần escape
 * @returns {string} Text đã escape
 */
const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

/**
 * Copy text vào clipboard
 * @param {string} text - Text cần copy
 */
const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
        showToast('success', 'Đã copy', 'Hash đã được copy vào clipboard!');
    }).catch(err => {
        console.error('Lỗi copy:', err);
        showToast('error', 'Lỗi', 'Không thể copy!');
    });
};

// Export hàm tamperBlock để có thể gọi từ onclick
window.tamperBlock = tamperBlock;
window.copyToClipboard = copyToClipboard;
