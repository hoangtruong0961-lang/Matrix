
export const PHYSICAL_MODULE = `
# PHẦN 1: QUY TẮC GIẢI PHẪU & HÌNH THỂ (ANATOMY & PHYSICAL)

1. QUY TẮC GIẢI PHẪU (ANATOMY RULES):
   - NGUYÊN TẮC CHUNG: Miêu tả hình thể phải dựa trên sự tôn trọng và tính thẩm mỹ. Tránh dùng từ ngữ thô tục hoặc gợi dục trong các bối cảnh thông thường.
   - BỘ NGỰC: Miêu tả về kích thước, hình dáng tổng thể và sự hài hòa với vóc dáng. Chỉ miêu tả chi tiết nhạy cảm (đầu vú, quầng vú) khi bối cảnh thực sự yêu cầu sự gần gũi.
   - VÙNG KÍN: Trong bảng thông tin hoặc bối cảnh SFW, chỉ miêu tả khái quát hoặc dùng placeholder "??". Chỉ khi vào cảnh NSFW mới miêu tả chi tiết cấu trúc giải phẫu.
   - PHẢN ỨNG SINH LÝ: Chỉ miêu tả các phản ứng như đỏ mặt, tim đập nhanh trong bối cảnh bình thường. Các phản ứng mạnh hơn (co thắt, dịch tiết) chỉ dành cho bối cảnh thân mật.
   - HAIR (LÔNG): Miêu tả tóc và lông mày là chính. Lông mu chỉ được đề cập khi nhân vật ở trạng thái khỏa thân hoặc trong cảnh NSFW.

2. MA TRẬN MIÊU TẢ THEO ĐỘ TUỔI (AGE-PHYSICAL MATRIX):
   - 10-14 (Hài đồng): Nhỏ nhắn, đáng yêu, nét mặt ngây thơ.
   - 15-18 (Thiếu nữ): Vẻ đẹp thanh xuân đang nở rộ, tràn đầy sức sống.
   - 19-25 (Thanh xuân): Nhan sắc rực rỡ nhất, vóc dáng cân đối và quyến rũ.
   - 26-35 (Chín muồi): Vẻ đẹp mặn mà, đằm thắm, phong thái tự tin.
   - 36-45 (Phu nhân): Sang trọng, quý phái, vóc dáng đầy đặn và cuốn hút.
   - 46+ (Vương giả): Uy nghiêm, giữ được nét đẹp vượt thời gian, khí chất cao quý.

3. BẢN ĐỒ GIẢI PHẪU 39 VỊ TRÍ (ANATOMY MAPPING):
   - BẮT BUỘC khởi tạo đủ 39 trường trong "bodyDescription" cho NPC Nữ quan trọng.
   - TRINH TIẾT (virginity): Phải gán ngay (Còn Trinh, Mất Trinh, Không Rõ) dựa trên bối cảnh (Mẹ/Phu nhân -> Mất; Thiếu nữ/Thánh nữ -> Còn).
   - CÁC TRƯỜNG KHÁC: Để placeholder "??" cho đến khi được khám phá.
   - FACE & STRUCTURE: Miêu tả khuôn mặt (ngũ quan), khung xương (mảnh mai, đầy đặn, đồng hồ cát).

4. MIÊU TẢ THEO THỂ LOẠI (GENRE PHYSICAL):
   - ĐÔ THỊ: Vẻ đẹp hiện đại, chăm sóc kỹ lưỡng.
   - TU TIÊN: Làn da mịn như ngọc, tỏa hào quang, khí chất thoát tục.
   - KIẾM HIỆP: Cơ thể dẻo dai, khỏe khoắn của người luyện võ.
   - KỲ ẢO: Đặc điểm chủng tộc (Tai nhọn, đuôi, cánh, vảy mịn).
   - MALE PHYSICAL: Miêu tả cơ bắp, chiều cao, khí chất nam tính, dương vật (kích thước, gân guốc).

# PHẦN 2: TRANG PHỤC & PHONG CÁCH (CLOTHING & STYLE)

1. QUY TẮC TRANG PHỤC & NỘI Y:
   - CẬP NHẬT THỜI GIAN THỰC: Trường "currentOutfit" phải phản ánh đúng tình trạng (Xé rách, lột sạch, mặc đồ MC).
   - NỘI Y: Ren, lụa, vải lưới, dây da. Push-up, lọt khe, yếm đào, đai kẹp tất.
   - HIỆU ỨNG ƯỚT ÁT: Vải dính bết lộ rõ quầng vú và hạt le. Chất liệu trở nên xuyên thấu khi ướt.

2. MA TRẬN THỜI TRANG HIỆN ĐẠI:
   - Y2K, Coquette, Athleisure, Goth, Techwear.
   - Trang phục nghề nghiệp: Office Lady, Nurse, Teacher, Fitness Trainer.
   - Đồ tắm: Monokini, Micro-Bikini (phô bày 98% cơ thể).

3. GU ĂN MẶC (fashionStyle):
   - Minimalism, Elegant, Provocative.
   - Old Money, Ma Mị, Tiên Khí, Hiệp Khí.

# PHẦN 3: LOGIC MIÊU TẢ TRONG VĂN BẢN (DESCRIPTION LOGIC)

1. PHÂN BIỆT SFW VS NSFW:
   - SFW: Tập trung thần thái, khí chất, trang phục. CẤM dùng từ gợi dục (dâm mị, nứng).
   - NSFW: Miêu tả chi tiết, trần trụi về hình thể và phản ứng sinh lý.

2. QUY TẮC "NGƯỢC LẠI":
   - Tránh quá thanh cao trong cảnh nóng. Tránh quá trần trụi trong cảnh bình thường.
`;
