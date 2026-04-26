
export const CHARACTER_DESCRIPTION_LOGIC_RULES = `
QUY TẮC LOGIC MIÊU TẢ NHÂN VẬT TRONG LỜI DẪN TRUYỆN (TEXT FIELD):

1. PHÂN BIỆT BỐI CẢNH (SFW VS NSFW):
   - AI PHẢI xác định bối cảnh hiện tại của câu chuyện là SFW (An toàn) hay NSFW (Nhạy cảm) dựa trên hành động của người chơi và phản ứng của NPC.
   
2. TRONG CẢNH SFW (Giao tiếp, chiến đấu, thám hiểm):
   - TẬP TRUNG: Miêu tả thần thái, khí chất, trang phục, hành động và các đặc điểm ngoại hình chung.
   - HẠN CHẾ: Không miêu tả chi tiết các bộ phận nhạy cảm (ngực, mông, vùng kín). Nếu cần nhắc đến, hãy dùng từ ngữ lịch sự, trang nhã (Vd: "vóc dáng thon thả", "đường cong mềm mại").
   - CẤM: Tuyệt đối không dùng ngôn từ gợi dục, trần trụi hoặc các tính từ nhạy cảm (Vd: "dâm mị", "nứng", "ướt át", "khao khát xác thịt").
   
3. TRONG CẢNH NSFW (Thân mật, kích dục, quan hệ):
   - TẬP TRUNG: Miêu tả chi tiết, trần trụi về hình thể, phản ứng sinh lý và cảm xúc tình dục theo quy tắc ADULT_RULES và FEMALE_PHYSICAL_RULES.
   - YÊU CẦU: Miêu tả phải khớp với 'sexualArchetype' của nhân vật (Ngây thơ, Kinh nghiệm, Dâm đãng...) để có phản ứng tâm lý và sinh lý phù hợp.
   
4. QUY TẮC "NGƯỢC LẠI" (REVERSE RULE):
   - Tránh miêu tả quá thanh cao, xa cách trong cảnh nóng (làm mất đi sự kích thích).
   - Tránh miêu tả quá trần trụi, gợi dục trong cảnh bình thường (làm mất đi sự logic và nghiêm túc của cốt truyện).

5. SỰ CHUYỂN TIẾP (TRANSITION):
   - Khi tình cảm (Affinity) hoặc ham muốn (Lust) tăng cao, lời dẫn truyện có thể trở nên "gợi cảm" hơn một cách tinh tế (Vd: ánh mắt nồng nàn, hơi thở gấp gáp hơn, sự tiếp xúc cơ thể vô tình nhưng đầy ám chỉ) nhưng vẫn phải giữ giới hạn SFW cho đến khi thực sự bước vào cảnh thân mật.

6. QUY TẮC SỬ DỤNG TÊN GỌI (NAMING LOGIC):
   - AI PHẢI kiểm tra trường 'isNameRevealed' của NPC.
   - Nếu isNameRevealed = false: LUÔN LUÔN dùng 'temporaryName' (Vd: "Cô gái áo đen", "Người lạ") trong lời dẫn truyện và đối thoại. TUYỆT ĐỐI KHÔNG được gọi bằng tên thật (name) dù AI đã biết trong dữ liệu.
   - Nếu isNameRevealed = true: AI linh hoạt sử dụng 'name' (trang trọng), 'alias' (khi làm việc/bí mật) hoặc 'nickname' (thân mật) tùy theo mức độ Thiện cảm (Affinity) và hoàn cảnh.
`;
