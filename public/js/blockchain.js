/**
 * Blockchain Visualization Logic
 * Handles rendering the chain and transactions in the UI
 */

export function renderChain(chain, validation = { valid: true, invalidBlockIndex: null }) {
    const container = document.getElementById('blockchain-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    chain.forEach((block, index) => {
        const isInvalid = !validation.valid && index >= validation.invalidBlockIndex;
        const blockEl = document.createElement('div');
        blockEl.className = `block-card ${index === 0 ? 'genesis' : ''} ${isInvalid ? 'invalid' : ''}`;
        
        // Check if block is valid (logic can be added here or via separate call)
        // For visual demo, we assume valid unless marked
        
        const timestamp = new Date(block.timestamp).toLocaleString();
        
        blockEl.innerHTML = `
            <div class="block-header">
                <span class="block-idx">KHỐI #${index}</span>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span class="block-time">${timestamp}</span>
                    <button class="btn-tamper" data-index="${index}" title="Tamper with this block" 
                            style="background: none; border: none; padding: 2px; cursor: pointer; color: var(--text-muted);">
                        <i data-lucide="zap" style="width: 14px;"></i>
                    </button>
                </div>
            </div>
            <div class="block-body">
                ${isInvalid ? `
                    <div style="background: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; padding: 0.75rem; margin-bottom: 1rem; color: #dc2626; font-size: 0.75rem; font-weight: 700;">
                        <i data-lucide="alert-circle" style="width: 14px; vertical-align: middle;"></i> PHÁT HIỆN KHỐI KHÔNG HỢP LỆ
                    </div>
                ` : ''}
                <div class="tx-list">
                    ${renderBlockTransactions(block.transactions)}
                </div>
                
                <div class="block-hashes">
                    <div class="hash-row">
                        <span class="hash-label">Hash Khối Trước (Previous Hash)</span>
                        <div class="hash-value">${block.previousHash.substring(0, 16)}...</div>
                    </div>
                    <div class="hash-row">
                        <span class="hash-label">Hash</span>
                        <div class="hash-value" style="color: var(--accent-primary)">${block.hash.substring(0, 16)}...</div>
                    </div>
                    <div class="hash-row" style="display: flex; justify-content: space-between; align-items: center;">
                        <span class="hash-label">Nonce</span>
                        <span class="mono" style="font-size: 0.7rem; font-weight: 700;">${block.nonce}</span>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(blockEl);
        
        // Add arrow if not last block
        if (index < chain.length - 1) {
            const arrow = document.createElement('div');
            arrow.className = 'arrow';
            arrow.innerHTML = `
                <div class="arrow-line"></div>
                <div class="arrow-head"></div>
            `;
            container.appendChild(arrow);
        }
    });

    // Re-run Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Scroll to end
    container.scrollLeft = container.scrollWidth;
}

function renderBlockTransactions(transactions) {
    if (!transactions || transactions.length === 0) {
        return `<div style="text-align: center; padding: 1rem; color: var(--text-muted); font-size: 0.75rem;">Không có giao dịch</div>`;
    }
    
    return transactions.map(tx => {
        // Handle mining rewards differently
        const isReward = !tx.fromAddress;
        return `
            <div class="tx-item">
                <div class="tx-meta">
                    <span>${isReward ? 'Phần Thưởng Khai Thác' : 'Chuyển MBC'}</span>
                    <span class="tx-amount">${tx.amount} MBC</span>
                </div>
                <span class="tx-addr" title="${tx.fromAddress || 'Hệ Thống'}">
                    Từ: ${isReward ? 'Hệ Thống' : tx.fromAddress.substring(0, 12) + '...'}
                </span>
                <span class="tx-addr" title="${tx.toAddress}">
                    Đến: ${tx.toAddress.substring(0, 12)}...
                </span>
            </div>
        `;
    }).join('');
}

export function renderMempool(mempool) {
    const container = document.getElementById('mempool-items');
    const countLabel = document.getElementById('mempool-count');
    
    if (!container) return;
    
    container.innerHTML = '';
    countLabel.innerText = mempool.length;
    
    if (mempool.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem; background: #fff; border: 1px dashed var(--border-base); border-radius: 12px; color: var(--text-muted);">
                <i data-lucide="coffee" style="margin-bottom: 0.5rem; opacity: 0.5;"></i>
                <p style="font-size: 0.85rem;">Mempool hiện đang trống. Hãy tạo một giao dịch để xem nó xuất hiện ở đây.</p>
            </div>
        `;
    } else {
        mempool.forEach(tx => {
            const txEl = document.createElement('div');
            txEl.className = 'card';
            txEl.style.marginBottom = '0';
            txEl.innerHTML = `
                <div class="card-body" style="padding: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <span class="badge" style="background: #e0e7ff; color: #4338ca; font-size: 0.6rem; font-weight: 700; padding: 2px 6px; border-radius: 4px;">CHƯA XÁC NHẬN</span>
                        <span style="font-weight: 800; color: var(--accent-success);">${tx.amount} MBC</span>
                    </div>
                    <div style="font-size: 0.7rem; color: var(--text-secondary);">
                        <div style="margin-bottom: 0.25rem;"><strong>Từ:</strong> <span class="mono">${tx.fromAddress.substring(0, 15)}...</span></div>
                        <div><strong>Đến:</strong> <span class="mono">${tx.toAddress.substring(0, 15)}...</span></div>
                    </div>
                </div>
            `;
            container.appendChild(txEl);
        });
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }
}
