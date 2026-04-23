import {
  getChain,
  getPendingTransactions,
  getBalance,
  getDifficulty,
  validateChain,
  addTransaction,
  mineBlock,
  registerNode,
  resolveConflicts,
  tamperBlock,
  resetChain
} from './api.js';

import {
  initWallet,
  generateNewWallet,
  getPublicKey,
  getPrivateKey,
  signTransactionPayload
} from './wallet.js';

import {
  renderChain,
  renderMempool
} from './blockchain.js';

import {
  showToast,
  updateStats,
  setMiningState,
  setWalletAddress,
  setWalletBalance,
  setChainValidity,
  setMempoolBadge,
  copyToClipboard
} from './ui.js';

const state = {
  chain: [],
  pending: [],
  difficulty: 0,
  validation: { valid: true, invalidBlockIndex: null },
  mining: false
};

const els = {};

function cacheDom() {
  els.chain = document.getElementById('blockchain-container');
  els.mempool = document.getElementById('mempool-items');
  els.form = document.getElementById('transaction-form');
  els.toAddress = document.getElementById('tx-to');
  els.amount = document.getElementById('tx-amount');
  els.exportKeyBtn = document.getElementById('btn-export-key');
  els.newWalletBtn = document.getElementById('btn-new-wallet');
  els.mineBtn = document.getElementById('btn-mine');
  els.validateBtn = document.getElementById('btn-validate');
  els.resetBtn = document.getElementById('btn-reset');
  els.demoTamperBtn = document.getElementById('btn-demo-tamper');
  els.demoTamperIndex = document.getElementById('tamper-index');
  els.demoTamperData = document.getElementById('tamper-data');
  els.walletPubkeyDisplay = document.getElementById('wallet-pubkey-display');
  els.copyAddressBtn = document.getElementById('btn-copy-address');
  els.nodeForm = document.getElementById('node-form');
  els.nodeUrl = document.getElementById('node-url');
  els.consensusBtn = document.getElementById('btn-consensus');
}

async function refreshWalletBalance() {
  const address = getPublicKey();
  if (!address) return;
  const result = await getBalance(address);
  // balance: số dư đã xác nhận, pendingBalance: số dư sau khi trừ các giao dịch trong mempool
  setWalletBalance(result.balance, result.pendingBalance);
}

function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // WebSocket port = HTTP port + 1000
  const wsPort = parseInt(window.location.port) + 1000;
  const wsUrl = `${protocol}//${window.location.hostname}:${wsPort}`;
  
  console.log(`🔗 Đang kết nối tới WebSocket P2P: ${wsUrl}`);
  const socket = new WebSocket(wsUrl);

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log('📡 Nhận tin nhắn P2P:', message.type);

    switch (message.type) {
      case 'NEW_TRANSACTION':
      case 'NEW_BLOCK':
      case 'CHAIN_UPDATED':
        // Cập nhật giao diện ngay lập tức mà không cần F5
        refreshData();
        break;
    }
  };

  socket.onclose = () => {
    console.log('❌ Mất kết nối WebSocket. Đang thử lại sau 5 giây...');
    setTimeout(initWebSocket, 5000);
  };
}

async function refreshData(showValidationToast = false) {
  const [chainRes, pendingRes, difficultyRes, validRes] = await Promise.all([
    getChain(),
    getPendingTransactions(),
    getDifficulty(),
    validateChain()
  ]);

  state.chain = chainRes.chain;
  state.pending = pendingRes.transactions;
  state.difficulty = difficultyRes.difficulty;
  state.validation = validRes;

  renderChain(state.chain, state.validation);
  renderMempool(state.pending);
  setMempoolBadge(pendingRes.count);
  setChainValidity(validRes.valid, validRes.invalidBlockIndex);
  
  updateStats({
    height: chainRes.length,
    mempoolSize: pendingRes.count,
    difficulty: difficultyRes.difficulty,
    isValid: validRes.valid
  });

  await refreshWalletBalance();
  
  if (showValidationToast) {
    showToast(
      validRes.valid ? 'success' : 'error',
      validRes.valid ? 'Toàn Vẹn Chuỗi Đã Được Xác Minh' : 'Phát Hiện Vi Phạm Bảo Mật',
      validRes.message
    );
  }
}

