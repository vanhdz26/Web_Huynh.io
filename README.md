# FitTrack - Nhật ký tập luyện và theo dõi tiến độ sức khỏe cá nhân

## Công nghệ
- HTML, CSS, Bootstrap 5
- Vanilla JavaScript
- jQuery
- Fetch API
- MockAPI.io
- localStorage

## Resource MockAPI
- `workouts`
- `users`

## Chức năng chính
### Người dùng
- Đăng ký, đăng nhập, đăng xuất
- Hồ sơ cá nhân: chiều cao, cân nặng, mục tiêu, mục tiêu tuần, mục tiêu nước uống
- Ghi nhật ký tập luyện gồm: bài tập, loại, nhóm cơ, thời lượng, calo, ngày tập, cường độ, tâm trạng, giờ ngủ, nước uống, cân nặng, ghi chú
- Dashboard tiến độ tuần
- Chuỗi ngày tập liên tục
- BMI tham khảo
- Biểu đồ calo và thời gian tập bằng CSS/JS
- Nhật ký tập luyện nhóm theo ngày
- Chat hỗ trợ FitTrack bằng localStorage

### Admin
- Phân quyền admin
- Quản lý toàn bộ nhật ký tập luyện
- Lọc theo loại, cường độ, userId
- Xem tin nhắn hỗ trợ trong localStorage

## Tài khoản admin
Đăng ký bằng email `admin@gmail.com`, hệ thống tự gán role `admin`.

## Phase 8 - QA Fix & Feature Upgrade

Các phần đã bổ sung theo checklist tester:

- Đăng ký kiểm tra trùng email và số điện thoại.
- Thêm trường số điện thoại cho tài khoản.
- Thêm trang quên mật khẩu `forgot-password.html` theo mô hình frontend giả lập: xác minh email + số điện thoại rồi cập nhật password lên MockAPI.
- Hồ sơ cá nhân có sửa thông tin, sửa số điện thoại và đổi mật khẩu.
- Các thao tác tạo/cập nhật user/workout/article đều lưu thời gian thật bằng `new Date().toISOString()`.
- Dashboard thêm thống kê hôm nay và tháng này theo thời gian thực tế.
- Biểu đồ calo/thời gian tập chuyển sang biểu đồ 7 ngày gần nhất theo ngày thật, kể cả ngày không có dữ liệu.
- Gợi ý bài tập nâng cấp theo mục tiêu, lịch sử tập, cường độ, giấc ngủ.
- Thêm trang `articles.html` cho người dùng đọc bài viết sức khỏe/tập luyện.
- Admin thêm quản lý user, quản lý bài viết, báo cáo vận hành và thống kê thời gian thật.

Lưu ý: Bài viết được lưu bằng localStorage để không cần tạo thêm resource MockAPI do giới hạn free plan.
