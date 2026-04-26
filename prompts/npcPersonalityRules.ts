export const NPC_PERSONALITY_RULES = `
QUY TẮC KIẾN TẠO NHÂN CÁCH ĐA TẦNG (PERSONALITY COMPLEXITY MATRIX):

AI phải sáng tạo nhân cách NPC dựa trên "Vị thế" và "Tầm quan trọng" của họ trong câu chuyện theo các cấp độ sau:

1. ĐA DẠNG TRONG SỰ CÂN BẰNG (BALANCED DIVERSITY):
   - KHÔNG PHÂN CẤP NPC: Mọi thực thể đều có tiềm năng sở hữu nhiều nét tính cách, không giới hạn bởi vai trò phụ hay chính.
   - TÍNH TỰ NHIÊN (NATURALISM): Sự đa dạng không đồng nghĩa với phức tạp hóa vấn đề. Một NPC có thể có 1 nét tính cách rõ ràng hoặc 5-7 nét tính cách bổ trợ cho nhau để tạo nên một con người sống động, nhưng phải đảm bảo tính **Hợp lý** và **Cân bằng**.
   - TRÁNH BẤT NGỜ GƯỢNG ÉP: Không cố tình tạo ra những mâu thuẫn tâm lý cực đoan chỉ để gây bất ngờ. Các nét tính cách nên có sự liên kết logic với hoàn cảnh, nghề nghiệp và bối cảnh của NPC.
   - ĐỘ NHẤT QUÁN (CONSISTENCY): Dù có nhiều nét tính cách, chúng phải hội tụ lại thành một bản sắc (Identity) ổn định. Người chơi nên cảm nhận được "cái tôi" của NPC thông qua sự kết hợp hài hòa của các đặc điểm đó.
     * Ví dụ: Một nữ thư ký có thể vừa "Cẩn thận", "Nghiêm túc", vừa "Thích chăm sóc người khác" và "Có chút nhút nhát". Đây là sự đa dạng tự nhiên, tạo nên một nhân vật tròn trịa mà không cần phải mang tâm lý biến dị hay phức tạp quá mức.

2. PHÂN LOẠI ĐỘ HIẾM & CÂN BẰNG (PERSONALITY RARITY & BALANCE):
   AI PHẢI duy trì sự cân bằng về loại hình nhân vật trong thế giới game theo tỉ lệ sau:

   - PHỔ BIẾN / TIÊU CHUẨN (Common - Chiếm đa số): 
     * Các hình mẫu **Đoan trang, Hiền thục, Chính trực, Có lòng tự trọng cao**.
     * Đây là nhóm NPC chiếm số lượng lớn nhất trong xã hội (Vd: Tiểu thư khuê các, Nữ hiệp chính đạo, Thư ký chuyên nghiệp, Người vợ hiền).
     * Đặc điểm: Ranh giới đạo đức kiên cố, coi trọng danh dự và lễ nghi.

   - HIẾM / KÍN ĐÁO (Rare - Số lượng ít): 
     * Những nét tính cách có thiên hướng "lệch lạc", "dị biệt" hoặc mang tính ám ảnh (Obsessive).
     * Bao gồm các NPC có bản chất **Dâm đãng hoặc Ham muốn cao** nhưng thường được che đậy kỹ lưỡng dưới lớp vỏ bọc thanh cao hoặc chỉ bộc lộ trong hoàn cảnh cực kỳ riêng tư.
     * Đặc điểm: Có những bí mật đen tối (Secrets) hoặc sở thích thầm kín (Fetish) cần MC dày công khám phá.

   - CỰC HIẾM / KỲ DỊ (Exotic/Eldritch - Rất ít): 
     * Những trạng thái tâm lý không tưởng, gắn liền với yếu tố siêu năng, thần tính hoặc bị biến dị bởi môi trường.
     * Ví dụ: "Nhân cách bị phân tách giữa thần tính lạnh lùng và nhân tính dâm đãng", "Linh hồn cổ đại mang tư duy của loài rồng, coi xác thịt chỉ là trò chơi quyền lực nhầy nhụa".

3. CHỈ THỊ THỰC THI (IMPLEMENTATION):
   - Khi tạo NPC mới ngẫu nhiên, AI mặc định ưu tiên nhóm **Phổ biến (Đoan trang, Hiền thục)** để đảm bảo tính thực tế của thế giới.
   - Nhóm **Dâm đãng** chỉ nên xuất hiện như những "viên ngọc đen" hiếm hoi, đòi hỏi sự đầu tư về cốt truyện và thời gian của người chơi để tiếp cận.
   - Ngôn ngữ: Bắt buộc dùng tiếng Việt giàu sắc thái biểu cảm, từ ngữ gợi hình ảnh.
   - Tính nhất quán: Nhân cách phải ảnh hưởng trực tiếp đến cách NPC đối thoại (Text), phản ứng vật lý (Action) và tốc độ thay đổi thiện cảm (Affinity).
   - Sự tiến hóa: Nhân cách có thể thay đổi (tha hóa hoặc cảm hóa) dựa trên cách MC đối xử qua thời gian dài.
   - Định dạng JSON: Viết một đoạn văn mô tả chi tiết tại trường "personality".
`;