function bindEvents() {
  els.form.addEventListener('submit', handleCreateTransaction);

  els.newWalletBtn.addEventListener('click', async () => {
    generateNewWallet();
    setWalletAddress(getPublicKey());
    await refreshWalletBalance();
    showToast('success', 'Ví Đã Được Tạo', 'Một cặp khóa mật mã mới đã được khởi tạo thành công.');
  });

  els.exportKeyBtn.addEventListener('click', () => {
    const key = getPrivateKey();
    if (!key) return;
    copyToClipboard(key, 'Khóa Bí Mật');
  });

  els.copyAddressBtn.addEventListener('click', () => {
    const address = getPublicKey();
    if (!address) return;
    copyToClipboard(address, 'Địa Chỉ Công Khai');
  });

  els.mineBtn.addEventListener('click', handleMine);

  els.validateBtn.addEventListener('click', async () => {
    try {
      await refreshData(true);
    } catch (error) {
      showToast('error', 'Lỗi Xác Minh', error.message);
    }
  });

  els.nodeForm.addEventListener('submit', handleRegisterNode);
  els.consensusBtn.addEventListener('click', handleConsensus);
  els.resetBtn.addEventListener('click', handleReset);
  els.demoTamperBtn.addEventListener('click', handleTamper);

  // Quick tamper from block cards
  els.chain.addEventListener('click', async (event) => {
    const btn = event.target.closest('.btn-tamper');
    if (!btn) return;
    
    const index = Number(btn.dataset.index);
    if (index === 0) {
      showToast('warning', 'Khối Genesis Được Bảo Vệ', 'Khối Genesis không thể bị tấn công trong bản demo này.');
      return;
    }

    try {
      await tamperBlock(index, 'QUICK TAMPER (MANUAL CORRUPTION)');
      await refreshData(true);
      showToast('warning', 'Vi Phạm Tính Toàn Vẹn Dữ Liệu', `Bạn đã sửa đổi Khối #${index}. Liên kết chuỗi bị phá vỡ.`);
    } catch (error) {
      showToast('error', 'Tấn Công Thất Bại', error.message);
    }
  });
}

async function handleCreateTransaction(event) {
  event.preventDefault();

  try {
    const toAddress = els.toAddress.value.trim();
    const amount = Number(els.amount.value);
    const payload = signTransactionPayload(toAddress, amount);
    const result = await addTransaction(payload);

    els.form.reset();
    await refreshData();
    showToast('success', 'Giao Dịch Đã Được Ký', 'Đã được phát sóng vào Mempool của mạng lưới.');
  } catch (error) {
    showToast('error', 'Từ Chối Chữ Ký', error.message);
  }
}

async function handleMine() {
  if (state.mining) return;

  try {
    state.mining = true;
    setMiningState(true);
    const result = await mineBlock(getPublicKey());
    await refreshData();
    showToast('success', 'Đã Đào Thành Công', result.message);
  } catch (error) {
    showToast('error', 'Quá Trình Đào Bị Dừng', error.message);
  } finally {
    state.mining = false;
    setMiningState(false);
  }
}

async function handleReset() {
  const confirmed = window.confirm('Bạn có chắc chắn muốn reset toàn bộ blockchain về trạng thái Genesis? Mọi dữ liệu sẽ bị xóa sạch.');
  if (!confirmed) return;

  try {
    const result = await resetChain();
    await refreshData();
    showToast('success', 'Đã Khôi Phục Cài Đặt Gốc', 'Sổ cái blockchain đã được xóa sạch.');
  } catch (error) {
    showToast('error', 'Reset Thất Bại', error.message);
  }
}

async function handleTamper() {
  const index = Number(els.demoTamperIndex.value);
  const data = els.demoTamperData.value.trim() || 'MALICIOUS DATA';

  if (!index || index < 1) {
    showToast('warning', 'Yêu Cầu Chỉ Số Khối', 'Vui lòng chỉ định chỉ số khối (1+) để tấn công.');
    return;
  }

  try {
    await tamperBlock(index, data);
    await refreshData(true);
    showToast('warning', 'Vi Phạm Tính Toàn Vẹn Dữ Liệu', `Đã sửa đổi khối #${index}. Liên kết chuỗi bị phá vỡ.`);
  } catch (error) {
    showToast('error', 'Tấn Công Thất Bại', error.message);
  }
}

async function handleRegisterNode(event) {
  event.preventDefault();
  const nodeUrl = els.nodeUrl.value.trim();
  try {
    const result = await registerNode(nodeUrl);
    els.nodeForm.reset();
    showToast('success', 'Đã Đăng Ký Nút Mạng', `Đã kết nối với nút: ${nodeUrl}`);
  } catch (error) {
    showToast('error', 'Lỗi Kết Nối', error.message);
  }
}

async function handleConsensus() {
  try {
    showToast('info', 'Đang Đồng Bộ', 'Đang thực hiện cơ chế đồng thuận với các nút mạng...');
    const result = await resolveConflicts();
    await refreshData();
    const isReplaced = result.message.includes('replaced');
    showToast(isReplaced ? 'warning' : 'success', 'Kết Quả Đồng Thuận', result.message);
  } catch (error) {
    showToast('error', 'Đồng Thuận Thất Bại', error.message);
  }
}

async function bootstrap() {
  cacheDom();
  initWallet();
  setWalletAddress(getPublicKey());
  bindEvents();
  initWebSocket(); // Khởi tạo P2P Real-time

  try {
    await refreshData();
    showToast('success', 'Hệ Thống Sẵn Sàng', 'Trình khám phá Blockchain đã khởi tạo thành công.');
  } catch (error) {
    showToast('error', 'Ngoại Tuyến', 'Không thể kết nối đến máy chủ blockchain.');
  }
}

document.addEventListener('DOMContentLoaded', bootstrap);
