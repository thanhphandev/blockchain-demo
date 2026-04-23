const TOAST_DURATION = 4000;

/* =========================================================
   TOAST NOTIFICATIONS
   ========================================================= */
let toastContainer = null;

function getToastContainer() {
    if (!toastContainer) {
        toastContainer = document.getElementById('toast-container');
    }
    return toastContainer;
}

/**
 * Show a toast notification
 * @param {'success'|'error'|'warning'|'info'} type
 * @param {string} title
 * @param {string} message
 */
export function showToast(type, title, message) {
    const container = getToastContainer();
    const icons = {
        success: 'check-circle',
        error:   'alert-circle',
        warning: 'alert-triangle',
        info:    'info'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon" style="color: var(--accent-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'})">
            <i data-lucide="${icons[type] || 'info'}" style="width: 20px;"></i>
        </div>
        <div class="toast-content" style="flex: 1;">
            <div class="toast-title" style="font-weight: 700; font-size: 0.9rem;">${title}</div>
            <div class="toast-msg" style="font-size: 0.8rem; color: var(--text-secondary);">${message}</div>
        </div>
        <button class="toast-close" style="background: none; border: none; cursor: pointer; color: var(--text-muted);" onclick="this.closest('.toast').remove()">
            <i data-lucide="x" style="width: 14px;"></i>
        </button>
    `;

    container.appendChild(toast);
    
    // Initialize icons in toast
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Trigger animation
    requestAnimationFrame(() => toast.classList.add('show'));

    // Auto-remove
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove(), { once: true });
        }
    }, TOAST_DURATION);
}

/* =========================================================
   STATS BAR
   ========================================================= */

/**
 * Update the top stats bar
 */
export function updateStats({ height, mempoolSize, difficulty, isValid }) {
    const el = (id) => document.getElementById(id);
    if (el('stat-height'))     el('stat-height').textContent = height ?? '—';
    if (el('stat-mempool'))    el('stat-mempool').textContent = mempoolSize ?? '—';
    if (el('stat-difficulty')) el('stat-difficulty').textContent = difficulty ?? '—';

    const badge = el('stat-validity');
    if (badge) {
        badge.innerHTML = isValid 
            ? '<i data-lucide="shield-check"></i> <span>An Toàn</span>' 
            : '<i data-lucide="alert-triangle"></i> <span>Bị Xâm Phạm</span>';
        badge.className = 'stat-badge ' + (isValid ? 'valid' : 'invalid');
        if (window.lucide) window.lucide.createIcons();
    }
}

/* =========================================================
   MINING BUTTON ANIMATION
   ========================================================= */

let hashInterval = null;

/**
 * Toggle mining state on the button
 */
export function setMiningState(isMining) {
    const btn = document.getElementById('btn-mine');
    const text = document.getElementById('mine-btn-text');
    const counter = document.getElementById('mine-hash-counter');

    if (!btn) return;

    if (isMining) {
        btn.disabled = true;
        btn.classList.add('mining');
        if (text)    text.textContent = 'Đang đào block...';

        if (counter) {
            counter.style.display = 'inline';
            counter.style.marginLeft = '0.5rem';
            counter.style.opacity = '0.7';
            let count = 0;
            hashInterval = setInterval(() => {
                count += Math.floor(Math.random() * 8000) + 3000;
                counter.textContent = `[${count.toLocaleString()} h/s]`;
            }, 150);
        }
    } else {
        btn.disabled = false;
        btn.classList.remove('mining');
        if (text)    text.textContent = 'Khai Thác Giao Dịch Đang Chờ';
        if (counter) {
            counter.style.display = 'none';
            counter.textContent = '';
        }
        if (hashInterval) {
            clearInterval(hashInterval);
            hashInterval = null;
        }
    }
}

/* =========================================================
   WALLET UI
   ========================================================= */

export function setWalletAddress(pubKey) {
    // Hidden input for logic
    const el = document.getElementById('wallet-pubkey');
    if (el) el.value = pubKey;
    
    // Display for user
    const copy = document.getElementById('wallet-pubkey-display');
    if (copy) copy.textContent = truncateMiddle(pubKey, 24);
}

export function setWalletBalance(balance, pendingBalance) {
    const el = document.getElementById('wallet-balance');
    if (el) el.textContent = Number(balance).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 8
    });

    const pendingEl = document.getElementById('wallet-pending-balance');
    if (pendingEl) {
        const diff = balance - pendingBalance;
        pendingEl.textContent = Number(diff).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 8
        });
        // Ẩn nếu không có tiền đang chờ
        pendingEl.parentElement.style.display = diff > 0 ? 'block' : 'none';
    }
}

export function setChainValidity(isValid, invalidAtIndex) {
    const badge = document.getElementById('chain-validity-badge');
    if (!badge) return;
    if (isValid) {
        badge.className = 'validity-badge valid';
        badge.textContent = 'Hệ Thống Ổn Định';
        badge.style.color = 'var(--accent-success)';
    } else {
        badge.className = 'validity-badge invalid';
        badge.textContent = `Vi Phạm Tính Toàn Vẹn (Khối #${invalidAtIndex})`;
        badge.style.color = 'var(--accent-danger)';
    }
}

export function setMempoolBadge(count) {
    const el = document.getElementById('mempool-count');
    if (el) el.textContent = count;
}

/* =========================================================
   MISC HELPERS
   ========================================================= */

function truncateMiddle(str, maxLen) {
    if (!str || str.length <= maxLen) return str;
    const half = Math.floor((maxLen - 3) / 2);
    return `${str.substring(0, half)}...${str.substring(str.length - half)}`;
}

export function copyToClipboard(text, label = 'Đã sao chép!') {
    navigator.clipboard.writeText(text).then(() => {
        showToast('success', label, 'Địa chỉ đã được sao chép vào bộ nhớ tạm.');
    }).catch(() => {
        showToast('error', 'Lỗi Clipboard', 'Không thể sao chép địa chỉ.');
    });
}
