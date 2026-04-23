# 🏆 CẨM NANG BẢO VỆ ĐỒ ÁN BLOCKCHAIN 100% (ULTIMATE GUIDE)

Tài liệu này được biên soạn để bạn nắm vững mọi ngóc ngách của dự án Mini Blockchain, từ lý thuyết hàn lâm đến thực hành demo và kỹ năng trả lời phản biện.

---

## 🛠️ PHẦN 1: QUY TRÌNH DEMO "SIÊU ĐẲNG" (Kịch bản 10 phút)

Chuẩn bị: Mở 3 cửa sổ trình duyệt cho 3 Port: 3000, 3001, 3002.

### Giai đoạn 1: Thiết lập & Giải thích danh tính (1-2 phút)
- **Hành động:** Tại Node 1, nhấn "Tạo Ví". Copy Public Key. Sang Node 2 làm tương tự.
- **Nói:** "Chào thầy/cô, hệ thống của em khởi đầu bằng việc tạo ra các cặp khóa mã hóa. Public Key đóng vai trò là địa chỉ ví công khai, còn Private Key là chìa khóa bí mật để ký giao dịch. Đây là nền tảng của tính ẩn danh và bảo mật."

### Giai đoạn 2: Giao dịch & Lan tỏa (Broadcasting) (2-3 phút)
- **Hành động:** Từ Node 1, gửi 50 MBC cho Node 2.
- **Quan sát:** Chỉ cho thầy cô thấy Mempool ở **cả 3 Tab** cùng hiện số 1.
- **Nói:** "Dưới sự hỗ trợ của giao thức WebSockets, ngay khi một giao dịch được ký, nó sẽ được lan tỏa toàn mạng lưới. Tất cả các nút đều nhận được thông tin này và đưa vào Mempool (Hàng đợi xác nhận). Điều này chứng minh tính chất phân tán, không có máy chủ trung tâm."

### Giai đoạn 3: Khai thác (Mining) & Proof of Work (3 phút)
- **Hành động:** Tại Node 2, nhấn "Khai Thác Giao Dịch".
- **Quan sát:** Hiệu ứng quay và quá trình tìm Nonce. Khi xong, Block mới hiện ra.
- **Nói:** "Đây là quá trình đào (Mining). Máy tính thực hiện thuật toán Proof of Work để tìm ra một mã Hash thỏa mãn độ khó của hệ thống (4 số 0 đầu). Thợ đào giải xong sẽ được thưởng 12.5 MBC để khuyến khích họ đóng góp sức mạnh tính toán."

### Giai đoạn 4: Tấn công & Tự chữa lành (3-4 phút) - QUAN TRỌNG NHẤT
- **Hành động:**
    1. Tại Node 1: Nhấn biểu tượng Bug/Tamper trên Block #1, sửa dữ liệu thành "Hack 1000 BTC".
    2. Chỉ vào chuỗi màu đỏ: "Hệ thống phát hiện vi phạm tính toàn vẹn ngay lập tức."
    3. Tại Node 2: Nhấn Mine để tạo thêm Block #2 (lúc này Node 2 dài hơn và đúng).
    4. Tại Node 1: Nhấn "Đồng bộ". Chuỗi đỏ biến mất, trở lại trạng thái xanh.
- **Nói:** "Dù hacker tấn công Node 1, nhưng theo luật 'Chuỗi dài nhất và hợp lệ nhất', Node 1 sẽ tự nhận ra mình sai khi so sánh với Node 2 và Node 3. Nó sẽ tự động tải lại dữ liệu chuẩn từ mạng lưới. Đây chính là khả năng tự phục hồi (Self-healing) của Blockchain."

---

## 📚 PHẦN 2: "BÁCH KHOA TOÀN THƯ" LÝ THUYẾT

### 1. Block (Khối) chứa cái gì?
- **Index**: Số thứ tự.
- **Timestamp**: Thời gian tạo.
- **Transactions**: Danh sách các giao dịch (Dữ liệu cốt lõi).
- **PreviousHash**: Mã Hash của khối trước (Sợi dây liên kết).
- **Nonce**: Con số may mắn để giải bài toán PoW.
- **Hash**: "Dấu vân tay" của toàn bộ khối.

### 2. Hàm băm SHA-256 là gì?
- Là thuật toán biến đầu vào (bất kể độ dài) thành đầu ra 64 ký tự Hex.
- **Đặc tính:** Tính một chiều (không thể dịch ngược), tính nhạy cảm (thay đổi 1 ký tự đầu vào thì đầu ra khác hoàn toàn).

