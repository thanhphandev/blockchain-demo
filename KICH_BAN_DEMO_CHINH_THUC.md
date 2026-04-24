# 🎬 KỊCH BẢN DEMO BLOCKCHAIN CHUYÊN NGHIỆP
> **Người thực hiện:** [Tên của bạn]
> **Dự án:** Mini Blockchain

---

## 🛠 PHẦN 0: CHUẨN BỊ (5 phút trước khi bắt đầu)
1.  **Chạy mạng lưới:** Mở terminal tại thư mục dự án và gõ `npm run network`.
2.  **Mở giao diện:** Mở 3 tab trình duyệt cạnh nhau:
    *   Tab 1: `http://localhost:3000` (Node 1)
    *   Tab 2: `http://localhost:3001` (Node 2)
    *   Tab 3: `http://localhost:3002` (Node 3)
3.  **Tạo ví:** Ở mỗi tab, nhấn nút **"Tạo Ví Mới"**. 
    *   *Mẹo:* Hãy copy Public Key của Node 2 và Node 3 dán vào một file Notepad để lát nữa paste cho nhanh.

---

## 🏁 GIAI ĐOẠN 1: GIỚI THIỆU (1-2 phút)
*   **Hành động:** Chỉ vào màn hình Dashboard ở Node 1, rê chuột qua các khối.
*   **Lời thoại:** 
    > "Chào thầy/cô và các bạn. Đây là hệ thống **Mini Blockchain** do em phát triển. Thay vì dùng một máy chủ trung tâm, hệ thống của em chạy trên mô hình **P2P (Peer-to-Peer)** với 3 Node độc lập. 
    > Thầy cô có thể thấy ở đây mỗi Node đều có một bản sao của sổ cái (Ledger), một danh sách Mempool riêng và các thông số về độ khó khai thác (Difficulty) hiện đang là 4."

---

## 💸 GIAI ĐOẠN 2: GIAO DỊCH & LAN TỎA (3 phút)
*   **Hành động:** 
    1.  Tại **Node 1**, dán Public Key của **Node 2** vào ô người nhận.
    2.  Nhập số tiền: `50`.
    3.  Nhấn nút **"Ký & Gửi Giao Dịch"**.
*   **Quan sát:** Chỉ cho thầy cô thấy Mempool ở **cả 3 Tab** cùng hiện số 1.
*   **Lời thoại:** 
    > "Bây giờ, em thực hiện gửi 50 MBC từ Node 1 sang Node 2. 
    > **Điểm mấu chốt ở đây:** Ngay khi em nhấn gửi, trình duyệt đã dùng **Private Key** của em để ký số ECDSA lên giao dịch này. 
    > Thầy/cô hãy quan sát, dù em chỉ thao tác trên Node 1, nhưng qua giao thức WebSockets, giao dịch đã được **Broadcasting (Lan tỏa)** ngay lập tức sang Node 2 và Node 3. Cả 3 máy đều đã nhận được yêu cầu trong Mempool."

---

## ⛏️ GIAI ĐOẠN 3: ĐÀO KHỐI & PROOF OF WORK (3 phút)
*   **Hành động:** Tại **Node 2**, nhấn nút **"Khai Thác Giao Dịch"**.
*   **Quan sát:** Hiệu ứng quay ở khối đang đào. Khi xong, Block mới hiện ra ở cả 3 Tab.
*   **Lời thoại:** 
    > "Giao dịch đang nằm ở Mempool và chưa được xác nhận. Bây giờ Node 2 sẽ tiến hành đào (Mining). 
    > Quá trình này chính là **Proof of Work**. Máy tính phải tìm một số **Nonce** sao cho mã Hash của khối bắt đầu bằng 4 số 0. 
    > **(Khi đào xong)**: Vâng, Node 2 đã tìm ra khối mới! Khối này chứa giao dịch 50 MBC lúc nãy. Thầy/cô thấy không ạ? Node 1 và Node 3 cũng đã tự động cập nhật khối mới này vào chuỗi của mình nhờ cơ chế đồng bộ mạng lưới."

---

