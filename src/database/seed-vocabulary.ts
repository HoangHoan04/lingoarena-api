import { DataSource } from 'typeorm';
import { enumData } from '../common/enums/base.enum';

type SeedWord = {
  headword: string;
  pos: string;
  ipa: string;
  definitionEn: string;
  meaningVi: string;
  cefr: string;
  exampleEn: string;
  exampleVi: string;
  decks: string[];
};

const WORDS: SeedWord[] = [
  { headword: 'accomplish', pos: 'verb', ipa: '/əˈkɑːmplɪʃ/', definitionEn: 'to succeed in doing something', meaningVi: 'hoàn thành, đạt được', cefr: 'B1', exampleEn: 'She accomplished her goal in six months.', exampleVi: 'Cô ấy đạt mục tiêu trong sáu tháng.', decks: ['toeic-starter', 'ielts-academic-core'] },
  { headword: 'agenda', pos: 'noun', ipa: '/əˈdʒendə/', definitionEn: 'a list of things to be discussed', meaningVi: 'chương trình nghị sự', cefr: 'B1', exampleEn: 'The first item on the agenda is the budget.', exampleVi: 'Mục đầu tiên trong chương trình là ngân sách.', decks: ['toeic-starter'] },
  { headword: 'approve', pos: 'verb', ipa: '/əˈpruːv/', definitionEn: 'to officially agree to something', meaningVi: 'phê duyệt', cefr: 'A2', exampleEn: 'The manager approved the proposal.', exampleVi: 'Quản lý đã phê duyệt đề xuất.', decks: ['toeic-starter'] },
  { headword: 'deadline', pos: 'noun', ipa: '/ˈdedlaɪn/', definitionEn: 'a time by which something must be finished', meaningVi: 'hạn chót', cefr: 'A2', exampleEn: 'The deadline for the report is Friday.', exampleVi: 'Hạn nộp báo cáo là thứ Sáu.', decks: ['toeic-starter'] },
  { headword: 'negotiate', pos: 'verb', ipa: '/nɪˈɡoʊʃieɪt/', definitionEn: 'to discuss in order to reach an agreement', meaningVi: 'đàm phán', cefr: 'B1', exampleEn: 'We negotiated a better price.', exampleVi: 'Chúng tôi đàm phán được giá tốt hơn.', decks: ['toeic-starter'] },
  { headword: 'invoice', pos: 'noun', ipa: '/ˈɪnvɔɪs/', definitionEn: 'a bill for goods or services', meaningVi: 'hóa đơn', cefr: 'B1', exampleEn: 'Please send the invoice by email.', exampleVi: 'Vui lòng gửi hóa đơn qua email.', decks: ['toeic-starter'] },
  { headword: 'schedule', pos: 'noun', ipa: '/ˈskedʒuːl/', definitionEn: 'a plan of times for events', meaningVi: 'lịch trình', cefr: 'A2', exampleEn: 'The meeting is not on my schedule.', exampleVi: 'Cuộc họp không có trong lịch của tôi.', decks: ['toeic-starter', 'daily-conversation'] },
  { headword: 'revenue', pos: 'noun', ipa: '/ˈrevənuː/', definitionEn: 'income that a company receives', meaningVi: 'doanh thu', cefr: 'B2', exampleEn: 'Revenue increased by 12 percent.', exampleVi: 'Doanh thu tăng 12 phần trăm.', decks: ['toeic-starter'] },
  { headword: 'candidate', pos: 'noun', ipa: '/ˈkændɪdeɪt/', definitionEn: 'a person applying for a job', meaningVi: 'ứng viên', cefr: 'A2', exampleEn: 'We interviewed three candidates.', exampleVi: 'Chúng tôi phỏng vấn ba ứng viên.', decks: ['toeic-starter'] },
  { headword: 'efficient', pos: 'adjective', ipa: '/ɪˈfɪʃnt/', definitionEn: 'working well without wasting time', meaningVi: 'hiệu quả', cefr: 'B1', exampleEn: 'This is a more efficient process.', exampleVi: 'Đây là quy trình hiệu quả hơn.', decks: ['toeic-starter'] },
  { headword: 'confirm', pos: 'verb', ipa: '/kənˈfɜːrm/', definitionEn: 'to say that something is true or definite', meaningVi: 'xác nhận', cefr: 'A2', exampleEn: 'Please confirm your attendance.', exampleVi: 'Vui lòng xác nhận tham dự.', decks: ['toeic-starter', 'daily-conversation'] },
  { headword: 'branch', pos: 'noun', ipa: '/bræntʃ/', definitionEn: 'a local office of a company', meaningVi: 'chi nhánh', cefr: 'A2', exampleEn: 'She works at the downtown branch.', exampleVi: 'Cô ấy làm ở chi nhánh trung tâm.', decks: ['toeic-starter'] },
  { headword: 'shipment', pos: 'noun', ipa: '/ˈʃɪpmənt/', definitionEn: 'goods sent from one place to another', meaningVi: 'lô hàng', cefr: 'B1', exampleEn: 'The shipment will arrive tomorrow.', exampleVi: 'Lô hàng sẽ đến vào ngày mai.', decks: ['toeic-starter'] },
  { headword: 'overtime', pos: 'noun', ipa: '/ˈoʊvərtaɪm/', definitionEn: 'extra hours worked beyond normal time', meaningVi: 'làm thêm giờ', cefr: 'A2', exampleEn: 'He worked overtime last week.', exampleVi: 'Anh ấy làm thêm giờ tuần trước.', decks: ['toeic-starter'] },
  { headword: 'client', pos: 'noun', ipa: '/ˈklaɪənt/', definitionEn: 'a person who pays for professional services', meaningVi: 'khách hàng', cefr: 'A2', exampleEn: 'The client requested a new design.', exampleVi: 'Khách hàng yêu cầu thiết kế mới.', decks: ['toeic-starter'] },
  { headword: 'significant', pos: 'adjective', ipa: '/sɪɡˈnɪfɪkənt/', definitionEn: 'important or large enough to notice', meaningVi: 'đáng kể, quan trọng', cefr: 'B1', exampleEn: 'There was a significant improvement.', exampleVi: 'Có sự cải thiện đáng kể.', decks: ['ielts-academic-core'] },
  { headword: 'analyze', pos: 'verb', ipa: '/ˈænəlaɪz/', definitionEn: 'to examine something in detail', meaningVi: 'phân tích', cefr: 'B1', exampleEn: 'Researchers analyzed the survey data.', exampleVi: 'Các nhà nghiên cứu phân tích dữ liệu khảo sát.', decks: ['ielts-academic-core'] },
  { headword: 'hypothesis', pos: 'noun', ipa: '/haɪˈpɑːθəsɪs/', definitionEn: 'an idea that is suggested as an explanation', meaningVi: 'giả thuyết', cefr: 'B2', exampleEn: 'The hypothesis was later confirmed.', exampleVi: 'Giả thuyết sau đó được xác nhận.', decks: ['ielts-academic-core'] },
  { headword: 'evidence', pos: 'noun', ipa: '/ˈevɪdəns/', definitionEn: 'facts that show something is true', meaningVi: 'bằng chứng', cefr: 'B1', exampleEn: 'There is little evidence to support this.', exampleVi: 'Có rất ít bằng chứng ủng hộ điều này.', decks: ['ielts-academic-core'] },
  { headword: 'consequence', pos: 'noun', ipa: '/ˈkɑːnsəkwens/', definitionEn: 'a result of an action or situation', meaningVi: 'hậu quả', cefr: 'B1', exampleEn: 'Climate change has serious consequences.', exampleVi: 'Biến đổi khí hậu gây hậu quả nghiêm trọng.', decks: ['ielts-academic-core'] },
  { headword: 'perspective', pos: 'noun', ipa: '/pərˈspektɪv/', definitionEn: 'a particular way of thinking about something', meaningVi: 'góc nhìn', cefr: 'B2', exampleEn: 'Try to see it from another perspective.', exampleVi: 'Hãy thử nhìn từ góc độ khác.', decks: ['ielts-academic-core'] },
  { headword: 'approximately', pos: 'adverb', ipa: '/əˈprɑːksɪmətli/', definitionEn: 'used when giving a number that is not exact', meaningVi: 'xấp xỉ', cefr: 'B1', exampleEn: 'The trip takes approximately two hours.', exampleVi: 'Chuyến đi mất khoảng hai giờ.', decks: ['ielts-academic-core'] },
  { headword: 'sustainable', pos: 'adjective', ipa: '/səˈsteɪnəbl/', definitionEn: 'able to continue without harming the environment', meaningVi: 'bền vững', cefr: 'B2', exampleEn: 'We need more sustainable energy sources.', exampleVi: 'Chúng ta cần nhiều nguồn năng lượng bền vững hơn.', decks: ['ielts-academic-core'] },
  { headword: 'indicate', pos: 'verb', ipa: '/ˈɪndɪkeɪt/', definitionEn: 'to show that something is true or exists', meaningVi: 'chỉ ra, cho thấy', cefr: 'B1', exampleEn: 'The results indicate a clear trend.', exampleVi: 'Kết quả cho thấy một xu hướng rõ ràng.', decks: ['ielts-academic-core'] },
  { headword: 'research', pos: 'noun', ipa: '/ˈriːsɜːrtʃ/', definitionEn: 'detailed study of a subject', meaningVi: 'nghiên cứu', cefr: 'B1', exampleEn: 'Further research is needed.', exampleVi: 'Cần nghiên cứu thêm.', decks: ['ielts-academic-core'] },
  { headword: 'factor', pos: 'noun', ipa: '/ˈfæktər/', definitionEn: 'one of the things that influences a result', meaningVi: 'yếu tố', cefr: 'B1', exampleEn: 'Cost is an important factor.', exampleVi: 'Chi phí là một yếu tố quan trọng.', decks: ['ielts-academic-core'] },
  { headword: 'method', pos: 'noun', ipa: '/ˈmeθəd/', definitionEn: 'a particular way of doing something', meaningVi: 'phương pháp', cefr: 'A2', exampleEn: 'This teaching method works well.', exampleVi: 'Phương pháp giảng dạy này hiệu quả.', decks: ['ielts-academic-core'] },
  { headword: 'occur', pos: 'verb', ipa: '/əˈkɜːr/', definitionEn: 'to happen', meaningVi: 'xảy ra', cefr: 'B1', exampleEn: 'The accident occurred at midnight.', exampleVi: 'Vụ tai nạn xảy ra lúc nửa đêm.', decks: ['ielts-academic-core'] },
  { headword: 'trend', pos: 'noun', ipa: '/trend/', definitionEn: 'a general direction of change', meaningVi: 'xu hướng', cefr: 'B1', exampleEn: 'There is a growing trend toward remote work.', exampleVi: 'Có xu hướng gia tăng làm việc từ xa.', decks: ['ielts-academic-core'] },
  { headword: 'data', pos: 'noun', ipa: '/ˈdeɪtə/', definitionEn: 'information, especially facts or numbers', meaningVi: 'dữ liệu', cefr: 'B1', exampleEn: 'The data supports our conclusion.', exampleVi: 'Dữ liệu ủng hộ kết luận của chúng tôi.', decks: ['ielts-academic-core'] },
  { headword: 'appointment', pos: 'noun', ipa: '/əˈpɔɪntmənt/', definitionEn: 'a formal arrangement to meet someone', meaningVi: 'cuộc hẹn', cefr: 'A2', exampleEn: 'I have a dentist appointment at 3 p.m.', exampleVi: 'Tôi có hẹn nha sĩ lúc 3 giờ chiều.', decks: ['daily-conversation'] },
  { headword: 'convenient', pos: 'adjective', ipa: '/kənˈviːniənt/', definitionEn: 'easy to use or suitable for your needs', meaningVi: 'tiện lợi', cefr: 'A2', exampleEn: 'Is this time convenient for you?', exampleVi: 'Thời gian này có tiện cho bạn không?', decks: ['daily-conversation'] },
  { headword: 'recommend', pos: 'verb', ipa: '/ˌrekəˈmend/', definitionEn: 'to suggest that someone or something is good', meaningVi: 'gợi ý, tiến cử', cefr: 'A2', exampleEn: 'I recommend the seafood restaurant nearby.', exampleVi: 'Tôi gợi ý quán hải sản gần đây.', decks: ['daily-conversation'] },
  { headword: 'available', pos: 'adjective', ipa: '/əˈveɪləbl/', definitionEn: 'able to be used or obtained', meaningVi: 'có sẵn', cefr: 'A2', exampleEn: 'Are there any tables available?', exampleVi: 'Còn bàn trống không?', decks: ['daily-conversation'] },
  { headword: 'prefer', pos: 'verb', ipa: '/prɪˈfɜːr/', definitionEn: 'to like one thing more than another', meaningVi: 'thích hơn', cefr: 'A2', exampleEn: 'I prefer tea to coffee.', exampleVi: 'Tôi thích trà hơn cà phê.', decks: ['daily-conversation'] },
  { headword: 'neighborhood', pos: 'noun', ipa: '/ˈneɪbərhʊd/', definitionEn: 'the area around where you live', meaningVi: 'khu phố, hàng xóm', cefr: 'A2', exampleEn: 'This neighborhood is very quiet.', exampleVi: 'Khu phố này rất yên tĩnh.', decks: ['daily-conversation'] },
  { headword: 'traffic', pos: 'noun', ipa: '/ˈtræfɪk/', definitionEn: 'cars moving along a road', meaningVi: 'giao thông', cefr: 'A2', exampleEn: 'The traffic is terrible this morning.', exampleVi: 'Giao thông sáng nay rất tệ.', decks: ['daily-conversation'] },
  { headword: 'receipt', pos: 'noun', ipa: '/rɪˈsiːt/', definitionEn: 'a piece of paper showing what you paid', meaningVi: 'biên lai', cefr: 'A2', exampleEn: 'Can I have a receipt, please?', exampleVi: 'Cho tôi xin biên lai được không?', decks: ['daily-conversation'] },
  { headword: 'weather', pos: 'noun', ipa: '/ˈweðər/', definitionEn: 'the condition of the atmosphere', meaningVi: 'thời tiết', cefr: 'A1', exampleEn: 'The weather is getting colder.', exampleVi: 'Thời tiết đang trở lạnh.', decks: ['daily-conversation'] },
  { headword: 'invitation', pos: 'noun', ipa: '/ˌɪnvɪˈteɪʃn/', definitionEn: 'a request to go to an event', meaningVi: 'lời mời', cefr: 'A2', exampleEn: 'Thanks for the invitation to dinner.', exampleVi: 'Cảm ơn lời mời ăn tối.', decks: ['daily-conversation'] },
  { headword: 'apologize', pos: 'verb', ipa: '/əˈpɑːlədʒaɪz/', definitionEn: 'to say that you are sorry', meaningVi: 'xin lỗi', cefr: 'A2', exampleEn: 'I apologize for being late.', exampleVi: 'Tôi xin lỗi vì đến muộn.', decks: ['daily-conversation'] },
  { headword: 'borrow', pos: 'verb', ipa: '/ˈbɑːroʊ/', definitionEn: 'to take something and return it later', meaningVi: 'mượn', cefr: 'A2', exampleEn: 'Can I borrow your charger?', exampleVi: 'Cho tôi mượn sạc được không?', decks: ['daily-conversation'] },
  { headword: 'remind', pos: 'verb', ipa: '/rɪˈmaɪnd/', definitionEn: 'to help someone remember something', meaningVi: 'nhắc nhở', cefr: 'A2', exampleEn: 'Please remind me to call her.', exampleVi: 'Nhắc tôi gọi cho cô ấy nhé.', decks: ['daily-conversation'] },
  { headword: 'enough', pos: 'determiner', ipa: '/ɪˈnʌf/', definitionEn: 'as much as is necessary', meaningVi: 'đủ', cefr: 'A1', exampleEn: 'We do not have enough time.', exampleVi: 'Chúng ta không đủ thời gian.', decks: ['daily-conversation'] },
  { headword: 'probably', pos: 'adverb', ipa: '/ˈprɑːbəbli/', definitionEn: 'used to say something is likely', meaningVi: 'có lẽ', cefr: 'A2', exampleEn: 'I will probably stay home tonight.', exampleVi: 'Tối nay tôi có lẽ ở nhà.', decks: ['daily-conversation'] },
];