### 3. Chữ ký số ECDSA (secp256k1) là gì?
- Dùng trong Bitcoin. Nó cho phép người gửi "ký" lên giao dịch. Bất kỳ ai có Public Key của người gửi đều có thể kiểm tra xem chữ ký đó có đúng do Private Key tương ứng tạo ra không, mà không cần biết Private Key là gì.

### 4. Proof of Work (PoW) hoạt động thế nào?
- Máy tính phải thử liên tục các số Nonce khác nhau:
  - Thử Nonce = 1 -> Hash = "abc..." (Sai)
  - Thử Nonce = 2 -> Hash = "xyz..." (Sai)
  - ...
  - Thử Nonce = 5623 -> Hash = "0000..." (Đúng!) -> Tìm được khối!
- Độ khó càng cao (nhiều số 0), thời gian tìm càng lâu.

### 5. Cơ chế Đồng thuận (Consensus)
- Là cách các Node đồng ý với nhau về một sự thật duy nhất mà không cần ai làm chủ. Dự án dùng **Longest Chain Rule**: Chuỗi nào có nhiều khối nhất (tốn nhiều công sức đào nhất) là chuỗi đúng.

---

## ❓ PHẦN 3: BỘ CÂU HỎI PHẢN BIỆN "HÓA GIẢI" MỌI TÌNH HUỐNG

**1. Tại sao mã Hash của Block lại bảo mật được dữ liệu?**
> **Trả lời:** "Dạ, vì mã Hash của Block hiện tại được tính dựa trên cả mã Hash của Block trước. Nếu thầy/cô sửa dữ liệu ở Block #1, Hash của nó thay đổi. Vì Block #2 chứa 'Hash cũ' của Block #1, nên sự liên kết bị đứt gãy. Muốn sửa Block #1 mà không bị phát hiện, hacker phải đào lại Block #1, #2, #3... nhanh hơn toàn bộ phần còn lại của thế giới, điều này là bất khả thi."

**2. Nếu 2 người cùng đào được 1 khối cùng lúc thì sao?**
> **Trả lời:** "Dạ, lúc đó sẽ xảy ra hiện tượng 'Fork' (nhánh tạm thời). Một số Node sẽ theo nhánh A, một số theo nhánh B. Tuy nhiên, ngay khi có một thợ đào tiếp theo đào được khối mới trên bất kỳ nhánh nào, nhánh đó sẽ trở nên dài hơn. Theo luật 'Chuỗi dài nhất', tất cả các Node sẽ tự động bỏ nhánh ngắn và theo nhánh dài nhất, mạng lưới sẽ trở lại đồng nhất ạ."

**3. Tại sao em lại chọn độ khó (Difficulty) là 4?**
> **Trả lời:** "Dạ, độ khó 4 (cần 4 số 0 đầu) là con số phù hợp để demo. Nó đủ khó để máy tính phải mất vài giây tính toán (cho thầy cô thấy quá trình đào), nhưng cũng đủ nhanh để buổi thuyết trình không bị gián đoạn quá lâu ạ."

**4. Blockchain này có thể ứng dụng vào đâu ngoài tiền tệ?**
> **Trả lời:** "Dạ, nhờ tính bất biến, nó có thể dùng trong: Truy xuất nguồn gốc thực phẩm, Quản lý bằng cấp y tế, Bầu cử điện tử (không thể sửa phiếu), hoặc Quản lý hợp đồng thông minh ạ."

**5. Cơ chế chống Double Spending của em cụ thể là gì?**
> **Trả lời:** "Dạ, trước khi thêm giao dịch vào Mempool, hệ thống sẽ tính toán: `Số dư hiện có - Tổng tiền đang đợi trong Mempool`. Nếu kết quả nhỏ hơn số tiền định gửi, hệ thống sẽ từ chối ngay lập tức, không cho phép người dùng dùng một số tiền để gửi cho hai người khác nhau ạ."

---
**Lời khuyên cuối cùng:**
- Hãy giữ thái độ tự tin.
- Khi demo bị lỗi (Desync), hãy bình tĩnh nhấn "Đồng bộ" và giải thích đó là tính năng "Tự chữa lành".
- Chúc bạn có một buổi bảo vệ đồ án xuất sắc! 🚀✨
