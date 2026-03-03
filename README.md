# 🔗 Mini Blockchain Simulation

Dự án mô phỏng Blockchain đơn giản sử dụng Node.js, Express và Bootstrap 5. Được thiết kế cho mục đích học tập và thuyết trình tiểu luận.

---

## 📋 Mục lục

- [Tính năng](#-tính-năng)
- [Cài đặt](#-cài-đặt)
- [Sử dụng](#-sử-dụng)
- [API Endpoints](#-api-endpoints)
- [Demo Tamper Attack](#-demo-tamper-attack)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)

---

## ✨ Tính năng

| Tính năng | Mô tả |
|-----------|-------|
| **Proof of Work** | Thuật toán đào coin với độ khó có thể điều chỉnh |
| **Mempool** | Hàng đợi giao dịch giống Bitcoin/Ethereum thực |
| **Tamper Demo** | Giả lập tấn công để chứng minh tính bất biến |
| **Visual Links** | Mũi tên hiển thị liên kết giữa các block |
| **Validation** | Kiểm tra 3 điều kiện bảo mật của blockchain |

---

## 🚀 Cài đặt

### Yêu cầu hệ thống

- Node.js phiên bản 14 trở lên
- npm (đi kèm với Node.js)

### Các bước cài đặt

```bash
# 1. Mở terminal và di chuyển đến thư mục dự án
cd e:\blockchain

# 2. Cài đặt các dependencies
npm install

# 3. Khởi động server
npm start
# Hoặc: node src/server.js

# 4. Mở trình duyệt tại địa chỉ:
# http://localhost:3000
```

---

## 🎮 Sử dụng

### 1. Thêm giao dịch vào Mempool

1. Nhập nội dung giao dịch vào ô "Dữ liệu giao dịch"
2. Nhấn **"Thêm vào Mempool"**
3. Giao dịch sẽ xuất hiện trong phần Mempool

### 2. Đào Block mới

1. Nhấn **"Mine New Block"**
2. Chờ quá trình đào (có spinner loading)
3. Block mới sẽ xuất hiện trong chuỗi

### 3. Kiểm tra tính toàn vẹn

- Nhấn **"Validate Chain"** để kiểm tra
- ✅ Xanh: Blockchain hợp lệ
- ❌ Đỏ: Phát hiện dữ liệu bị sửa đổi

### 4. Demo tấn công (Tamper)

1. Nhấn nút **"Tamper"** trên một block bất kỳ
2. Nhập dữ liệu giả mạo
3. Nhấn **"Validate Chain"** để thấy chuỗi bị đánh dấu không hợp lệ

---

## 📡 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/chain` | Lấy toàn bộ blockchain |
| GET | `/difficulty` | Lấy độ khó hiện tại |
| POST | `/add-transaction` | Thêm giao dịch vào Mempool |
| GET | `/pending` | Xem giao dịch đang chờ |
| GET | `/mine` | Đào block mới |
| GET | `/is-valid` | Kiểm tra tính toàn vẹn |
| POST | `/tamper/:index` | Giả lập sửa đổi block |
| POST | `/reset` | Reset blockchain |

### Ví dụ sử dụng với cURL

```bash
# Lấy blockchain
curl http://localhost:3000/chain

# Thêm giao dịch
curl -X POST http://localhost:3000/add-transaction \
  -H "Content-Type: application/json" \
  -d '{"data":"Chuyển 10 BTC từ Alice sang Bob"}'

# Đào block
curl http://localhost:3000/mine

# Kiểm tra
curl http://localhost:3000/is-valid

# Tấn công block #1
curl -X POST http://localhost:3000/tamper/1 \
  -H "Content-Type: application/json" \
  -d '{"newData":"HACKED: Chuyển 1000 BTC"}'
```

---

## 🔓 Demo Tamper Attack

Đây là tính năng quan trọng để **thuyết trình**. Nó chứng minh rằng:

> *"Nếu ai đó sửa dữ liệu ở Block #1, hash của nó thay đổi, dẫn đến không khớp với previousHash ở Block #2, từ đó phá vỡ cả chuỗi."*

### Quy trình demo:

1. Đào thêm 2-3 blocks
2. Quan sát mũi tên liên kết xanh giữa các block
3. Nhấn "Tamper" trên Block #1, nhập dữ liệu giả
4. Nhấn "Validate Chain"
5. **Kết quả**: Mũi tên chuyển đỏ, chuỗi bị đánh dấu INVALID

---

## 📁 Cấu trúc dự án

```
blockchain/
├── src/
│   ├── models/
│   │   ├── Block.js      # Class Block với Proof of Work
│   │   └── Blockchain.js # Class Blockchain với Mempool
│   └── server.js         # Express API server
├── public/
│   ├── css/
│   │   └── style.css     # Styles và animations
│   ├── js/
│   │   └── script.js     # Frontend logic
│   └── index.html        # Giao diện Bootstrap 5
├── package.json          # Dependencies
└── README.md             # File này
```

---

## 📚 Giải thích thuật toán

### Proof of Work (PoW)

```javascript
// Hash phải bắt đầu bằng số lượng số 0 = difficulty
// Ví dụ: difficulty = 4 → hash phải là "0000..."

while (hash.substring(0, difficulty) !== "0000") {
    nonce++;           // Tăng số ngẫu nhiên
    hash = SHA256(...); // Tính lại hash
}
```

**Tại sao bảo mật?**
- Để tìm hash hợp lệ cần thử **hàng triệu lần**
- Nếu sửa 1 block, phải đào lại **tất cả block phía sau**
- Hacker không thể đào nhanh hơn toàn bộ mạng lưới

### Kiểm tra 3 điều kiện

1. **Hash khớp dữ liệu**: `block.hash === SHA256(block)`
2. **Liên kết nguyên vẹn**: `block.previousHash === prevBlock.hash`
3. **PoW hợp lệ**: `block.hash.startsWith("0000")`

---

## 👨‍💻 Tác giả

*Tiểu luận Blockchain - Cuối kỳ*

---

## 📄 License

MIT License