const DECKS = [
  {
    slug: 'toeic-starter',
    title: 'TOEIC Starter',
    description: 'Từ vựng văn phòng và công việc cho người mới luyện TOEIC.',
    level: 'A2',
  },
  {
    slug: 'ielts-academic-core',
    title: 'IELTS Academic Core',
    description: 'Nhóm từ học thuật cốt lõi cho Writing và Reading IELTS.',
    level: 'B1',
  },
  {
    slug: 'daily-conversation',
    title: 'Daily Conversation',
    description: 'Từ dùng mỗi ngày: hẹn giờ, nhà hàng, giao thông, xã giao.',
    level: 'A2',
  },
];

async function ensureWord(ds: DataSource, word: SeedWord) {
  const normalized = word.headword.toLowerCase();
  const existing = await ds.query(
    `SELECT id FROM vocabularies WHERE "normalizedWord" = $1 AND "partOfSpeech" = $2 AND "isDeleted" = false LIMIT 1`,
    [normalized, word.pos],
  );
  if (existing[0]?.id) return existing[0].id as string;

  const inserted = await ds.query(
    `INSERT INTO vocabularies
      ("headword", "normalizedWord", "partOfSpeech", "ipaUs", "ipaUk", "definitionEn", "meaningVi", "cefrLevel", "frequencyLevel", status, "isDeleted", version, "createdAt")
     VALUES ($1,$2,$3,$4,$4,$5,$6,$7,1,$8,false,0,NOW())
     RETURNING id`,
    [
      word.headword,
      normalized,
      word.pos,
      word.ipa,
      word.definitionEn,
      word.meaningVi,
      word.cefr,
      enumData.CONTENT_REVIEW_STATUS.APPROVED.code,
    ],
  );
  const id = inserted[0].id as string;
  await ds.query(
    `INSERT INTO vocabulary_examples ("vocabularyId", sentence, translation, "sortOrder", "isDeleted", version, "createdAt")
     VALUES ($1,$2,$3,0,false,0,NOW())`,
    [id, word.exampleEn, word.exampleVi],
  );
  return id;
}

