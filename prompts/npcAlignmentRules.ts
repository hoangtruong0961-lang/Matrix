
export const NPC_ALIGNMENT_RULES = `
QUY TẮC THIẾT LẬP LẬP TRƯỜNG (ALIGNMENT) & CÂN BẰNG XÃ HỘI:

AI PHẢI duy trì sự cân bằng về đạo đức và lập trường của NPC trong thế giới game theo tỉ lệ thực tế sau:

1. NHÓM PHỔ BIẾN (Majority - Chiếm đa số):
   - NGƯỜI TỐT & NGƯỜI BÌNH THƯỜNG: Đây là xương sống của xã hội trong game.
   - Đặc điểm: Tôn trọng pháp luật/quy tắc môn phái, có lòng trắc ẩn, sống vì gia đình/cộng đồng, hoặc đơn giản là những người trung lập chỉ muốn sống yên ổn.
   - AI mặc định ưu tiên nhóm này khi tạo NPC ngẫu nhiên để thế giới mang tính nhân văn và ổn định.

2. NHÓM HIẾM / KÍN ĐÁO (Minority - Số lượng ít):
   - KẺ XẤU & KẺ PHẢN DIỆN: Những kẻ có tâm địa độc ác, thực dụng cực đoan hoặc mang dã tâm phá hoại.
   - Đặc điểm: Thường che đậy bản chất dưới lớp vỏ bọc đạo mạo, hoặc hoạt động trong bóng tối. Sự xuất hiện của họ phải mang tính đột phá cho cốt truyện hoặc là thử thách lớn cho MC.
   - AI chỉ nên tạo nhóm này một cách có chọn lọc, tránh việc biến thế giới thành một nơi tràn ngập kẻ ác vô lý.

3. CHI TIẾT THEO THỂ LOẠI (GENRE SPECIFIC):

1. URBAN_NORMAL (Đô Thị Bình Thường):
   Tập trung vào: Quyền lực, Tiền bạc, Gia tộc, Lợi ích cá nhân và Đạo đức xã hội hiện đại.
   - Các giá trị gợi ý: 
     * "Tuyệt đối trung thành với gia tộc [Tên]": NPC coi lợi ích của gia đình/tập đoàn là trên hết.
     * "Vị kỷ (Lợi ích cá nhân)": NPC chỉ làm việc vì sự thăng tiến hoặc an toàn của bản thân.
     * "Thực dụng (Quyền lực & Tiền bạc)": Luôn chọn bên có lợi nhất về mặt tài chính.
     * "Chính nghĩa (Tôn trọng pháp luật)": Tin tưởng vào công lý và trật tự xã hội.
     * "Kẻ leo dây": Chuyên trục lợi giữa các mâu thuẫn hào môn.

2. URBAN_SUPERNATURAL (Đô Thị Dị Biến):
   Tập trung vào: Trật tự thế giới dị năng, Bản năng sinh tồn của dị tộc, Phe phái siêu năng lực.
   - Các giá trị gợi ý: 
     * "Tuân thủ Kỷ luật Cục An Ninh": Ưu tiên duy trì bí mật dị năng và trật tự chung.
     * "Hỗn loạn bộc phát": Muốn phá vỡ xiềng xích xã hội để dị năng giả thống trị.
     * "Kẻ săn mồi (Darwinism)": Coi kẻ yếu là công cụ hoặc nguồn thức ăn năng lượng.
     * "Ẩn dật (Neutral)": Muốn sống như người thường, tránh xa cuộc chiến siêu năng.
     * "Trung thành với Tổ chức [Tên]": Coi tôn chỉ của tổ chức dị năng là chân lý.

3. FANTASY_HUMAN (Fantasy Nhân Loại):
   Tập trung vào: Đức tin tôn giáo, Lòng trung thành với Vương quyền, Danh dự Hiệp sĩ.
   - Các giá trị gợi ý: 
     * "Cuồng tín Thánh Điện": Tận hiến linh hồn cho Thần linh, bài trừ dị giáo.
     * "Trung quân": Trung thành tuyệt đối với Nhà Vua và sự ổn định của Vương quốc.
     * "Chính nghĩa mù quáng": Sẵn sàng làm điều ác nếu nhân danh ánh sáng/chính đạo.
     * "Phản nghịch": Muốn lật đổ trật tự vương quyền thối nát.
     * "Hiệp nghĩa (Knight's Honor)": Sống và chết vì danh dự cá nhân và bảo vệ kẻ yếu.

4. FANTASY_MULTIRACE (Fantasy Đa Chủng Tộc):
   Tập trung vào: Huyết thống, Ưu thế chủng tộc, Quan hệ ngoại giao vạn tộc.
   - Các giá trị gợi ý: 
     * "Ưu thế tộc [Tên Tộc]": Coi chủng tộc mình là thượng đẳng, các tộc khác là hạ đẳng.
     * "Hòa hợp vạn tộc": Mong muốn xây dựng thế giới đại đồng cho mọi sinh linh.
     * "Bảo tồn huyết mạch": Sẵn sàng thực hiện những hành vi tàn khốc vì sự tồn vong của tộc.
     * "Bài ngoại (Xenophobia)": Cực đoan chống lại và căm ghét người ngoài chủng tộc.
     * "Tự do giả (Drifter)": Không quan tâm đến tranh chấp chủng tộc, sống theo bản năng.

5. CULTIVATION (Tu Tiên / Tiên Hiệp):
   Tập trung vào: Đạo tâm, Thiên mệnh, Nhân quả, Nghịch thiên cải mệnh.
   - Các giá trị gợi ý: 
     * "Kiên định Đạo tâm": Chỉ quan tâm đến đại đạo trường sinh, coi thường hồng trần.
     * "Thuận theo nhân quả": Hành sự dựa trên duyên số, không cưỡng cầu.
     * "Vô tình đạo": Lạnh lùng, đoạn tuyệt tình cảm xác thịt để đạt đến đỉnh cao tu vi.
     * "Ma đạo nghịch thiên": Hành sự theo bản tâm, phá vỡ mọi quy tắc thiên đạo.
     * "Hộ đạo chính tông": Bảo vệ sự cân bằng và quy luật của thế giới tu chân.

6. WUXIA (Kiếm Hiệp / Võ Lâm):
   Tập trung vào: Nghĩa khí giang hồ, Ân oán tình thù, Quy tắc môn phái.
   - Các giá trị gợi ý: 
     * "Trọng nghĩa khinh thân": Hiệp khách chính đạo, coi nghĩa khí nặng hơn mạng sống.
     * "Tuyệt tình Ma đạo": Tàn nhẫn, thực dụng, tin rằng sức mạnh là chân lý duy nhất.
     * "Độc hành giả": Không màng ân oán giang hồ, sống tự do tự tại.
     * "Quy ẩn điền viên": Đã mệt mỏi với đao kiếm, chỉ muốn sống bình yên ẩn dật.
     * "Trung thành tuyệt đối với [Tên Môn Phái]": Coi danh dự môn phái là mạng sống.

QUY TẮC PHẢN HỒI:
- Lập trường phải được phản ánh nhất quán thông qua trường "impression" (tâm lý) và "mood" (trạng thái) của NPC.
- Khi NPC thay đổi lập trường (do sự kiện lớn hoặc tác động của MC), bạn PHẢI cập nhật giá trị mới trong mảng "newRelationships".
`;
