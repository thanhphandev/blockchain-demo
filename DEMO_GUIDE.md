# 🌐 Hướng Dẫn Vận Hành Hệ Thống Mini Blockchain v3.0 (Production-Grade)

Tài liệu này hướng dẫn chi tiết cách trình diễn hệ thống **Mini Blockchain** với kiến trúc mạng ngang hàng (P2P) dựa trên **WebSockets**, cơ chế xác thực chữ ký số **ECDSA**, và thuật toán đồng thuận **Proof of Work**.

---

## 🛠️ 1. Chuẩn Bị & Khởi Chạy
Hệ thống yêu cầu Node.js và các phụ thuộc đã được cài đặt (`npm install`).

### Khởi chạy mạng lưới 3 nút (Nodes):
Mở terminal và chạy lệnh:
```bash
npm run network
```
*Lệnh này tự động kích hoạt 3 instance server độc lập:*
- **Node 1**: [http://localhost:3000](http://localhost:3000) (P2P Port: 4000)
- **Node 2**: [http://localhost:3001](http://localhost:3001) (P2P Port: 4001)
- **Node 3**: [http://localhost:3002](http://localhost:3002) (P2P Port: 4002)

---

## 🧪 2. Kịch Bản Trình Diễn (6 Giai Đoạn)

### Giai Đoạn 1: Thiết Lập Danh Tính (Identity & Keys)
*Mục tiêu: Hiểu về ví tiền và tính ẩn danh.*
1.  Truy cập **Node 1**. Nhấn **"Tạo Ví Mới"**.
2.  **Giải thích**: 
    - **Public Key**: Là địa chỉ nhận tiền (giống số tài khoản ngân hàng).
    - **Private Key**: Là "chữ ký" tối mật. Trong Blockchain, "Bạn sở hữu Private Key nghĩa là bạn sở hữu tài sản".
3.  Lưu lại Public Key của Node 1 để nhận tiền.

### Giai Đoạn 2: Giao Dịch Thời Gian Thực (Mempool & WebSockets)
*Mục tiêu: Thấy được sự lan tỏa thông tin tức thời.*
1.  Mở song song 2 trình duyệt cho **Node 1** và **Node 2**.
2.  Tại **Node 1**, thực hiện gửi tiền tới **Node 2**.
3.  **Quan sát**: Ngay khi nhấn "Ký & Gửi", phần **"Giao Dịch Đang Chờ (Mempool)"** ở cả 2 cửa sổ sẽ cập nhật cùng lúc.
4.  **Kỹ thuật**: Thông tin được truyền qua WebSocket ngay lập tức (không có độ trễ Polling).

### Giai Đoạn 3: Đào Khối & Proof of Work (Mining)
*Mục tiêu: Hiểu cách dữ liệu được đóng gói vào sổ cái.*
1.  Tại **Node 2**, nhấn **"Khai Thác Giao Dịch"**.
2.  **Quan sát**: Dashboard của **Node 1** cũng sẽ tự động xuất hiện Block mới mà không cần tải lại trang.
3.  **Giải thích**:
    - **Nonce**: Con số may mắn mà thợ đào phải tìm.
    - **Difficulty**: Độ khó càng cao, thợ đào càng mất nhiều thời gian để tìm mã Hash hợp lệ.
    - **Reward**: Node đào thành công sẽ nhận được 12.5 MBC.

### Giai Đoạn 4: Ngăn Chặn Chi Tiêu Kép (Double Spending Protection)
*Mục tiêu: Chứng minh tính an toàn của hệ thống tài chính.*
1.  Giả sử bạn có 100 MBC. Hãy tạo 2 giao dịch mỗi cái 60 MBC.
2.  **Kết quả**: Hệ thống sẽ chặn giao dịch thứ 2 ngay tại Frontend/Backend vì: `Số dư hiện tại - Tiền đang đợi trong Mempool < Số tiền gửi`.
3.  **Kỹ thuật**: Đây là cơ chế **Mempool-aware balance validation** cao cấp, đảm bảo người dùng không thể "gian lận" bằng cách gửi cùng một số tiền cho 2 người khác nhau trong khi đợi xác nhận.

### Giai Đoạn 5: Sự Đồng Thuận & Chuỗi Dài Nhất (Consensus)
*Mục tiêu: Hiểu cách mạng lưới giải quyết mâu thuẫn.*
1.  **Tự động kết nối**: Hệ thống v3.0 đã tích hợp cơ chế **Auto-Discovery**. Khi bạn chạy `npm run network`, các node 3000, 3001, 3002 sẽ tự động tìm thấy và kết nối WebSocket với nhau.
2.  **Mô phỏng Xung Đột**:
    - F12 (Console) để kiểm tra các node đã `Connection established`.
    - Cho **Node 1** đào thêm 3 block.
    - Cho **Node 2** giữ nguyên (hoặc đào ít hơn).
3.  **Đồng bộ tức thời**: Nhờ WebSocket, ngay khi Node 1 đào xong, Node 2 sẽ nhận được thông báo và tự động cập nhật chuỗi của mình để khớp với "Chuỗi dài nhất".
4.  **Kiểm tra thủ công (Nếu cần)**: Nếu một node bị mất mạng, bạn vẫn có thể nhấn nút **"Đồng Bộ Với Mạng Lưới"** để ép buộc hệ thống kiểm tra lại trạng thái.

### Giai Đoạn 6: Tính Bất Biến & Tấn Công Giả Mạo (Immutability)
*Mục tiêu: Thấy được sức mạnh của mã hóa Hash.*
1.  Tại bất kỳ node nào, tìm một Block cũ.
2.  Nhấn biểu tượng **Tia chớp (⚡)** để sửa đổi dữ liệu khối.
3.  **Hậu quả**: Toàn bộ các khối phía sau sẽ chuyển sang màu đỏ và hệ thống báo động **"Bị Xâm Phạm"**.
4.  **Giải thích**: Vì mã Hash của khối sau phụ thuộc vào khối trước, việc sửa đổi 1 ký tự sẽ phá vỡ toàn bộ "sợi xích" liên kết.

---

## 🔎 3. Kiểm Tra & Phát Hiện Lỗi (Testing & Debugging)

Khi vận hành, hãy chú ý các dấu hiệu sau để đảm bảo hệ thống hoạt động 100%:

### ✅ Dấu hiệu Hoạt động Tốt:
- **Terminal**: Xuất hiện dòng `📡 P2P Server: Connection established` khi các node kết nối.
- **Frontend**: Dashboard hiển thị "Hệ Thống Ổn Định" (Màu xanh).
- **Real-time**: Gửi tiền ở Node này, Node kia hiện Mempool ngay (dưới 100ms).

### ❌ Dấu hiệu Có Lỗi & Cách Xử Lý:
1.  **Mất đồng bộ (Desync)**:
    - *Dấu hiệu*: Block ở Node 1 khác hoàn toàn Node 2.
    - *Xử lý*: Nhấn nút **"Đồng Bộ Với Mạng Lưới" (Resolve Conflicts)**.
2.  **Lỗi WebSocket (Socket Error)**:
    - *Dấu hiệu*: Nhấn Gửi tiền nhưng node khác không nhận được.
    - *Nguyên nhân*: Port 4000/4001/4002 bị chiếm dụng bởi ứng dụng khác.
    - *Kiểm tra*: Mở Console (F12) xem có báo lỗi `WebSocket connection failed` không.
3.  **Từ Chối Chữ Ký (Signature Rejected)**:
    - *Dấu hiệu*: Thông báo "Cannot add invalid transaction".
    - *Nguyên nhân*: Bạn đang cố dùng Private Key của ví A để ký cho ví B.
4.  **Lỗi Đào Khối (Mining Stall)**:
    - *Dấu hiệu*: CPU chạy 100% nhưng không tìm thấy block.
    - *Giải thích*: Có thể Difficulty đang để quá cao (mặc định là 2 hoặc 3 để demo mượt mà).

---

## 🎓 4. Ý Nghĩa Thực Tiễn Của Hệ Thống
Hệ thống này không chỉ là mã nguồn, nó là mô hình thu nhỏ của:
- **Tài chính phi tập trung (DeFi)**: Không cần ngân hàng.
- **Dữ liệu bất biến**: Ứng dụng trong truy xuất nguồn gốc, bầu cử điện tử.
- **Tự động hóa niềm tin**: Tin vào thuật toán thay vì con người.

---
*Biên soạn bởi Antigravity cho Đồ án Mini Blockchain v3.0*
### 6. 🤖 Điều Khiển Bằng AI Agent (Mới)
Hệ thống hiện đã tích hợp **Page Agent**, cho phép bạn điều khiển Blockchain Explorer bằng ngôn ngữ tự nhiên:
1. Nhấp vào biểu tượng robot ở góc màn hình.
2. Nhập lệnh bằng tiếng Việt hoặc tiếng Anh, ví dụ:
   - *"Gửi 10 MBC cho địa chỉ [Dán địa chỉ vào]"*
   - *"Thực hiện đào block mới"*
   - *"Kiểm tra tính toàn vẹn của chuỗi"*
3. AI sẽ tự động thực hiện các thao tác click và nhập liệu cho bạn.

---
**Lưu ý:** Đây là phiên bản demo sử dụng API LLM miễn phí. Để sử dụng ổn định lâu dài, hãy thay thế `apiKey` trong file `index.html`.
