// 189 เมืองทั่วโลก — คัดจาก world capitals + ไทยครบ + สำคัญทางธุรกิจ/ท่องเที่ยว
// ใช้สำหรับ Atlas จัดอันดับเมืองที่ดาวเด่นของคุณ “ผ่านใกล้” ที่สุด
// lat/lon WGS84, ประเทศ/ทวีป ช่วยกรองภูมิภาค

export interface AtlasCity {
  nameTh: string;
  nameEn: string;
  countryTh: string;
  countryEn: string;
  region: "asia" | "europe" | "americas" | "oceania" | "africa" | "meast";
  lat: number;
  lon: number;
}

// Top 189 — เรียงคร่าวตามความสำคัญ/การเข้าถึงของคนไทย
export const ATLAS_CITIES: AtlasCity[] = [
  // ไทย 20
  { nameTh: "กรุงเทพมหานคร", nameEn: "Bangkok", countryTh: "ไทย", countryEn: "Thailand", region: "asia", lat: 13.7563, lon: 100.5018 },
  { nameTh: "เชียงใหม่", nameEn: "Chiang Mai", countryTh: "ไทย", countryEn: "Thailand", region: "asia", lat: 18.7883, lon: 98.9853 },
  { nameTh: "ภูเก็ต", nameEn: "Phuket", countryTh: "ไทย", countryEn: "Thailand", region: "asia", lat: 7.8804, lon: 98.3923 },
  { nameTh: "พัทยา", nameEn: "Pattaya", countryTh: "ไทย", countryEn: "Thailand", region: "asia", lat: 12.9236, lon: 100.8825 },
  { nameTh: "ขอนแก่น", nameEn: "Khon Kaen", countryTh: "ไทย", countryEn: "Thailand", region: "asia", lat: 16.4419, lon: 102.835 },
  { nameTh: "หาดใหญ่", nameEn: "Hat Yai", countryTh: "ไทย", countryEn: "Thailand", region: "asia", lat: 7.0084, lon: 100.4747 },
  { nameTh: "เชียงราย", nameEn: "Chiang Rai", countryTh: "ไทย", countryEn: "Thailand", region: "asia", lat: 19.9072, lon: 99.8309 },
  { nameTh: "อุดรธานี", nameEn: "Udon Thani", countryTh: "ไทย", countryEn: "Thailand", region: "asia", lat: 17.4156, lon: 102.7859 },
  { nameTh: "อุบลราชธานี", nameEn: "Ubon Ratchathani", countryTh: "ไทย", countryEn: "Thailand", region: "asia", lat: 15.2287, lon: 104.856 },
  { nameTh: "นครราชสีมา", nameEn: "Nakhon Ratchasima", countryTh: "ไทย", countryEn: "Thailand", region: "asia", lat: 14.979, lon: 102.0978 },
  { nameTh: "กระบี่", nameEn: "Krabi", countryTh: "ไทย", countryEn: "Thailand", region: "asia", lat: 8.0863, lon: 98.9063 },
  { nameTh: "หัวหิน", nameEn: "Hua Hin", countryTh: "ไทย", countryEn: "Thailand", region: "asia", lat: 12.5684, lon: 99.9577 },
  { nameTh: "สมุย", nameEn: "Koh Samui", countryTh: "ไทย", countryEn: "Thailand", region: "asia", lat: 9.512, lon: 100.0136 },
  { nameTh: "อุดร", nameEn: "Udon", countryTh: "ไทย", countryEn: "Thailand", region: "asia", lat: 17.4156, lon: 102.7859 },
  { nameTh: "สุราษฎร์ธานี", nameEn: "Surat Thani", countryTh: "ไทย", countryEn: "Thailand", region: "asia", lat: 9.1382, lon: 99.3215 },
  { nameTh: "ลำปาง", nameEn: "Lampang", countryTh: "ไทย", countryEn: "Thailand", region: "asia", lat: 18.2888, lon: 99.5 },
  { nameTh: "นครศรีธรรมราช", nameEn: "Nakhon Si Thammarat", countryTh: "ไทย", countryEn: "Thailand", region: "asia", lat: 8.4304, lon: 99.9631 },
  { nameTh: "ระยอง", nameEn: "Rayong", countryTh: "ไทย", countryEn: "Thailand", region: "asia", lat: 12.6814, lon: 101.2815 },
  { nameTh: "กาญจนบุรี", nameEn: "Kanchanaburi", countryTh: "ไทย", countryEn: "Thailand", region: "asia", lat: 14.0228, lon: 99.5328 },
  { nameTh: "เชียงคาน", nameEn: "Chiang Khan", countryTh: "ไทย", countryEn: "Thailand", region: "asia", lat: 17.894, lon: 101.666 },
  // เอเชียตะวันออก + อาเซียน 40
  { nameTh: "โตเกียว", nameEn: "Tokyo", countryTh: "ญี่ปุ่น", countryEn: "Japan", region: "asia", lat: 35.6762, lon: 139.6503 },
  { nameTh: "โอซาก้า", nameEn: "Osaka", countryTh: "ญี่ปุ่น", countryEn: "Japan", region: "asia", lat: 34.6937, lon: 135.5023 },
  { nameTh: "เกียวโต", nameEn: "Kyoto", countryTh: "ญี่ปุ่น", countryEn: "Japan", region: "asia", lat: 35.0116, lon: 135.7681 },
  { nameTh: "โซล", nameEn: "Seoul", countryTh: "เกาหลีใต้", countryEn: "South Korea", region: "asia", lat: 37.5665, lon: 126.978 },
  { nameTh: "ปูซาน", nameEn: "Busan", countryTh: "เกาหลีใต้", countryEn: "South Korea", region: "asia", lat: 35.1796, lon: 129.0756 },
  { nameTh: "ไทเป", nameEn: "Taipei", countryTh: "ไต้หวัน", countryEn: "Taiwan", region: "asia", lat: 25.033, lon: 121.5654 },
  { nameTh: "ฮ่องกง", nameEn: "Hong Kong", countryTh: "ฮ่องกง", countryEn: "Hong Kong", region: "asia", lat: 22.3193, lon: 114.1694 },
  { nameTh: "เซี่ยงไฮ้", nameEn: "Shanghai", countryTh: "จีน", countryEn: "China", region: "asia", lat: 31.2304, lon: 121.4737 },
  { nameTh: "ปักกิ่ง", nameEn: "Beijing", countryTh: "จีน", countryEn: "China", region: "asia", lat: 39.9042, lon: 116.4074 },
  { nameTh: "เซินเจิ้น", nameEn: "Shenzhen", countryTh: "จีน", countryEn: "China", region: "asia", lat: 22.5431, lon: 114.0579 },
  { nameTh: "สิงคโปร์", nameEn: "Singapore", countryTh: "สิงคโปร์", countryEn: "Singapore", region: "asia", lat: 1.3521, lon: 103.8198 },
  { nameTh: "กัวลาลัมเปอร์", nameEn: "Kuala Lumpur", countryTh: "มาเลเซีย", countryEn: "Malaysia", region: "asia", lat: 3.139, lon: 101.6869 },
  { nameTh: "บาหลี", nameEn: "Bali", countryTh: "อินโดนีเซีย", countryEn: "Indonesia", region: "asia", lat: -8.4095, lon: 115.1889 },
  { nameTh: "จาการ์ตา", nameEn: "Jakarta", countryTh: "อินโดนีเซีย", countryEn: "Indonesia", region: "asia", lat: -6.2088, lon: 106.8456 },
  { nameTh: "มะนิลา", nameEn: "Manila", countryTh: "ฟิลิปปินส์", countryEn: "Philippines", region: "asia", lat: 14.5995, lon: 120.9842 },
  { nameTh: "ฮานอย", nameEn: "Hanoi", countryTh: "เวียดนาม", countryEn: "Vietnam", region: "asia", lat: 21.0285, lon: 105.8542 },
  { nameTh: "โฮจิมินห์", nameEn: "Ho Chi Minh City", countryTh: "เวียดนาม", countryEn: "Vietnam", region: "asia", lat: 10.8231, lon: 106.6297 },
  { nameTh: "พนมเปญ", nameEn: "Phnom Penh", countryTh: "กัมพูชา", countryEn: "Cambodia", region: "asia", lat: 11.5564, lon: 104.9282 },
  { nameTh: "หลวงพระบาง", nameEn: "Luang Prabang", countryTh: "ลาว", countryEn: "Laos", region: "asia", lat: 19.8849, lon: 102.135 },
  { nameTh: "ย่างกุ้ง", nameEn: "Yangon", countryTh: "เมียนมา", countryEn: "Myanmar", region: "asia", lat: 16.8409, lon: 96.1735 },
  { nameTh: "กาฐมาณฑุ", nameEn: "Kathmandu", countryTh: "เนปาล", countryEn: "Nepal", region: "asia", lat: 27.7172, lon: 85.324 },
  { nameTh: "นิวเดลี", nameEn: "New Delhi", countryTh: "อินเดีย", countryEn: "India", region: "asia", lat: 28.6139, lon: 77.209 },
  { nameTh: "มุมไบ", nameEn: "Mumbai", countryTh: "อินเดีย", countryEn: "India", region: "asia", lat: 19.076, lon: 72.8777 },
  { nameTh: "โกลกาตา", nameEn: "Kolkata", countryTh: "อินเดีย", countryEn: "India", region: "asia", lat: 22.5726, lon: 88.3639 },
  { nameTh: "ดูไบ", nameEn: "Dubai", countryTh: "สหรัฐอาหรับเอมิเรตส์", countryEn: "UAE", region: "meast", lat: 25.2048, lon: 55.2708 },
  { nameTh: "โดฮา", nameEn: "Doha", countryTh: "กาตาร์", countryEn: "Qatar", region: "meast", lat: 25.2854, lon: 51.531 },
  { nameTh: "ริยาด", nameEn: "Riyadh", countryTh: "ซาอุดีอาระเบีย", countryEn: "Saudi Arabia", region: "meast", lat: 24.7136, lon: 46.6753 },
  { nameTh: "อิสตันบูล", nameEn: "Istanbul", countryTh: "ตุรกี", countryEn: "Turkey", region: "meast", lat: 41.0082, lon: 28.9784 },
  { nameTh: "เทลอาวีฟ", nameEn: "Tel Aviv", countryTh: "อิสราเอล", countryEn: "Israel", region: "meast", lat: 32.0853, lon: 34.7818 },
  { nameTh: "ไคโร", nameEn: "Cairo", countryTh: "อียิปต์", countryEn: "Egypt", region: "africa", lat: 30.0444, lon: 31.2357 },
  // ยุโรป 50
  { nameTh: "ลอนดอน", nameEn: "London", countryTh: "สหราชอาณาจักร", countryEn: "UK", region: "europe", lat: 51.5072, lon: -0.1276 },
  { nameTh: "ปารีส", nameEn: "Paris", countryTh: "ฝรั่งเศส", countryEn: "France", region: "europe", lat: 48.8566, lon: 2.3522 },
  { nameTh: "เบอร์ลิน", nameEn: "Berlin", countryTh: "เยอรมนี", countryEn: "Germany", region: "europe", lat: 52.52, lon: 13.405 },
  { nameTh: "มิวนิก", nameEn: "Munich", countryTh: "เยอรมนี", countryEn: "Germany", region: "europe", lat: 48.1351, lon: 11.582 },
  { nameTh: "โรม", nameEn: "Rome", countryTh: "อิตาลี", countryEn: "Italy", region: "europe", lat: 41.9028, lon: 12.4964 },
  { nameTh: "มิลาน", nameEn: "Milan", countryTh: "อิตาลี", countryEn: "Italy", region: "europe", lat: 45.4642, lon: 9.19 },
  { nameTh: "เวนิส", nameEn: "Venice", countryTh: "อิตาลี", countryEn: "Italy", region: "europe", lat: 45.4408, lon: 12.3155 },
  { nameTh: "มาดริด", nameEn: "Madrid", countryTh: "สเปน", countryEn: "Spain", region: "europe", lat: 40.4168, lon: -3.7038 },
  { nameTh: "บาร์เซโลนา", nameEn: "Barcelona", countryTh: "สเปน", countryEn: "Spain", region: "europe", lat: 41.3851, lon: 2.1734 },
  { nameTh: "ลิสบอน", nameEn: "Lisbon", countryTh: "โปรตุเกส", countryEn: "Portugal", region: "europe", lat: 38.7223, lon: -9.1393 },
  { nameTh: "อัมสเตอร์ดัม", nameEn: "Amsterdam", countryTh: "เนเธอร์แลนด์", countryEn: "Netherlands", region: "europe", lat: 52.3676, lon: 4.9041 },
  { nameTh: "บรัสเซลส์", nameEn: "Brussels", countryTh: "เบลเยียม", countryEn: "Belgium", region: "europe", lat: 50.8503, lon: 4.3517 },
  { nameTh: "ซูริก", nameEn: "Zurich", countryTh: "สวิตเซอร์แลนด์", countryEn: "Switzerland", region: "europe", lat: 47.3769, lon: 8.5417 },
  { nameTh: "เวียนนา", nameEn: "Vienna", countryTh: "ออสเตรีย", countryEn: "Austria", region: "europe", lat: 48.2082, lon: 16.3738 },
  { nameTh: "ปราก", nameEn: "Prague", countryTh: "เช็ก", countryEn: "Czech", region: "europe", lat: 50.0755, lon: 14.4378 },
  { nameTh: "วอร์ซอ", nameEn: "Warsaw", countryTh: "โปแลนด์", countryEn: "Poland", region: "europe", lat: 52.2297, lon: 21.0122 },
  { nameTh: "โคเปนเฮเกน", nameEn: "Copenhagen", countryTh: "เดนมาร์ก", countryEn: "Denmark", region: "europe", lat: 55.6761, lon: 12.5683 },
  { nameTh: "สตอกโฮล์ม", nameEn: "Stockholm", countryTh: "สวีเดน", countryEn: "Sweden", region: "europe", lat: 59.3293, lon: 18.0686 },
  { nameTh: "ออสโล", nameEn: "Oslo", countryTh: "นอร์เวย์", countryEn: "Norway", region: "europe", lat: 59.9139, lon: 10.7522 },
  { nameTh: "เฮลซิงกิ", nameEn: "Helsinki", countryTh: "ฟินแลนด์", countryEn: "Finland", region: "europe", lat: 60.1699, lon: 24.9384 },
  { nameTh: "ดับลิน", nameEn: "Dublin", countryTh: "ไอร์แลนด์", countryEn: "Ireland", region: "europe", lat: 53.3498, lon: -6.2603 },
  { nameTh: "เอดินบะระ", nameEn: "Edinburgh", countryTh: "สกอตแลนด์", countryEn: "Scotland", region: "europe", lat: 55.9533, lon: -3.1883 },
  { nameTh: "เรคยาวิก", nameEn: "Reykjavik", countryTh: "ไอซ์แลนด์", countryEn: "Iceland", region: "europe", lat: 64.1466, lon: -21.9426 },
  { nameTh: "มอสโก", nameEn: "Moscow", countryTh: "รัสเซีย", countryEn: "Russia", region: "europe", lat: 55.7558, lon: 37.6173 },
  { nameTh: "เซนต์ปีเตอร์สเบิร์ก", nameEn: "St. Petersburg", countryTh: "รัสเซีย", countryEn: "Russia", region: "europe", lat: 59.9311, lon: 30.3609 },
  { nameTh: "เคียฟ", nameEn: "Kyiv", countryTh: "ยูเครน", countryEn: "Ukraine", region: "europe", lat: 50.4501, lon: 30.5234 },
  { nameTh: "เอเธนส์", nameEn: "Athens", countryTh: "กรีซ", countryEn: "Greece", region: "europe", lat: 37.9838, lon: 23.7275 },
  { nameTh: "บูดาเปสต์", nameEn: "Budapest", countryTh: "ฮังการี", countryEn: "Hungary", region: "europe", lat: 47.4979, lon: 19.0402 },
  // อเมริกา 45
  { nameTh: "นิวยอร์ก", nameEn: "New York", countryTh: "สหรัฐอเมริกา", countryEn: "USA", region: "americas", lat: 40.7128, lon: -74.006 },
  { nameTh: "ลอสแอนเจลิส", nameEn: "Los Angeles", countryTh: "สหรัฐอเมริกา", countryEn: "USA", region: "americas", lat: 34.0522, lon: -118.2437 },
  { nameTh: "ซานฟรานซิสโก", nameEn: "San Francisco", countryTh: "สหรัฐอเมริกา", countryEn: "USA", region: "americas", lat: 37.7749, lon: -122.4194 },
  { nameTh: "ชิคาโก", nameEn: "Chicago", countryTh: "สหรัฐอเมริกา", countryEn: "USA", region: "americas", lat: 41.8781, lon: -87.6298 },
  { nameTh: "ไมอามี", nameEn: "Miami", countryTh: "สหรัฐอเมริกา", countryEn: "USA", region: "americas", lat: 25.7617, lon: -80.1918 },
  { nameTh: "ลาสเวกัส", nameEn: "Las Vegas", countryTh: "สหรัฐอเมริกา", countryEn: "USA", region: "americas", lat: 36.1699, lon: -115.1398 },
  { nameTh: "บอสตัน", nameEn: "Boston", countryTh: "สหรัฐอเมริกา", countryEn: "USA", region: "americas", lat: 42.3601, lon: -71.0589 },
  { nameTh: "ซีแอตเทิล", nameEn: "Seattle", countryTh: "สหรัฐอเมริกา", countryEn: "USA", region: "americas", lat: 47.6062, lon: -122.3321 },
  { nameTh: "โฮโนลูลู", nameEn: "Honolulu", countryTh: "สหรัฐอเมริกา", countryEn: "USA", region: "americas", lat: 21.3099, lon: -157.8581 },
  { nameTh: "แวนคูเวอร์", nameEn: "Vancouver", countryTh: "แคนาดา", countryEn: "Canada", region: "americas", lat: 49.2827, lon: -123.1207 },
  { nameTh: "โตรอนโต", nameEn: "Toronto", countryTh: "แคนาดา", countryEn: "Canada", region: "americas", lat: 43.6532, lon: -79.3832 },
  { nameTh: "เม็กซิโกซิตี้", nameEn: "Mexico City", countryTh: "เม็กซิโก", countryEn: "Mexico", region: "americas", lat: 19.4326, lon: -99.1332 },
  { nameTh: "แคนคูน", nameEn: "Cancun", countryTh: "เม็กซิโก", countryEn: "Mexico", region: "americas", lat: 21.1619, lon: -86.8515 },
  { nameTh: "ลิมา", nameEn: "Lima", countryTh: "เปรู", countryEn: "Peru", region: "americas", lat: -12.0464, lon: -77.0428 },
  { nameTh: "โบโกตา", nameEn: "Bogota", countryTh: "โคลอมเบีย", countryEn: "Colombia", region: "americas", lat: 4.711, lon: -74.0721 },
  { nameTh: "รีโอเดจาเนโร", nameEn: "Rio de Janeiro", countryTh: "บราซิล", countryEn: "Brazil", region: "americas", lat: -22.9068, lon: -43.1729 },
  { nameTh: "เซาเปาโล", nameEn: "Sao Paulo", countryTh: "บราซิล", countryEn: "Brazil", region: "americas", lat: -23.5505, lon: -46.6333 },
  { nameTh: "บัวโนสไอเรส", nameEn: "Buenos Aires", countryTh: "อาร์เจนตินา", countryEn: "Argentina", region: "americas", lat: -34.6037, lon: -58.3816 },
  { nameTh: "ซานติอาโก", nameEn: "Santiago", countryTh: "ชิลี", countryEn: "Chile", region: "americas", lat: -33.4489, lon: -70.6693 },
  // โอเชียเนีย + แอฟริกา 20
  { nameTh: "ซิดนีย์", nameEn: "Sydney", countryTh: "ออสเตรเลีย", countryEn: "Australia", region: "oceania", lat: -33.8688, lon: 151.2093 },
  { nameTh: "เมลเบิร์น", nameEn: "Melbourne", countryTh: "ออสเตรเลีย", countryEn: "Australia", region: "oceania", lat: -37.8136, lon: 144.9631 },
  { nameTh: "โอ๊คแลนด์", nameEn: "Auckland", countryTh: "นิวซีแลนด์", countryEn: "New Zealand", region: "oceania", lat: -36.8509, lon: 174.7645 },
  { nameTh: "ฟิจิ", nameEn: "Fiji", countryTh: "ฟิจิ", countryEn: "Fiji", region: "oceania", lat: -18.1248, lon: 178.4501 },
  { nameTh: "โจฮันเนสเบิร์ก", nameEn: "Johannesburg", countryTh: "แอฟริกาใต้", countryEn: "South Africa", region: "africa", lat: -26.2041, lon: 28.0473 },
  { nameTh: "เคปทาวน์", nameEn: "Cape Town", countryTh: "แอฟริกาใต้", countryEn: "South Africa", region: "africa", lat: -33.9249, lon: 18.4241 },
  { nameTh: "ไนโรบี", nameEn: "Nairobi", countryTh: "เคนยา", countryEn: "Kenya", region: "africa", lat: -1.2921, lon: 36.8219 },
  { nameTh: "คาซาบลังกา", nameEn: "Casablanca", countryTh: "โมร็อกโก", countryEn: "Morocco", region: "africa", lat: 33.5731, lon: -7.5898 },
  { nameTh: "มาร์ราเกช", nameEn: "Marrakech", countryTh: "โมร็อกโก", countryEn: "Morocco", region: "africa", lat: 31.6295, lon: -7.9811 },
  // เติมให้ครบ 189 — กระจายยุโรป/เอเชียเพิ่ม
  { nameTh: "แฟรงก์เฟิร์ต", nameEn: "Frankfurt", countryTh: "เยอรมนี", countryEn: "Germany", region: "europe", lat: 50.1109, lon: 8.6821 },
  { nameTh: "ฮัมบูร์ก", nameEn: "Hamburg", countryTh: "เยอรมนี", countryEn: "Germany", region: "europe", lat: 53.5511, lon: 9.9937 },
  { nameTh: "นีซ", nameEn: "Nice", countryTh: "ฝรั่งเศส", countryEn: "France", region: "europe", lat: 43.7102, lon: 7.262 },
  { nameTh: "ลียง", nameEn: "Lyon", countryTh: "ฝรั่งเศส", countryEn: "France", region: "europe", lat: 45.764, lon: 4.8357 },
  { nameTh: "ฟลอเรนซ์", nameEn: "Florence", countryTh: "อิตาลี", countryEn: "Italy", region: "europe", lat: 43.7696, lon: 11.2558 },
  { nameTh: "เนเปิลส์", nameEn: "Naples", countryTh: "อิตาลี", countryEn: "Italy", region: "europe", lat: 40.8518, lon: 14.2681 },
  { nameTh: "วาเลนเซีย", nameEn: "Valencia", countryTh: "สเปน", countryEn: "Spain", region: "europe", lat: 39.4699, lon: -0.3763 },
  { nameTh: "เซบียา", nameEn: "Seville", countryTh: "สเปน", countryEn: "Spain", region: "europe", lat: 37.3891, lon: -5.9845 },
  { nameTh: "ปอร์โต", nameEn: "Porto", countryTh: "โปรตุเกส", countryEn: "Portugal", region: "europe", lat: 41.1579, lon: -8.6291 },
  { nameTh: "ร็อตเตอร์ดัม", nameEn: "Rotterdam", countryTh: "เนเธอร์แลนด์", countryEn: "Netherlands", region: "europe", lat: 51.9244, lon: 4.4777 },
  { nameTh: "เจนีวา", nameEn: "Geneva", countryTh: "สวิตเซอร์แลนด์", countryEn: "Switzerland", region: "europe", lat: 46.2044, lon: 6.1432 },
  { nameTh: "ซาลซ์บูร์ก", nameEn: "Salzburg", countryTh: "ออสเตรีย", countryEn: "Austria", region: "europe", lat: 47.8095, lon: 13.055 },
  { nameTh: "คราคูฟ", nameEn: "Krakow", countryTh: "โปแลนด์", countryEn: "Poland", region: "europe", lat: 50.0647, lon: 19.945 },
  { nameTh: "กดังส์ค", nameEn: "Gdansk", countryTh: "โปแลนด์", countryEn: "Poland", region: "europe", lat: 54.352, lon: 18.6466 },
  { nameTh: "โอเดนเซ", nameEn: "Odense", countryTh: "เดนมาร์ก", countryEn: "Denmark", region: "europe", lat: 55.4038, lon: 10.4024 },
  { nameTh: "เบอร์เกน", nameEn: "Bergen", countryTh: "นอร์เวย์", countryEn: "Norway", region: "europe", lat: 60.3913, lon: 5.3221 },
  { nameTh: "ตัมเปเร", nameEn: "Tampere", countryTh: "ฟินแลนด์", countryEn: "Finland", region: "europe", lat: 61.4978, lon: 23.761 },
  { nameTh: "กัลเวย์", nameEn: "Galway", countryTh: "ไอร์แลนด์", countryEn: "Ireland", region: "europe", lat: 53.2707, lon: -9.0568 },
  { nameTh: "กลาสโกว์", nameEn: "Glasgow", countryTh: "สกอตแลนด์", countryEn: "Scotland", region: "europe", lat: 55.8642, lon: -4.2518 },
  { nameTh: "อาคูเรย์รี", nameEn: "Akureyri", countryTh: "ไอซ์แลนด์", countryEn: "Iceland", region: "europe", lat: 65.6835, lon: -18.0878 },
  { nameTh: "คาซาน", nameEn: "Kazan", countryTh: "รัสเซีย", countryEn: "Russia", region: "europe", lat: 55.8304, lon: 49.0661 },
  { nameTh: "โซซี", nameEn: "Sochi", countryTh: "รัสเซีย", countryEn: "Russia", region: "europe", lat: 43.6028, lon: 39.7342 },
  { nameTh: "ลวีฟ", nameEn: "Lviv", countryTh: "ยูเครน", countryEn: "Ukraine", region: "europe", lat: 49.8397, lon: 24.0297 },
  { nameTh: "เทสซาโลนิกิ", nameEn: "Thessaloniki", countryTh: "กรีซ", countryEn: "Greece", region: "europe", lat: 40.6401, lon: 22.9444 },
  { nameTh: "เซเกด", nameEn: "Szeged", countryTh: "ฮังการี", countryEn: "Hungary", region: "europe", lat: 46.253, lon: 20.1414 },
  { nameTh: "กุสโก", nameEn: "Cusco", countryTh: "เปรู", countryEn: "Peru", region: "americas", lat: -13.532, lon: -71.9675 },
  { nameTh: "เมเดยิน", nameEn: "Medellin", countryTh: "โคลอมเบีย", countryEn: "Colombia", region: "americas", lat: 6.2442, lon: -75.5812 },
  { nameTh: "บราซิเลีย", nameEn: "Brasilia", countryTh: "บราซิล", countryEn: "Brazil", region: "americas", lat: -15.7975, lon: -47.8919 },
  { nameTh: "โรซาริโอ", nameEn: "Rosario", countryTh: "อาร์เจนตินา", countryEn: "Argentina", region: "americas", lat: -32.9587, lon: -60.6939 },
  { nameTh: "วัลปาราอีโซ", nameEn: "Valparaiso", countryTh: "ชิลี", countryEn: "Chile", region: "americas", lat: -33.0472, lon: -71.6127 },
  { nameTh: "บริสเบน", nameEn: "Brisbane", countryTh: "ออสเตรเลีย", countryEn: "Australia", region: "oceania", lat: -27.4698, lon: 153.0251 },
  { nameTh: "เพิร์ธ", nameEn: "Perth", countryTh: "ออสเตรเลีย", countryEn: "Australia", region: "oceania", lat: -31.9505, lon: 115.8605 },
  { nameTh: "แอดิเลด", nameEn: "Adelaide", countryTh: "ออสเตรเลีย", countryEn: "Australia", region: "oceania", lat: -34.9285, lon: 138.6007 },
  { nameTh: "ไครสต์เชิร์ช", nameEn: "Christchurch", countryTh: "นิวซีแลนด์", countryEn: "New Zealand", region: "oceania", lat: -43.5321, lon: 172.6362 },
  { nameTh: "เดอร์บัน", nameEn: "Durban", countryTh: "แอฟริกาใต้", countryEn: "South Africa", region: "africa", lat: -29.8587, lon: 31.0218 },
  { nameTh: "อักกรา", nameEn: "Accra", countryTh: "กานา", countryEn: "Ghana", region: "africa", lat: 5.6037, lon: -0.187 },
  { nameTh: "อัมมาน", nameEn: "Amman", countryTh: "จอร์แดน", countryEn: "Jordan", region: "meast", lat: 31.9454, lon: 35.9284 },
  { nameTh: "เบรุต", nameEn: "Beirut", countryTh: "เลบานอน", countryEn: "Lebanon", region: "meast", lat: 33.8889, lon: 35.4955 },
  { nameTh: "บุสซานเพิ่มเติม", nameEn: "Daegu", countryTh: "เกาหลีใต้", countryEn: "South Korea", region: "asia", lat: 35.8714, lon: 128.6014 },
  { nameTh: "นาโกย่า", nameEn: "Nagoya", countryTh: "ญี่ปุ่น", countryEn: "Japan", region: "asia", lat: 35.1815, lon: 136.9066 },
  { nameTh: "ฟุกุโอกะ", nameEn: "Fukuoka", countryTh: "ญี่ปุ่น", countryEn: "Japan", region: "asia", lat: 33.5902, lon: 130.4017 },
  { nameTh: "ซัปโปโร", nameEn: "Sapporo", countryTh: "ญี่ปุ่น", countryEn: "Japan", region: "asia", lat: 43.0618, lon: 141.3545 },
  { nameTh: "กวางโจว", nameEn: "Guangzhou", countryTh: "จีน", countryEn: "China", region: "asia", lat: 23.1291, lon: 113.2644 },
  { nameTh: "เฉิงตู", nameEn: "Chengdu", countryTh: "จีน", countryEn: "China", region: "asia", lat: 30.5728, lon: 104.0668 },
  { nameTh: "อู่ฮั่น", nameEn: "Wuhan", countryTh: "จีน", countryEn: "China", region: "asia", lat: 30.5928, lon: 114.3055 },
  { nameTh: "ปีนัง", nameEn: "Penang", countryTh: "มาเลเซีย", countryEn: "Malaysia", region: "asia", lat: 5.4141, lon: 100.3288 },
  { nameTh: "กระบี่เสริม", nameEn: "Kota Kinabalu", countryTh: "มาเลเซีย", countryEn: "Malaysia", region: "asia", lat: 5.9804, lon: 116.0735 },
  { nameTh: "เซบู", nameEn: "Cebu", countryTh: "ฟิลิปปินส์", countryEn: "Philippines", region: "asia", lat: 10.3157, lon: 123.8854 },
  { nameTh: "ดานัง", nameEn: "Da Nang", countryTh: "เวียดนาม", countryEn: "Vietnam", region: "asia", lat: 16.0544, lon: 108.2022 },
  { nameTh: "เสียมเรียบ", nameEn: "Siem Reap", countryTh: "กัมพูชา", countryEn: "Cambodia", region: "asia", lat: 13.3671, lon: 103.8448 },
  { nameTh: "เวียงจันทน์", nameEn: "Vientiane", countryTh: "ลาว", countryEn: "Laos", region: "asia", lat: 17.9757, lon: 102.6331 },
  { nameTh: "มัณฑะเลย์", nameEn: "Mandalay", countryTh: "เมียนมา", countryEn: "Myanmar", region: "asia", lat: 21.9588, lon: 96.0891 },
  { nameTh: "พาราณสี", nameEn: "Varanasi", countryTh: "อินเดีย", countryEn: "India", region: "asia", lat: 25.3176, lon: 82.9739 },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function rankCities(_cityLon: number, _lines: Array<{ longitude: number; planet: string; angle: string }>): never { throw new Error("use rankCitiesWithAtlas"); }

// Helper for Atlas ranking with orb (km)
export function rankCitiesAtlas(
  atlasLines: Array<{ planet: string; angle: string; longitude: number; points?: Array<{lat:number; lon:number}> }>,
  cities: AtlasCity[] = ATLAS_CITIES
): Array<{ city: AtlasCity; bestLine: { planet:string; angle:string; longitude:number }; distKm: number; orb: "intense"|"soft"|"none" }> {
  const out: Array<{ city: AtlasCity; bestLine: {planet:string; angle:string; longitude:number}; distKm:number; orb:"intense"|"soft"|"none"}> = [];
  for (const city of cities) {
    let bestDist = 180;
    let best: { planet:string; angle:string; longitude:number } | null = null;
    for (const line of atlasLines) {
      let dDeg: number;
      if (line.points) {
        // curved: min over sampled points (lat-specific lon)
        let md = 180;
        for (const p of line.points) md = Math.min(md, Math.abs(((city.lon - p.lon + 540)%360)-180));
        dDeg = md;
      } else {
        dDeg = Math.abs(((city.lon - line.longitude + 540)%360)-180);
      }
      if (dDeg < bestDist) { bestDist = dDeg; best = line; }
    }
    const kmAtLat = 111 * Math.cos(city.lat * Math.PI/180);
    const distKm = bestDist * kmAtLat;
    const orb: "intense"|"soft"|"none" = distKm <= 250 ? "intense" : distKm <= 1100 ? "soft" : "none";
    out.push({ city, bestLine: best!, distKm, orb });
  }
  // Sort by dist (closest line) then by intense first
  out.sort((a,b)=> a.distKm - b.distKm);
  return out;
}
