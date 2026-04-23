# 🔗 Hướng Dẫn Demo Hệ Thống Mini Blockchain - Phiên Bản Chuyên Nghiệp

Chào mừng bạn đến với chương trình mô phỏng **Mini Blockchain**. Tài liệu này được thiết kế để trình bày các khái niệm cốt lõi của công nghệ blockchain thông qua một giao diện tương tác trực quan, sinh động và đảm bảo tính chính xác về mặt kỹ thuật.

---

## 📋 Yêu Cầu Hệ Thống & Thiết Lập

Trước khi bắt đầu, hãy đảm bảo các node (nút mạng) đang hoạt động để có thể trình diễn tính năng P2P (mạng ngang hàng).

1.  **Khởi Chạy Mạng Lưới Đa Nút**:
    ```bash
    npm run network
    ```
    *Lệnh này sẽ khởi chạy 3 node tại các cổng **3000**, **3001**, và **3002**.*

2.  **Truy Cập Dashboard**:
    - Node 1 (Chính): [http://localhost:3000](http://localhost:3000)
    - Node 2: [http://localhost:3001](http://localhost:3001)
    - Node 3: [http://localhost:3002](http://localhost:3002)

---

## 🧪 Giai Đoạn 1: Mật Mã Học & Định Danh
*Mục tiêu: Trình diễn cách người dùng được định danh mà không cần username/password.*

1.  **Khởi Tạo Danh Tính**: Trên thanh điều hướng (sidebar), nhấn **"Tạo Ví Mới" (New Wallet)**.
2.  **Quan Sát**: 
    - Chú ý **Public Key** (Địa chỉ ví của bạn). Trong blockchain, địa chỉ này chính là danh tính của bạn.
    - Nhấn **"Xuất Private Key"**. Hãy giải thích rằng đây là "Chìa Khóa Vạn Năng" dùng để ký xác thực giao dịch. Nếu mất khóa này, tài sản sẽ mất vĩnh viễn.
3.  **Kiểm Tra Số Dư**: Số dư ban đầu là 0 MBC. Giải thích rằng tiền ảo chỉ được tạo ra thông qua **Phần Thưởng Khai Thác (Mining Rewards)**.

---

## 📥 Giai Đoạn 2: Mempool & Giao Dịch
*Mục tiêu: Hiểu cách giao dịch được tạo ra và chờ đợi để được xác nhận.*

1.  **Tạo Giao Dịch**: Sử dụng biểu mẫu "Gửi Giao Dịch".
    - **Người Nhận**: Dán địa chỉ ví khác (hoặc sử dụng địa chỉ mẫu).
    - **Số Lượng**: Nhập `50`.
2.  **Quy Trình Ký Số**: Nhấn **"Gửi Giao Dịch"**.
    - **Lưu ý kỹ thuật**: Hệ thống sử dụng thuật toán **ECDSA (secp256k1)** để ký dữ liệu. Chỉ chủ sở hữu Private Key mới có quyền chuyển tài sản.
3.  **Theo Dõi Mempool**: Quan sát mục **"Giao Dịch Đang Chờ (Mempool)"**.
    - Giải thích rằng giao dịch hiện ở trạng thái "Chưa xác nhận" (Unconfirmed). Nó hợp lệ nhưng chưa được ghi vào sổ cái bất biến.

---

## ⛏️ Giai Đoạn 3: Đào Block & Proof of Work
*Mục tiêu: Trình diễn cơ chế bảo mật mạng lưới.*

1.  **Bắt Đầu Khai Thác**: Nhấn **"Khai Thác Giao Dịch Đang Chờ" (Mine)**.
2.  **Phản Hồi Trực Quan**: Trạng thái hệ thống sẽ chuyển sang **"Đang Đào..." (Mining...)**.
3.  **Kết Quả**: 
    - Một **Block (Khối)** mới xuất hiện trong Sổ cái (Ledger).
    - Kiểm tra giá trị **Nonce**. Giải thích rằng thợ đào phải thử hàng triệu con số để tìm ra mã Hash bắt đầu bằng các số 0 theo yêu cầu (Độ khó - Difficulty).
4.  **Phần Thưởng**: Số dư của bạn sẽ tăng thêm **12.5 MBC** (Phần thưởng đào block).

---

## 🛡️ Giai Đoạn 4: Tính Toàn Vẹn & Giả Lập Tấn Công
*Mục tiêu: Chứng minh tại sao Blockchain được gọi là "Bất Biến" (Immutable).*

1.  **Kiểm Tra Sức Khỏe**: Xác nhận biểu tượng **"Hệ Thống Ổn Định" (System Healthy)**.
2.  **Tấn Công Chuỗi**: 
    - Tìm một khối đã xác nhận trong sổ cái.
    - Nhấn vào biểu tượng **Tia Chớp (⚡)** trên khối đó để sửa đổi dữ liệu.
3.  **Hiệu Ứng Gây Chuyền**:
    - Khối bị tấn công sẽ chuyển sang màu **ĐỎ**.
    - Tất cả các khối phía sau cũng chuyển sang màu **ĐỎ** vì `previousHash` của chúng không còn khớp với khối trước đó.
4.  **Phản Ứng Hệ Thống**: Thông báo cảnh báo **"Vi Phạm Tính Toàn Vẹn Dữ Liệu"** sẽ xuất hiện.
    - **Bài học**: Vì mỗi khối được liên kết chặt chẽ với khối trước đó qua mã Hash, việc thay đổi dù chỉ 1 bit dữ liệu cũng sẽ bị toàn bộ mạng lưới phát hiện ngay lập tức.

---

## 🌐 Giai Đoạn 5: Mạng P2P & Sự Đồng Thuận
*Mục tiêu: Cho thấy cách nhiều node cùng thống nhất về một "Sự Thật".*

1.  **Kết Nối Peer**: Tại [localhost:3000], nhập `http://localhost:3001` vào phần P2P và nhấn **"Kết Nối Node"**.
2.  **Mô Phỏng Xung Đột**:
    - Tại **Node 1**, đào thêm 2 block mới.
    - Tại **Node 2**, giữ nguyên. Lúc này chuỗi của Node 2 ngắn hơn.
3.  **Giải Quyết Xung Đột**: Tại **Node 2**, nhấn **"Đồng Bộ Với Mạng Lưới"**.
4.  **Kết Quả Đồng Thuận**: Node 2 sẽ phát hiện Node 1 có chuỗi dài hơn và tự động tải về lịch sử của Node 1.
    - **Bài học**: "Chuỗi dài nhất là Sự thật." Đây là cốt lõi của **Đồng Thuận Phi Tập Trung (Decentralized Consensus)**.

---

## 🎓 Tổng Kết Kiến Thức
- **Phi Tập Trung**: Không có máy chủ trung tâm nào kiểm soát sổ cái.
- **Minh Bạch**: Mọi giao dịch đều được công khai và có thể kiểm chứng.
- **Bất Biến**: Mã hóa Hash ngăn chặn việc sửa đổi lịch sử dữ liệu.
- **Khan Hiếm**: Tiền ảo được tạo ra theo thuật toán cố định, không thể in thêm tùy tiện.

---
*Biên soạn bởi Antigravity cho Mini Blockchain Simulation v2.0*
