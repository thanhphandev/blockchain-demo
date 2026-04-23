import EC from 'https://esm.sh/elliptic@6.5.4';
import SHA256 from 'https://esm.sh/crypto-js@4.2.0/sha256';

const ec = new EC.ec('secp256k1');
const STORAGE_KEY = 'blockchain_privKey_v2';

let currentWallet = {
    publicKey: null,
    privateKey: null,
    keyPair: null
};

/**
 * Khởi tạo ví từ LocalStorage hoặc tạo mới nếu chưa có.
 */
export function initWallet() {
    const savedPriv = localStorage.getItem(STORAGE_KEY);

    if (savedPriv) {
        try {
            const keyPair = ec.keyFromPrivate(savedPriv, 'hex');
            currentWallet.keyPair = keyPair;
            currentWallet.privateKey = savedPriv;
            currentWallet.publicKey = keyPair.getPublic('hex');
            return true;
        } catch (e) {
            console.error("Khôi phục ví thất bại. Tạo ví mới...");
            return generateNewWallet();
        }
    } else {
        return generateNewWallet();
    }
}

/**
 * Bắt buộc sinh một ví hoàn toàn mới.
 */
export function generateNewWallet() {
    const keyPair = ec.genKeyPair();
    currentWallet.keyPair = keyPair;
    currentWallet.privateKey = keyPair.getPrivate('hex');
    currentWallet.publicKey = keyPair.getPublic('hex');

    localStorage.setItem(STORAGE_KEY, currentWallet.privateKey);
    return true;
}

/**
 * Trả về thông tin Public Key của người dùng hiện tại
 */
export function getPublicKey() {
    return currentWallet.publicKey;
}

/**
 * Trả về thông tin Private Key (chỉ dùng cho nút Export)
 */
export function getPrivateKey() {
    return currentWallet.privateKey;
}

/**
 * Ký một giao dịch sử dụng Private Key trong bộ nhớ (Auto-sign)
 * Logic băm phải khớp chính xác với `Transaction.js` ở Backend.
 */
export function signTransactionPayload(toAddress, amount) {
    if (!currentWallet.keyPair || !currentWallet.publicKey) {
        throw new Error("Ví chưa được khởi tạo!");
    }
    if (!toAddress) throw new Error("Vui lòng nhập địa chỉ người nhận!");
    if (!amount || amount <= 0) throw new Error("Số lượng không hợp lệ!");

    const timestamp = Date.now();
    const amountNum = parseFloat(amount);

    // Băm thông tin giao dịch (from + to + amount + timestamp)
    // Tương đương với this.calculateHash() trong src/models/Transaction.js
    const txString = currentWallet.publicKey + toAddress + amountNum + timestamp;
    const hashTx = SHA256(txString).toString();

    // Ký điện tử (ECDSA)
    const sig = currentWallet.keyPair.sign(hashTx, 'base64');
    const signatureHex = sig.toDER('hex');

    return {
        fromAddress: currentWallet.publicKey,
        toAddress: toAddress,
        amount: amountNum,
        signature: signatureHex,
        timestamp: timestamp
    };
}