## 😈 GIAI ĐOẠN 4: TẤN CÔNG & TÍNH BẤT BIẾN (2 phút)
*   **Hành động:** Tại **Node 1**, chọn Block số 1 (không phải Genesis), nhấn nút **"Tamper" (Tấn công)**. Sửa số tiền từ 50 thành 9999.
*   **Quan sát:** Chuỗi ở Node 1 chuyển sang **MÀU ĐỎ**, các Node khác vẫn XANH.
*   **Lời thoại:** 
    > "Blockchain nổi tiếng vì tính **Bất biến (Immutability)**. Để chứng minh, em sẽ giả làm hacker tấn công vào Node 1. Em sửa số tiền gửi từ 50 thành 9999. 
    > Ngay lập tức, mã Hash của khối này bị thay đổi, dẫn đến sự đứt gãy liên kết với các khối sau. Chuỗi của Node 1 hiện màu đỏ và báo **'Invalid'**. Hacker không thể gian lận vì mã Hash là 'vĩnh cửu', không thể sửa đổi mà không bị phát hiện."

---

## 🛡️ GIAI ĐOẠN 5: TỰ CHỮA LÀNH (CONSENSUS) (2 phút)
*   **Hành động:** 
    1.  Tại **Node 2** (hoặc Node 3), nhấn nút **"Khai Thác Giao Dịch"** thêm một lần nữa. (Lúc này Node 2 sẽ có nhiều khối hơn Node 1).
    2.  Quay lại **Node 1** (đang bị đỏ), nhấn nút **"Kiểm Tra & Đồng Bộ Mạng Lưới"**.
*   **Quan sát:** Chuỗi ở Node 1 lập tức chuyển lại thành **MÀU XANH** giống hệt Node 2.
*   **Lời thoại:** 
    > "Trong mạng lưới phi tập trung, chúng ta tin ai? Câu trả lời là tin vào số đông và công sức đào lớn nhất. 
    > Theo quy tắc **Longest Chain Rule** (Chuỗi dài nhất), một Node sẽ luôn ưu tiên chuỗi nào dài hơn và hợp lệ. Vì Node 1 bị hack và bị tụt lại phía sau so với Node 2, nên khi em nhấn 'Đồng bộ', Node 1 sẽ tự nhận ra mình đã lạc hậu. 
    > Kết quả là Node 1 đã được **Tự chữa lành (Self-healing)** bằng cách tải bản sao chuẩn từ Node 2. Hacker hoàn toàn thất bại vì không thể sửa đổi dữ liệu của toàn bộ mạng lưới cùng lúc ạ!"

---

## ❓ CÁC CÂU HỎI PHẢN BIỆN "HÓC BÚA" (FAQ)

### 1. Nếu hacker chiếm được tất cả các Node thì sao? (Tấn công 51%)
*   **Trả lời:** Dạ, đây chính là "Cuộc tấn công 51%". Nếu hacker kiểm soát phần lớn mạng lưới, họ có thể viết lại lịch sử. Tuy nhiên, sức mạnh của Blockchain nằm ở tính phi tập trung quy mô lớn. Với hàng vạn Node trên toàn cầu, chi phí để hack tất cả là con số không tưởng, lớn hơn nhiều lợi ích thu được. Blockchain bảo vệ dữ liệu bằng tính "Kinh tế học": Khiến việc tấn công trở nên quá đắt đỏ so với việc làm thợ đào trung thực.

### 2. Tại sao phải đào (Proof of Work) tốn thời gian và điện năng?
*   **Trả lời:** Việc đào chính là "Bức tường lửa" bằng toán học. Nó biến việc ghi dữ liệu vào sổ cái thành một công việc khó khăn và tốn kém. Nếu không có PoW, bất kỳ ai cũng có thể tạo ra hàng triệu khối giả mạo trong 1 giây. PoW ép mọi người phải tuân thủ luật chơi và chứng minh công sức của mình trước khi được mạng lưới công nhận.

### 3. Nếu sửa 1 ký tự ở khối đầu tiên, các khối sau có bị ảnh hưởng không?
*   **Trả lời:** Dạ có ạ. Vì mỗi khối đều chứa Hash của khối trước đó (`previousHash`). Nếu khối 1 thay đổi, mã Hash của nó thay đổi. Khối 2 đang chứa mã cũ sẽ ngay lập tức bị sai lệch, dẫn đến phản ứng dây chuyền làm hỏng toàn bộ chuỗi từ điểm bị sửa trở về sau.

---
**Chúc bạn có một buổi bảo vệ đồ án thành công rực rỡ!**