async function ensureDeck(ds: DataSource, deck: (typeof DECKS)[number]) {
  const existing = await ds.query(
    `SELECT id FROM vocabulary_decks WHERE slug = $1 AND "isDeleted" = false LIMIT 1`,
    [deck.slug],
  );
  if (existing[0]?.id) return existing[0].id as string;
  const inserted = await ds.query(
    `INSERT INTO vocabulary_decks
      ("ownerType", title, slug, description, visibility, level, "itemCount", "isDeleted", version, "createdAt")
     VALUES ($1,$2,$3,$4,$5,$6,0,false,0,NOW())
     RETURNING id`,
    [
      enumData.VOCAB_DECK_OWNER_TYPE.SYSTEM.code,
      deck.title,
      deck.slug,
      deck.description,
      enumData.VISIBILITY.PUBLIC.code,
      deck.level,
    ],
  );
  return inserted[0].id as string;
}

export async function seedVocabulary(ds: DataSource) {
  const deckIds = new Map<string, string>();
  for (const deck of DECKS) {
    deckIds.set(deck.slug, await ensureDeck(ds, deck));
  }

  const deckWordIds = new Map<string, string[]>(DECKS.map(deck => [deck.slug, []]));
  for (const word of WORDS) {
    const wordId = await ensureWord(ds, word);
    for (const slug of word.decks) {
      deckWordIds.get(slug)?.push(wordId);
    }
  }

  for (const [slug, vocabIds] of deckWordIds) {
    const deckId = deckIds.get(slug);
    if (!deckId) continue;
    for (const [index, vocabularyId] of vocabIds.entries()) {
      const exist = await ds.query(
        `SELECT id FROM vocabulary_deck_items WHERE "deckId" = $1 AND "vocabularyId" = $2 AND "isDeleted" = false LIMIT 1`,
        [deckId, vocabularyId],
      );
      if (!exist[0]) {
        await ds.query(
          `INSERT INTO vocabulary_deck_items ("deckId", "vocabularyId", "sortOrder", "isDeleted", version, "createdAt")
           VALUES ($1,$2,$3,false,0,NOW())`,
          [deckId, vocabularyId, index],
        );
      }
    }
    await ds.query(`UPDATE vocabulary_decks SET "itemCount" = $2 WHERE id = $1`, [deckId, vocabIds.length]);
  }

  const examTypes = [
    { code: 'TOEIC', name: 'TOEIC', scoreMax: 990 },
    { code: 'IELTS', name: 'IELTS', scoreMax: 9 },
    { code: 'VSTEP', name: 'VSTEP', scoreMax: 10 },
    { code: 'GENERAL', name: 'General English', scoreMax: 100 },
  ];
  const examTypeIds = new Map<string, string>();
  for (const exam of examTypes) {
    const existing = await ds.query(
      `SELECT id FROM exam_types WHERE code = $1 AND "isDeleted" = false LIMIT 1`,
      [exam.code],
    );
    if (existing[0]?.id) {
      examTypeIds.set(exam.code, existing[0].id);
    }
  }

  const topics = [
    { code: 'BUSINESS', name: 'Business', exam: 'TOEIC' },
    { code: 'ACADEMIC', name: 'Academic', exam: 'IELTS' },
    { code: 'DAILY', name: 'Daily life', exam: 'GENERAL' },
  ];
  const topicIds = new Map<string, string>();
  for (const topic of topics) {
    const existing = await ds.query(
      `SELECT id FROM topics WHERE code = $1 AND "isDeleted" = false LIMIT 1`,
      [topic.code],
    );
    if (existing[0]?.id) {
      topicIds.set(topic.code, existing[0].id);
      continue;
    }
    const inserted = await ds.query(
      `INSERT INTO topics (code, name, "examTypeId", "sortOrder", "isDeleted", version, "createdAt")
       VALUES ($1,$2,$3,0,false,0,NOW()) RETURNING id`,
      [topic.code, topic.name, examTypeIds.get(topic.exam)],
    );
    topicIds.set(topic.code, inserted[0].id);
  }

  await ds.query(
    `UPDATE vocabulary_decks SET "examTypeId" = $2 WHERE slug = $1 AND "isDeleted" = false`,
    ['toeic-starter', examTypeIds.get('TOEIC')],
  );
  await ds.query(
    `UPDATE vocabulary_decks SET "examTypeId" = $2 WHERE slug = $1 AND "isDeleted" = false`,
    ['ielts-academic-core', examTypeIds.get('IELTS')],
  );
  await ds.query(
    `UPDATE vocabulary_decks SET "examTypeId" = $2 WHERE slug = $1 AND "isDeleted" = false`,
    ['daily-conversation', examTypeIds.get('GENERAL')],
  );

  const wordByHead = new Map<string, string>();
  for (const word of WORDS) {
    const row = await ds.query(
      `SELECT id FROM vocabularies WHERE "normalizedWord" = $1 AND "partOfSpeech" = $2 AND "isDeleted" = false LIMIT 1`,
      [word.headword.toLowerCase(), word.pos],
    );
    if (row[0]?.id) wordByHead.set(word.headword, row[0].id);
  }

  const collocations = [
    { word: 'deadline', collocation: 'meet a deadline', meaningVi: 'đáp ứng hạn chót', example: 'We must meet the deadline.' },
    { word: 'approve', collocation: 'approve a proposal', meaningVi: 'phê duyệt đề xuất', example: 'The board approved the proposal.' },
    { word: 'evidence', collocation: 'strong evidence', meaningVi: 'bằng chứng mạnh', example: 'There is strong evidence for this claim.' },
    { word: 'appointment', collocation: 'make an appointment', meaningVi: 'đặt lịch hẹn', example: 'I need to make an appointment.' },
  ];
  for (const item of collocations) {
    const vocabularyId = wordByHead.get(item.word);
    if (!vocabularyId) continue;
    const exist = await ds.query(
      `SELECT id FROM vocabulary_collocations WHERE "vocabularyId" = $1 AND collocation = $2 AND "isDeleted" = false LIMIT 1`,
      [vocabularyId, item.collocation],
    );
    if (exist[0]) continue;
    await ds.query(
      `INSERT INTO vocabulary_collocations ("vocabularyId", collocation, "meaningVi", "exampleSentence", "sortOrder", "isDeleted", version, "createdAt")
       VALUES ($1,$2,$3,$4,0,false,0,NOW())`,
      [vocabularyId, item.collocation, item.meaningVi, item.example],
    );
  }

  const relations = [
    { from: 'confirm', to: 'approve', type: 'synonym' },
    { from: 'deadline', to: 'schedule', type: 'word_family' },
    { from: 'significant', to: 'evidence', type: 'word_family' },
  ];
  for (const item of relations) {
    const fromId = wordByHead.get(item.from);
    const toId = wordByHead.get(item.to);
    if (!fromId || !toId) continue;
    const exist = await ds.query(
      `SELECT id FROM vocabulary_relations WHERE "vocabularyId" = $1 AND "relatedVocabularyId" = $2 AND "relationType" = $3 LIMIT 1`,
      [fromId, toId, item.type],
    );
    if (exist[0]) continue;
    await ds.query(
      `INSERT INTO vocabulary_relations ("vocabularyId", "relatedVocabularyId", "relationType", "isDeleted", version, "createdAt")
       VALUES ($1,$2,$3,false,0,NOW())`,
      [fromId, toId, item.type],
    );
  }

  const topicMap: Record<string, string> = {
    'toeic-starter': 'BUSINESS',
    'ielts-academic-core': 'ACADEMIC',
    'daily-conversation': 'DAILY',
  };
  for (const word of WORDS) {
    const vocabularyId = wordByHead.get(word.headword);
    if (!vocabularyId) continue;
    for (const slug of word.decks) {
      const topicId = topicIds.get(topicMap[slug]);
      const examCode = slug.includes('toeic') ? 'TOEIC' : slug.includes('ielts') ? 'IELTS' : 'GENERAL';
      const examTypeId = examTypeIds.get(examCode);
      if (topicId) {
        const exist = await ds.query(
          `SELECT id FROM vocabulary_topics WHERE "vocabularyId" = $1 AND "topicId" = $2 LIMIT 1`,
          [vocabularyId, topicId],
        );
        if (!exist[0]) {
          await ds.query(
            `INSERT INTO vocabulary_topics ("vocabularyId", "topicId", "isDeleted", version, "createdAt")
             VALUES ($1,$2,false,0,NOW())`,
            [vocabularyId, topicId],
          );
        }
      }
      if (examTypeId) {
        const exist = await ds.query(
          `SELECT id FROM vocabulary_exam_types WHERE "vocabularyId" = $1 AND "examTypeId" = $2 LIMIT 1`,
          [vocabularyId, examTypeId],
        );
        if (!exist[0]) {
          await ds.query(
            `INSERT INTO vocabulary_exam_types ("vocabularyId", "examTypeId", "isDeleted", version, "createdAt")
             VALUES ($1,$2,false,0,NOW())`,
            [vocabularyId, examTypeId],
          );
        }
      }
    }
  }

  console.log(`Seeded ${WORDS.length} words, ${DECKS.length} decks, topics, collocations and relations.`);
}
