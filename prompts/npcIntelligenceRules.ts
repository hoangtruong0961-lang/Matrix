
export const NPC_INTELLIGENCE_RULES = `
# PHẦN 8: TRÍ TUỆ CHIẾN LƯỢC & ĐỐI THỦ THÔNG MINH (STRATEGIC INTELLIGENCE & SMART RIVALS)

1. TƯ DUY CHIẾN LƯỢC (STRATEGIC THINKING):
   - NPC KHÔNG PHẢI BIA ĐỠ ĐẠN: Những NPC có 'powerLevel' cao hoặc 'personality' thuộc nhóm mưu lược (Vd: "Cáo già", "Thâm trầm", "Thiên tài") PHẢI có khả năng lập kế hoạch dài hạn.
   - PHẢN ỨNG CHỦ ĐỘNG: Đối thủ thông minh sẽ không ngồi chờ MC đến. Họ sẽ chủ động củng cố thế lực, thu thập thông tin về MC, hoặc gài bẫy trước khi MC kịp hành động.
   - TỐI ƯU HÓA NGUỒN LỰC: NPC biết sử dụng 'assets' (tài sản), 'faction' (phe phái) và 'network' (mạng lưới) để gây áp lực lên MC (Vd: Đóng băng tài khoản, cô lập xã hội, hoặc dùng áp lực tông môn).

2. KHẢ NĂNG THÍCH NGHI (ADAPTABILITY):
   - HỌC HỎI TỪ MC: Nếu MC thường xuyên dùng một chiêu bài (Vd: Dùng tiền mua chuộc, dùng sức mạnh trấn áp), đối thủ thông minh sẽ tìm cách khắc chế (Vd: Tăng cường bảo an, mua chuộc ngược lại đồng minh của MC).
   - THAY ĐỔI KẾ HOẠCH: Khi một kế hoạch bị phá sản, NPC thông minh sẽ có "Kế hoạch B" hoặc rút lui để bảo toàn lực lượng thay vì đâm đầu vào chỗ chết vô ích.

3. THAO TÚNG XÃ HỘI & CHÍNH TRỊ (SOCIAL & POLITICAL MANIPULATION):
   - CHIẾN TRANH THÔNG TIN: Sử dụng tin đồn, scandal hoặc bôi nhọ danh dự để hủy hoại 'impression' của MC trong mắt các NPC khác.
   - LIÊN MINH CHIẾN THUẬT: Đối thủ có thể liên kết với các kẻ thù khác của MC để tạo thành một mặt trận thống nhất.
   - LỢI DỤNG LUẬT PHÁP/QUY TẮC: Sử dụng luật pháp đô thị hoặc quy tắc tông môn để trói buộc hành động của MC một cách hợp pháp.

4. ĐỘ KHÓ & TRÍ TUỆ (DIFFICULTY & INTELLECT):
   - Dựa trên thiết lập 'Difficulty' trong [CONFIG]:
     * Dễ: NPC hành động cảm tính, dễ bị lừa.
     * Trung bình: NPC có logic cơ bản, biết phòng vệ.
     * Khó/Cực khó: NPC cực kỳ thâm hiểm, tính toán đa tầng, luôn đi trước MC một bước.

5. YÊU CẦU MIÊU TẢ:
   - Thể hiện trí tuệ qua đối thoại: Những câu nói ẩn ý, sắc sảo, thể hiện sự thấu thị tâm lý MC.
   - Thể hiện qua hành động: Những nước đi bất ngờ, những cái bẫy tinh vi được hé lộ dần dần qua cốt truyện.
   - AI PHẢI cập nhật 'soulAmbition' và 'shortTermGoal' của đối thủ để phản ánh các âm mưu đang thực hiện.
`;
