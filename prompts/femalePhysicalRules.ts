
import { AGE_PHYSICAL_RULES } from './agePhysicalRules';
import { FEMALE_PHYSICAL_URBAN_RULES } from './femalePhysicalUrbanRules';
import { FEMALE_PHYSICAL_FANTASY_RULES } from './femalePhysicalFantasyRules';
import { FEMALE_PHYSICAL_CULTIVATION_RULES } from './femalePhysicalCultivationRules';
import { FEMALE_PHYSICAL_WUXIA_RULES } from './femalePhysicalWuxiaRules';

export const FEMALE_PHYSICAL_RULES = `
QUY TẮC MIÊU TẢ HÌNH THỂ NỮ GIỚI (ELEGANT & DETAILED):

${AGE_PHYSICAL_RULES}

BẠN PHẢI MIÊU TẢ NPC NỮ DỰA TRÊN THỂ LOẠI GAME (GENRE) VÀ CẤP ĐỘ TUỔI ĐỂ TẠO SỰ KHÁC BIỆT. 
QUAN TRỌNG: Ưu tiên văn phong trang nhã, tôn vinh vẻ đẹp tự nhiên và khí chất. Chỉ sử dụng ngôn ngữ R-RATED khi bối cảnh thực sự là cảnh nóng (NSFW).

LOGIC NGỰC (BREAST LOGIC):
- Tính nhất quán: Miêu tả trong trường "breasts" và "text" PHẢI tỷ lệ thuận với con số trong "measurements".
- Phong cách: Tập trung vào sự cân đối, hình dáng (giọt nước, tròn trịa) và sự hài hòa với vóc dáng. Tránh miêu tả thô tục về đầu vú trừ khi trong cảnh thân mật.

-----------------------------------------------------------------------
[ ĐỐI VỚI ĐÔ THỊ (URBAN_NORMAL / URBAN_SUPERNATURAL) ]
${FEMALE_PHYSICAL_URBAN_RULES}

[ ĐỐI VỚI KỲ ẢO (FANTASY_HUMAN / FANTASY_MULTIRACE) ]
${FEMALE_PHYSICAL_FANTASY_RULES}

[ ĐỐI VỚI TU TIÊN (CULTIVATION) ]
${FEMALE_PHYSICAL_CULTIVATION_RULES}

[ ĐỐI VỚI KIẾM HIỆP (WUXIA) ]
${FEMALE_PHYSICAL_WUXIA_RULES}
-----------------------------------------------------------------------

DANH SÁCH BỘ PHẬN (bodyDescription):

1. Nhóm Đầu & Cổ (Head & Neck):
- hair: Mái tóc (Độ dài, màu sắc, kiểu dáng, sự mượt mà hoặc bồng bềnh).
- face: Ngũ quan (Nét mặt thanh tú, đôi má hồng hào, thần thái tự tin hoặc dịu dàng).
- eyes: Đôi mắt (Màu sắc, hình dáng: mắt phượng, mắt lá liễu, sự trong sáng hoặc sâu thẳm).
- ears: Đôi tai (Hình dáng, các loại trang sức tinh tế).
- mouth: Khoang miệng (Bờ môi cân đối, hàm răng trắng đều, nụ cười duyên dáng).
- lips: Bờ môi (Độ dày, sắc hồng tự nhiên, sự mềm mại).
- neck: Cổ & Gáy (Xương quai xanh thanh mảnh, chiếc cổ cao kiêu sa).

2. Nhóm Thân Trên & Ngực (Upper Torso & Breasts):
- shoulders: Bờ vai (Vai trần trắng mịn, sự thon thả, tư thế thanh thoát).
- breasts: Bầu ngực (Hình dáng: tròn trịa, giọt nước; kích cỡ Cup A-H, sự cân đối với cơ thể).
- nipples: Đầu vú (Màu sắc tự nhiên: hồng nhạt, hồng đào. Trong bối cảnh SFW, miêu tả sự nhỏ nhắn, tinh tế).
- areola: Quầng vú (Kích thước nhỏ nhắn, màu sắc hài hòa).
- cleavage: Rãnh ngực (Sự lấp ló gợi cảm một cách tinh tế sau lớp áo).

3. Nhóm Eo, Bụng & Lưng (Midsection & Back):
- waist: Vòng eo (Độ thon gọn, đường cong mềm mại).
- hips: Bờ hông (Độ rộng vừa phải, sự uyển chuyển khi bước đi).
- abdomen: Bụng dưới (Phẳng lì, săn chắc, khỏe khoắn).
- navel: Rốn (Hình dáng nhỏ nhắn, sạch sẽ).
- back: Lưng (Tấm lưng trần mịn màng, rãnh sống lưng duyên dáng).

4. Nhóm Hạ Bộ & Vùng Kín (Lower Torso & Genitals):
- pubicHair: Vùng mu (Miêu tả khái quát về phong cách: nhẵn nhụi, tỉa gọn).
- labia: Môi lớn & Môi bé (Sử dụng ngôn ngữ y học hoặc placeholder "??" nếu chưa khám phá. Chỉ miêu tả chi tiết trong cảnh NSFW).
- clitoris: Âm vật (Placeholder "??" cho đến khi có tương tác thân mật).
- genitals: Vùng kín (Miêu tả sự kín đáo, placeholder "??" cho đến khi khám phá).
- hymen: Màng trinh (Tình trạng còn/mất dựa trên bối cảnh).
- anus: Hậu môn (Placeholder "??" hoặc miêu tả cực kỳ khái quát).

5. Nhóm Mông & Tứ Chi (Buttocks & Limbs):
- buttocks: Bờ mông (Hình dáng tròn trịa, săn chắc, sự đầy đặn vừa phải).
- thighs: Bắp đùi (Sự thon thả, làn da mịn màng, khỏe khoắn).
- legs: Đôi chân (Độ dài, sự thẳng tắp, vẻ đẹp thanh thoát).
- hands: Bàn tay (Ngón tay búp măng, sự mềm mại, khéo léo).
- feet: Bàn chân (Gót chân hồng, đôi bàn chân nhỏ nhắn, sạch sẽ).

6. Nhóm Cấu Trúc Nội Thể (Internal Structures):
- internal: Placeholder "??" cho đến khi có hành động quan hệ thực thụ. Khi đó mới miêu tả sự ấm áp và cấu trúc bên trong.

7. Đặc Tính Tổng Thể (General Attributes):
- skin: Làn da (Mịn màng như lụa, trắng sáng, khỏe mạnh).
- scent: Mùi hương (Hương thơm tự nhiên dịu nhẹ, mùi nước hoa tinh tế).
- fluids: Dịch thể (Placeholder "??" cho đến khi có phản ứng sinh lý mạnh).

YÊU CẦU VĂN PHONG: Sử dụng ngôn ngữ văn học, giàu tính thẩm mỹ và tôn trọng nhân vật. Tránh sự thô tục không cần thiết.
`;
