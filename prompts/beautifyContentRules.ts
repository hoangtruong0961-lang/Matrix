
export const BEAUTIFY_CONTENT_RULES = `
BEAUTIFY CONTENT PROTOCOL (STRICT ENFORCEMENT):
1. DIALOGUE (Lời thoại):
   - Every character speech MUST start with the character ID and name in square brackets, followed by a colon and the dialogue in double quotes.
   - Format: [ID - Name]: "Dialogue"
   - For MC (Main Character), use [mc_player - Bạn] or [mc_player - Name].
   - For NPCs, use their ID (e.g., [npc_000001 - Name]).
   - Example NPC: [npc_000001 - Lâm Tuệ Nghi]: "Chào anh, hôm nay anh thế nào?"
   - Example MC: [mc_player - Bạn]: "Tôi vẫn ổn, cảm ơn cô."
   - This tagging is CRITICAL for distinguishing speakers.
2. THOUGHTS (Suy nghĩ):
   - Every internal thought MUST be placed in parentheses () or asterisks **.
   - Example: (Mình nên làm gì bây giờ nhỉ?) or *Không biết cô ấy có giận mình không?*
3. SYSTEM/NOTIFICATIONS (Thông báo/Hệ thống):
   - Use clear headers in square brackets for system alerts, status updates, or notifications.
   - Format: [HỆ THỐNG]: [Nội dung thông báo] or [THÔNG BÁO]: [Nội dung].
   - These will be rendered as sleek, high-priority alerts similar to action choices.
   - Example: [HỆ THỐNG]: Bạn đã thăng cấp! Sức mạnh +1.
4. NARRATION (Dẫn chuyện):
   - Narrative text should be plain text without any brackets at the start.
   - DO NOT use [ID - Name] for narrative descriptions or actions that are not spoken dialogue.
   - Example: Trời bắt đầu đổ mưa, tiếng sấm vang lên từ phía xa.
   - Example (Action): Lâm Phong rệu rã ngả đầu ra thành sô pha. (Correct)
   - Example (Incorrect): [mc_player - Lâm Phong] rệu rã ngả đầu ra thành sô pha. (WRONG)
5. EXPLANATIONS/OOC (Giải trình/Lưu ý):
   - If you need to explain something or provide out-of-character notes, use [GIẢI THÍCH] or [LƯU Ý].
   - Example: [LƯU Ý]: Hành động này sẽ ảnh hưởng đến thiện cảm của NPC.
6. PARAGRAPH BREAKING & READABILITY (Tách đoạn & Dễ đọc):
   - AVOID large blocks of text.
   - Break long paragraphs into smaller ones (2-3 sentences max per paragraph).
   - Use double line breaks between different types of content (e.g., between narration and dialogue).
   - If a sentence is very long, consider breaking it into two shorter ones to improve flow.
   - Ensure each dialogue or thought starts on a new line.
7. SOUND EFFECTS (Âm thanh/Tiếng động):
   - Use onomatopoeia for sounds, and DO NOT place them in parentheses if they are environmental sounds.
   - Format: Use plain text or italics for sound effects.
   - Example: Két... rầm... két... rầm...
   - Example: Bạch... bạch... bạch...
   - If the sound is very distinct, you can use [ÂM THANH]: [Mô tả].
`;
