export const enumData = {
  GENDER: {
    MALE: { id: 'M', code: 'MALE', labelKey: 'baseEnum.gender.male', nameEn: 'Male' },
    FEMALE: { id: 'F', code: 'FEMALE', labelKey: 'baseEnum.gender.female', nameEn: 'Female' },
    MIXED: { id: 'X', code: 'MIXED', labelKey: 'baseEnum.gender.mixed', nameEn: 'Mixed' },
  },

  ACTION_LOG: {
    CREATE: {
      code: 'CREATE',
      description: 'Tạo mới',
    },
    UPDATE: {
      code: 'UPDATE',
      description: 'Cập nhật',
    },
    DELETE: {
      code: 'DELETE',
      description: 'Xóa',
    },
    VIEW: {
      code: 'VIEW',
      description: 'Xem',
    },
    DEACTIVATE: {
      code: 'DEACTIVATE',
      description: 'Ngưng hoạt động',
    },
    ACTIVATE: {
      code: 'ACTIVATE',
      description: 'Kích hoạt',
    },
    LOGIN: {
      code: 'LOGIN',
      description: 'Đăng nhập',
    },
    APPROVE: {
      code: 'APPROVE',
      description: 'Duyệt',
    },
    IMPORT: {
      code: 'IMPORT',
      description: 'Nhập excel',
    },
    EXPORT: {
      code: 'EXPORT',
      description: 'Xuất excel',
    },
    REJECT: {
      code: 'REJECT',
      description: 'Từ chối',
    },
    HIDE: {
      code: 'HIDE',
      description: 'Ẩn',
    },
    SHOW: {
      code: 'SHOW',
      description: 'Hiện thị',
    },
    REFRESH_TOKEN: {
      code: 'REFRESH_TOKEN',
      description: 'Làm mới token',
    },
  },

  LOGIN_PROVIDER: {
    GOOGLE: { code: 'GOOGLE', name: 'Google' },
    FACEBOOK: { code: 'FACEBOOK', name: 'Facebook' },
    APPLE: { code: 'APPLE', name: 'Apple' },
    NORMAL: { code: 'NORMAL', name: 'Normal' },
  },

  SCOPE_TYPE: {
    GLOBAL: { code: 'GLOBAL', name: 'Toàn hệ thống' },
    CLASSROOM: { code: 'CLASSROOM', name: 'Lớp học' },
    ORGANIZATION: { code: 'ORGANIZATION', name: 'Tổ chức' },
  },

  CEFR_LEVEL: {
    A1: { code: 'A1', name: 'A1' },
    A2: { code: 'A2', name: 'A2' },
    B1: { code: 'B1', name: 'B1' },
    B2: { code: 'B2', name: 'B2' },
    C1: { code: 'C1', name: 'C1' },
    C2: { code: 'C2', name: 'C2' },
  },

  PART_OF_SPEECH: {
    NOUN: { code: 'noun', name: 'Danh từ' },
    VERB: { code: 'verb', name: 'Động từ' },
    ADJECTIVE: { code: 'adjective', name: 'Tính từ' },
    ADVERB: { code: 'adverb', name: 'Trạng từ' },
    DETERMINER: { code: 'determiner', name: 'Hạn định từ' },
    PREPOSITION: { code: 'preposition', name: 'Giới từ' },
    IDIOM: { code: 'idiom', name: 'Thành ngữ' },
    PHRASAL_VERB: { code: 'phrasal verb', name: 'Cụm động từ' },
  },

  VOCAB_RELATION_TYPE: {
    SYNONYM: { code: 'synonym', name: 'Đồng nghĩa' },
    ANTONYM: { code: 'antonym', name: 'Trái nghĩa' },
    WORD_FAMILY: { code: 'word_family', name: 'Họ từ' },
    CONFUSABLE: { code: 'confusable', name: 'Dễ nhầm' },
  },

  COURSE_STATUS: {
    NEW: { code: 'NEW', name: 'Mới tạo' },
    IN_REVIEW: { code: 'IN_REVIEW', name: 'Đang xem xét' },
    PUBLISHED: { code: 'PUBLISHED', name: 'Đã xuất bản' },
    ARCHIVED: { code: 'ARCHIVED', name: 'Đã lưu trữ' },
  },

  LESSON_STATUS: {
    NEW: { code: 'NEW', name: 'Mới tạo' },
    IN_REVIEW: { code: 'IN_REVIEW', name: 'Đang xem xét' },
    PUBLISHED: { code: 'PUBLISHED', name: 'Đã xuất bản' },
    ARCHIVED: { code: 'ARCHIVED', name: 'Đã lưu trữ' },
  },

  VISIBILITY: {
    PUBLIC: { code: 'PUBLIC', name: 'Công khai' },
    PRIVATE: { code: 'PRIVATE', name: 'Riêng tư' },
    UNLISTED: { code: 'UNLISTED', name: 'Không công khai' },
    RESTRICTED: { code: 'RESTRICTED', name: 'Hạn chế' },
  },

  LESSON_TYPE: {
    LECTURE: { code: 'LECTURE', name: 'Bài giảng' },
    PRACTICE: { code: 'PRACTICE', name: 'Bài tập' },
    QUIZ: { code: 'QUIZ', name: 'Bài kiểm tra' },
    EXAM: { code: 'EXAM', name: 'Bài thi' },
    ASSIGNMENT: { code: 'ASSIGNMENT', name: 'Bài tập về nhà' },
  },

  LESSON_BLOCK_TYPE: {
    TEXT: { code: 'TEXT', name: 'Văn bản' },
    MARKDOWN: { code: 'MARKDOWN', name: 'Markdown' },
    VIDEO: { code: 'VIDEO', name: 'Video' },
    AUDIO: { code: 'AUDIO', name: 'Âm thanh' },
    IMAGE: { code: 'IMAGE', name: 'Hình ảnh' },
    CALLOUT: { code: 'CALLOUT', name: 'Callout' },
    VOCABULARY_LIST: { code: 'VOCABULARY_LIST', name: 'Từ vựng' },
    GRAMMAR_BOX: { code: 'GRAMMAR_BOX', name: 'Ngữ pháp' },
    INTERACTIVE_QUIZ: { code: 'INTERACTIVE_QUIZ', name: 'Bài tập tương tác' },
    FILE_DOWNLOAD: { code: 'FILE_DOWNLOAD', name: 'Tải xuống tệp' },
  },

  ENROLLMENT_STATUS: {
    NOT_STARTED: { code: 'NOT_STARTED', name: 'Chưa bắt đầu' },
    IN_PROGRESS: { code: 'IN_PROGRESS', name: 'Đang tiến hành' },
    ACTIVE: { code: 'ACTIVE', name: 'Đang hoạt động' },
    COMPLETED: { code: 'COMPLETED', name: 'Đã hoàn thành' },
  },

  QUESTION_TYPE_CODE: {
    SINGLE_CHOICE: { code: 'SINGLE_CHOICE', name: 'Một đáp án' },
    MULTI_CHOICE: { code: 'MULTI_CHOICE', name: 'Nhiều đáp án' },
    TRUE_FALSE_NG: { code: 'TRUE_FALSE_NG', name: 'True / False / Not Given' },
    FILL_BLANK: { code: 'FILL_BLANK', name: 'Điền khuyết' },
    MATCHING: { code: 'MATCHING', name: 'Nối cặp' },
    ESSAY: { code: 'ESSAY', name: 'Tự luận' },
    AUDIO_RECORD: { code: 'AUDIO_RECORD', name: 'Ghi âm' },
  },

  GRADING_STRATEGY: {
    EXACT_MATCH: { code: 'exact_match', name: 'Khớp chính xác' },
    PARTIAL_MATCH: { code: 'partial_match', name: 'Khớp một phần' },
    RUBRIC_MANUAL: { code: 'rubric_manual', name: 'Chấm theo rubric' },
    AI_ASSISTED: { code: 'ai_assisted', name: 'AI hỗ trợ' },
  },

  STIMULUS_TYPE: {
    PASSAGE: { code: 'passage', name: 'Đoạn văn' },
    AUDIO_CONVERSATION: { code: 'audio_conversation', name: 'Hội thoại audio' },
    VIDEO_YOUTUBE: { code: 'video_youtube', name: 'Video YouTube' },
    IMAGE: { code: 'image', name: 'Hình ảnh' },
    TABLE: { code: 'table', name: 'Bảng' },
    CHART: { code: 'chart', name: 'Biểu đồ' },
  },

  DIFFICULTY_LEVEL: {
    VERY_EASY: { code: '1', name: 'Rất dễ' },
    EASY: { code: '2', name: 'Dễ' },
    MEDIUM: { code: '3', name: 'Trung bình' },
    HARD: { code: '4', name: 'Khó' },
    VERY_HARD: { code: '5', name: 'Rất khó' },
  },

  CONTENT_REVIEW_ENTITY: {
    QUESTION: { code: 'question', name: 'Câu hỏi' },
    QUESTION_GROUP: { code: 'question_group', name: 'Nhóm câu hỏi' },
  },

  ASSESSMENT_TYPE: {
    PLACEMENT_TEST: { code: 'PLACEMENT_TEST', name: 'Bài kiểm tra xếp lớp' },
    PRACTICE_TEST: { code: 'PRACTICE_TEST', name: 'Bài kiểm tra thực hành' },
    MOCK_EXAM: { code: 'MOCK_EXAM', name: 'Bài kiểm tra thử' },
    MINI_TEST: { code: 'MINI_TEST', name: 'Bài kiểm tra nhỏ' },
    SECTION_TEST: { code: 'SECTION_TEST', name: 'Bài kiểm tra theo phần' },
  },

  SELECTION_MODE: {
    FIXED: { code: 'FIXED', name: 'Cố định' },
    RANDOM_BY_TOPIC: { code: 'RANDOM_BY_TOPIC', name: 'Ngẫu nhiên theo chủ đề' },
    ADAPTIVE: { code: 'ADAPTIVE', name: 'Thích ứng' },
  },

  SHOW_ANSWERS_POLICY: {
    IMMEDIATE: { code: 'IMMEDIATE', name: 'Hiển thị ngay lập tức' },
    AFTER_SUBMISSION: { code: 'AFTER_SUBMISSION', name: 'Hiển thị sau khi chọn đáp án' },
    AFTER_DUE_DATE: { code: 'AFTER_DUE_DATE', name: 'Hiển thị sau hạn nộp' },
    NEVER: { code: 'NEVER', name: 'Không bao giờ hiển thị' },
  },

  ATTEMPT_STATUS: {
    IN_PROGRESS: { code: 'IN_PROGRESS', name: 'Đang tiến hành' },
    SUBMITTED: { code: 'SUBMITTED', name: 'Đã nộp' },
    GRADING: { code: 'GRADING', name: 'Đang chấm điểm' },
    GRADED: { code: 'GRADED', name: 'Đã chấm điểm' },
    ABANDONED: { code: 'ABANDONED', name: 'Bỏ dở' },
    EXPIRED: { code: 'EXPIRED', name: 'Hết hạn' },
  },

  GRADING_STATUS: {
    PENDING: { code: 'PENDING', name: 'Chờ chấm điểm' },
    AUTO_GRADED: { code: 'AUTO_GRADED', name: 'Đã chấm điểm tự động' },
    TEACHER_GRADED: { code: 'TEACHER_GRADED', name: 'Đã chấm điểm giáo viên' },
    COMPLETED: { code: 'COMPLETED', name: 'Đã hoàn thành' },
    RECHECK_REQUESTED: { code: 'RECHECK_REQUESTED', name: 'Yêu cầu kiểm tra lại' },
  },

  GRADER_TYPE: {
    SYSTEM: { code: 'SYSTEM', name: 'Hệ thống' },
    AI: { code: 'AI', name: 'Trí tuệ nhân tạo' },
    TEACHER: { code: 'TEACHER', name: 'Giáo viên' },
    PEER: { code: 'PEER', name: 'Bạn cùng lớp' },
  },

  FLASHCARD_RATING: {
    AGAIN: { code: 'AGAIN', name: 'Làm lại' },
    HARD: { code: 'HARD', name: 'Khó' },
    GOOD: { code: 'GOOD', name: 'Tốt' },
    EASY: { code: 'EASY', name: 'Dễ' },
  },

  ERROR_TYPE: {
    GRAMMAR: { code: 'GRAMMAR', name: 'Ngữ pháp' },
    VOCABULARY: { code: 'VOCABULARY', name: 'Từ vựng' },
    PRONUNCIATION: { code: 'PRONUNCIATION', name: 'Phát âm' },
    SPELLING: { code: 'SPELLING', name: 'Chính tả' },
    COLLOCATION: { code: 'COLLOCATION', name: 'Cụm từ' },
    COMPREHENSION: { code: 'COMPREHENSION', name: 'Hiểu biết' },
    TIME_MANAGEMENT: { code: 'TIME_MANAGEMENT', name: 'Quản lý thời gian' },
    CARELESS_MISTAKE: { code: 'CARELESS_MISTAKE', name: 'Sai sót do bất cẩn' },
  },

  PRODUCT_TYPE: {
    SUBSCRIPTION: { code: 'SUBSCRIPTION', name: 'Đăng ký' },
    COURSE_ONETIME: { code: 'COURSE_ONETIME', name: 'Khóa học một lần' },
    TEST_PACKAGE: { code: 'TEST_PACKAGE', name: 'Gói bài kiểm tra' },
    GRADING_QUOTA: { code: 'GRADING_QUOTA', name: 'Hạn ngạch chấm điểm' },
    COMBO: { code: 'COMBO', name: 'Combo' },
  },

  ORDER_STATUS: {
    PENDING: { code: 'PENDING', name: 'Đang chờ' },
    PROCESSING: { code: 'PROCESSING', name: 'Đang xử lý' },
    COMPLETED: { code: 'COMPLETED', name: 'Đã hoàn thành' },
    FAILED: { code: 'FAILED', name: 'Thất bại' },
    CANCELLED: { code: 'CANCELLED', name: 'Đã hủy' },
    REFUNDED: { code: 'REFUNDED', name: 'Đã hoàn tiền' },
  },

  PAYMENT_STATUS: {
    PENDING: { code: 'PENDING', name: 'Đang chờ' },
    AUTHORIZED: { code: 'AUTHORIZED', name: 'Đã ủy quyền' },
    CAPTURED: { code: 'CAPTURED', name: 'Đã thanh toán' },
    FAILED: { code: 'FAILED', name: 'Thất bại' },
    REFUNDED: { code: 'REFUNDED', name: 'Đã hoàn tiền' },
    REVERSED: { code: 'REVERSED', name: 'Đã hoàn tác' },
  },

  SUBSCRIPTION_STATUS: {
    TRIALING: { code: 'TRIALING', name: 'Đang dùng thử' },
    ACTIVE: { code: 'ACTIVE', name: 'Đang hoạt động' },
    PAST_DUE: { code: 'PAST_DUE', name: 'Quá hạn thanh toán' },
    CANCELLED: { code: 'CANCELLED', name: 'Đã hủy' },
    UNPAID: { code: 'UNPAID', name: 'Chưa thanh toán' },
    INCOMPLETE: { code: 'INCOMPLETE', name: 'Chưa hoàn tất' },
    EXPIRED: { code: 'EXPIRED', name: 'Đã hết hạn' },
  },

  CLASSROOM_STATUS: {
    NEW: { code: 'NEW', name: 'Mới tạo' },
    ACTIVE: { code: 'ACTIVE', name: 'Đang hoạt động' },
    COMPLETED: { code: 'COMPLETED', name: 'Đã hoàn thành' },
    ARCHIVED: { code: 'ARCHIVED', name: 'Đã lưu trữ' },
  },

  TICKET_STATUS: {
    OPEN: { code: 'OPEN', name: 'Đang mở' },
    IN_PROGRESS: { code: 'IN_PROGRESS', name: 'Đang xử lý' },
    WAITING_CUSTOMER: {
      code: 'WAITING_CUSTOMER',
      name: 'Đang chờ khách hàng',
    },
    RESOLVED: { code: 'RESOLVED', name: 'Đã giải quyết' },
    CLOSED: { code: 'CLOSED', name: 'Đã đóng' },
  },

  TICKET_PRIORITY: {
    LOW: { code: 'LOW', name: 'Thấp' },
    MEDIUM: { code: 'MEDIUM', name: 'Trung bình' },
    HIGH: { code: 'HIGH', name: 'Cao' },
    URGENT: { code: 'URGENT', name: 'Khẩn cấp' },
  },

  MEDIA_ASSET_TYPE: {
    AUDIO: { code: 'AUDIO', name: 'Âm thanh' },
    VIDEO: { code: 'VIDEO', name: 'Video' },
    IMAGE: { code: 'IMAGE', name: 'Hình ảnh' },
    DOCUMENT: { code: 'DOCUMENT', name: 'Tài liệu' },
    TRANSCRIPT: { code: 'TRANSCRIPT', name: 'Bản chép lời' },
  },

  OTP_PURPOSE: {
    EMAIL_VERIFICATION: {
      code: 'EMAIL_VERIFICATION',
      name: 'Xác minh email',
    },
    PHONE_VERIFICATION: {
      code: 'PHONE_VERIFICATION',
      name: 'Xác minh số điện thoại',
    },
    PASSWORD_RESET: {
      code: 'PASSWORD_RESET',
      name: 'Đặt lại mật khẩu',
    },
    LOGIN_2FA: {
      code: 'LOGIN_2FA',
      name: 'Xác thực đăng nhập hai bước',
    },
  },

  ARENA_MATCH_MODE: {
    QUICKPLAY: { code: 'QUICKPLAY', name: 'Chơi nhanh' },
    RANKED: { code: 'RANKED', name: 'Xếp hạng' },
    FRIENDLY: { code: 'FRIENDLY', name: 'Giao hữu' },
    TOURNAMENT: { code: 'TOURNAMENT', name: 'Giải đấu' },
  },

  ARENA_MATCH_STATUS: {
    WAITING: { code: 'WAITING', name: 'Đang chờ' },
    IN_PROGRESS: { code: 'IN_PROGRESS', name: 'Đang diễn ra' },
    FINISHED: { code: 'FINISHED', name: 'Đã kết thúc' },
    CANCELLED: { code: 'CANCELLED', name: 'Đã hủy' },
  },

  ARENA_PARTICIPANT_RESULT: {
    WIN: { code: 'WIN', name: 'Thắng' },
    LOSS: { code: 'LOSS', name: 'Thua' },
    DRAW: { code: 'DRAW', name: 'Hòa' },
    FORFEIT: { code: 'FORFEIT', name: 'Bỏ cuộc' },
  },

  LEADERBOARD_BOARD_TYPE: {
    ARENA_ELO: { code: 'ARENA_ELO', name: 'ELO đấu trường' },
    STUDY_POINTS: { code: 'STUDY_POINTS', name: 'Điểm học tập' },
    STREAK: { code: 'STREAK', name: 'Chuỗi học tập' },
    EXAM_SCORE: { code: 'EXAM_SCORE', name: 'Điểm bài thi' },
  },

  LEADERBOARD_PERIOD: {
    DAILY: { code: 'DAILY', name: 'Hằng ngày' },
    WEEKLY: { code: 'WEEKLY', name: 'Hằng tuần' },
    MONTHLY: { code: 'MONTHLY', name: 'Hằng tháng' },
    ALL_TIME: { code: 'ALL_TIME', name: 'Toàn thời gian' },
  },

  ACHIEVEMENT_CATEGORY: {
    STUDY_STREAK: { code: 'STUDY_STREAK', name: 'Chuỗi học tập' },
    ARENA: { code: 'ARENA', name: 'Đấu trường' },
    VOCABULARY: { code: 'VOCABULARY', name: 'Từ vựng' },
    EXAM_SCORE: { code: 'EXAM_SCORE', name: 'Điểm bài thi' },
    COURSE_COMPLETION: {
      code: 'COURSE_COMPLETION',
      name: 'Hoàn thành khóa học',
    },
    SOCIAL: { code: 'SOCIAL', name: 'Xã hội' },
  },

  AI_JOB_STATUS: {
    PENDING: { code: 'PENDING', name: 'Đang chờ' },
    PROCESSING: { code: 'PROCESSING', name: 'Đang xử lý' },
    COMPLETED: { code: 'COMPLETED', name: 'Đã hoàn thành' },
    FAILED: { code: 'FAILED', name: 'Thất bại' },
    RETRYING: { code: 'RETRYING', name: 'Đang thử lại' },
  },

  PROGRESS_STATUS: {
    NOT_STARTED: { code: 'NOT_STARTED', name: 'Chưa bắt đầu' },
    IN_PROGRESS: { code: 'IN_PROGRESS', name: 'Đang thực hiện' },
    COMPLETED: { code: 'COMPLETED', name: 'Đã hoàn thành' },
  },

  ORG_STATUS: {
    ACTIVE: { code: 'active', name: 'Đang hoạt động' },
    SUSPENDED: { code: 'suspended', name: 'Tạm ngưng' },
    ARCHIVED: { code: 'archived', name: 'Đã lưu trữ' },
  },

  CLASSROOM_MEMBER_STATUS: {
    ACTIVE: { code: 'active', name: 'Đang học' },
    LEFT: { code: 'left', name: 'Đã rời' },
    REMOVED: { code: 'removed', name: 'Bị xóa' },
  },

  ASSIGNMENT_TYPE: {
    ASSESSMENT: { code: 'assessment', name: 'Đề thi' },
    LESSON: { code: 'lesson', name: 'Bài học' },
    VOCABULARY_DECK: { code: 'vocabulary_deck', name: 'Bộ từ vựng' },
    CUSTOM_TASK: { code: 'custom_task', name: 'Tùy chỉnh' },
  },

  ASSIGNMENT_SUBMISSION_STATUS: {
    SUBMITTED: { code: 'submitted', name: 'Đã nộp' },
    GRADED: { code: 'graded', name: 'Đã chấm' },
    LATE: { code: 'late', name: 'Nộp trễ' },
    MISSING: { code: 'missing', name: 'Thiếu bài' },
  },

  ENTITLEMENT_RESOURCE_TYPE: {
    COURSE: { code: 'course', name: 'Khóa học' },
    EXAM_TYPE: { code: 'exam_type', name: 'Loại kỳ thi' },
    ASSESSMENT: { code: 'assessment', name: 'Đề thi' },
    GRADING_QUOTA: { code: 'grading_quota', name: 'Hạn ngạch chấm' },
    ALL_ACCESS: { code: 'all_access', name: 'Toàn quyền' },
  },

  ACCESS_LEVEL: {
    PREVIEW: { code: 'preview', name: 'Xem trước' },
    STANDARD: { code: 'standard', name: 'Tiêu chuẩn' },
    PREMIUM: { code: 'premium', name: 'Cao cấp' },
    FULL: { code: 'full', name: 'Đầy đủ' },
  },

  ENTITLEMENT_SOURCE_TYPE: {
    ORDER: { code: 'order', name: 'Đơn hàng' },
    SUBSCRIPTION: { code: 'subscription', name: 'Gói đăng ký' },
    PROMOTION: { code: 'promotion', name: 'Khuyến mãi' },
    MANUAL_GRANT: { code: 'manual_grant', name: 'Cấp tay' },
  },

  ENTITLEMENT_STATUS: {
    ACTIVE: { code: 'active', name: 'Hiệu lực' },
    EXPIRED: { code: 'expired', name: 'Hết hạn' },
    REVOKED: { code: 'revoked', name: 'Thu hồi' },
  },

  VOCAB_SRS_STATE: {
    NEW: { code: 'new', name: 'Mới' },
    LEARNING: { code: 'learning', name: 'Đang học' },
    REVIEW: { code: 'review', name: 'Ôn tập' },
    MASTERED: { code: 'mastered', name: 'Thành thạo' },
    LAPSED: { code: 'lapsed', name: 'Quên' },
  },

  VOCAB_DECK_OWNER_TYPE: {
    SYSTEM: { code: 'system', name: 'Hệ thống' },
    TEACHER: { code: 'teacher', name: 'Giáo viên' },
    USER: { code: 'user', name: 'Người dùng' },
  },

  VOCAB_STUDY_MODE: {
    FLASHCARD: { code: 'FLASHCARD', name: 'Flashcard SRS' },
    QUIZ: { code: 'QUIZ', name: 'Quiz trắc nghiệm' },
  },

  LEARNING_PATH_STATUS: {
    ACTIVE: { code: 'active', name: 'Đang dùng' },
    COMPLETED: { code: 'completed', name: 'Hoàn thành' },
    SUPERSEDED: { code: 'superseded', name: 'Bị thay thế' },
  },

  LEARNING_PATH_GENERATOR: {
    RULE_ENGINE: { code: 'rule_engine', name: 'Luật' },
    AI_ADAPTIVE: { code: 'ai_adaptive', name: 'AI thích ứng' },
    COACH: { code: 'coach', name: 'Giáo viên' },
  },

  LEARNING_PATH_ITEM_TYPE: {
    LESSON: { code: 'lesson', name: 'Bài học' },
    FLASHCARD_REVIEW: { code: 'flashcard_review', name: 'Ôn flashcard' },
    PRACTICE_SET: { code: 'practice_set', name: 'Bài luyện' },
    MOCK_EXAM: { code: 'mock_exam', name: 'Thi thử' },
    ERROR_REVIEW: { code: 'error_review', name: 'Ôn lỗi' },
  },

  /**
   * Không còn `VOCABULARY` — SRS từ vựng có bảng riêng `user_vocabulary_states`.
   */
  MASTERY_ENTITY_TYPE: {
    SKILL: { code: 'skill', name: 'Kỹ năng' },
    TOPIC: { code: 'topic', name: 'Chủ đề' },
    GRAMMAR: { code: 'grammar', name: 'Ngữ pháp' },
    QUESTION: { code: 'question', name: 'Câu hỏi' },
  },

  ARENA_QUEUE_STATUS: {
    WAITING: { code: 'WAITING', name: 'Đang chờ' },
    MATCHED: { code: 'MATCHED', name: 'Đã ghép' },
    CANCELLED: { code: 'CANCELLED', name: 'Đã hủy' },
    EXPIRED: { code: 'EXPIRED', name: 'Hết hạn' },
  },

  ARENA_SEASON_STATUS: {
    UPCOMING: { code: 'UPCOMING', name: 'Sắp diễn ra' },
    ACTIVE: { code: 'ACTIVE', name: 'Đang diễn ra' },
    CLOSED: { code: 'CLOSED', name: 'Đã đóng' },
  },

  ARENA_CHALLENGE_STATUS: {
    PENDING: { code: 'PENDING', name: 'Chờ phản hồi' },
    ACCEPTED: { code: 'ACCEPTED', name: 'Đã chấp nhận' },
    DECLINED: { code: 'DECLINED', name: 'Từ chối' },
    EXPIRED: { code: 'EXPIRED', name: 'Hết hạn' },
    COMPLETED: { code: 'COMPLETED', name: 'Hoàn thành' },
  },

  POINT_REASON: {
    ARENA_WIN: { code: 'ARENA_WIN', name: 'Thắng arena' },
    ARENA_LOSS: { code: 'ARENA_LOSS', name: 'Thua arena' },
    STREAK: { code: 'STREAK', name: 'Chuỗi ngày học' },
    REVIEW: { code: 'REVIEW', name: 'Ôn từ vựng' },
    LESSON: { code: 'LESSON', name: 'Hoàn thành bài học' },
    ASSESSMENT: { code: 'ASSESSMENT', name: 'Làm bài thi' },
    DAILY_CHALLENGE: { code: 'DAILY_CHALLENGE', name: 'Thử thách ngày' },
    ACHIEVEMENT: { code: 'ACHIEVEMENT', name: 'Huy hiệu' },
    REFERRAL: { code: 'REFERRAL', name: 'Giới thiệu' },
    PURCHASE: { code: 'PURCHASE', name: 'Mua hàng' },
    MANUAL: { code: 'MANUAL', name: 'Điều chỉnh tay' },
  },

  CERTIFICATE_SOURCE_TYPE: {
    ASSESSMENT: { code: 'assessment', name: 'Bài thi' },
    COURSE: { code: 'course', name: 'Khóa học' },
  },

  CERTIFICATE_STATUS: {
    ISSUED: { code: 'ISSUED', name: 'Đã cấp' },
    REVOKED: { code: 'REVOKED', name: 'Thu hồi' },
  },

  INVOICE_STATUS: {
    DRAFT: { code: 'DRAFT', name: 'Nháp' },
    ISSUED: { code: 'ISSUED', name: 'Đã phát hành' },
    PAID: { code: 'PAID', name: 'Đã thanh toán' },
    VOID: { code: 'VOID', name: 'Hủy' },
  },

  DAILY_CHALLENGE_TYPE: {
    VOCAB_REVIEW: { code: 'VOCAB_REVIEW', name: 'Ôn từ vựng' },
    ARENA_MATCH: { code: 'ARENA_MATCH', name: 'Đấu arena' },
    LESSON: { code: 'LESSON', name: 'Học bài' },
    STREAK: { code: 'STREAK', name: 'Giữ streak' },
    ASSESSMENT: { code: 'ASSESSMENT', name: 'Làm đề' },
  },

  REVIEW_SESSION_STATUS: {
    IN_PROGRESS: { code: 'IN_PROGRESS', name: 'Đang ôn' },
    COMPLETED: { code: 'COMPLETED', name: 'Hoàn thành' },
    ABANDONED: { code: 'ABANDONED', name: 'Bỏ dở' },
  },

  /** Phân loại `taxonomies` — gộp `topics` + `tags` cũ. */
  TAXONOMY_KIND: {
    TOPIC: { code: 'TOPIC', name: 'Chủ đề' },
    TAG: { code: 'TAG', name: 'Nhãn' },
    CATEGORY: { code: 'CATEGORY', name: 'Danh mục' },
  },

  /** Cấp node trong cây `exam_structures` — gộp `exam_skills` + `exam_sections` cũ. */
  EXAM_NODE_TYPE: {
    SKILL: { code: 'SKILL', name: 'Kỹ năng' },
    SECTION: { code: 'SECTION', name: 'Phần' },
    PART: { code: 'PART', name: 'Part' },
  },

  /** Mục đích file trong `media_attachments` (N file đa hình). */
  MEDIA_PURPOSE: {
    IMAGE: { code: 'IMAGE', name: 'Hình ảnh' },
    AUDIO: { code: 'AUDIO', name: 'Âm thanh' },
    RESOURCE: { code: 'RESOURCE', name: 'Tài liệu kèm' },
    SUBMISSION: { code: 'SUBMISSION', name: 'Bài nộp' },
    GALLERY: { code: 'GALLERY', name: 'Thư viện ảnh' },
  },

  CONTENT_PAGE_STATUS: {
    DRAFT: { code: 'DRAFT', name: 'Nháp' },
    PUBLISHED: { code: 'PUBLISHED', name: 'Đã xuất bản' },
  },

  /** Loại phiên học nhẹ trong `study_sessions`. */
  STUDY_SESSION_TYPE: {
    VOCAB_REVIEW: { code: 'VOCAB_REVIEW', name: 'Ôn từ vựng' },
    VOCAB_GAME: { code: 'VOCAB_GAME', name: 'Game từ vựng' },
    DICTATION: { code: 'DICTATION', name: 'Nghe chép chính tả' },
    READING: { code: 'READING', name: 'Luyện đọc' },
    QUESTION_PRACTICE: { code: 'QUESTION_PRACTICE', name: 'Luyện câu hỏi' },
  },

  /** Loại luồng hội thoại. Ticket hỗ trợ KHÔNG dùng bảng này. */
  CONVERSATION_TYPE: {
    AI_TUTOR: { code: 'AI_TUTOR', name: 'Hội thoại AI' },
    SPEAKING_ROOM: { code: 'SPEAKING_ROOM', name: 'Phòng luyện nói' },
    CLASSROOM: { code: 'CLASSROOM', name: 'Thông báo lớp học' },
  },

  CONVERSATION_STATUS: {
    OPEN: { code: 'OPEN', name: 'Đang mở' },
    CLOSED: { code: 'CLOSED', name: 'Đã đóng' },
  },

  /** Vai trò người gửi tin trong `conversation_messages`. */
  CONVERSATION_ROLE: {
    USER: { code: 'USER', name: 'Người dùng' },
    AI: { code: 'AI', name: 'Trợ lý AI' },
    SYSTEM: { code: 'SYSTEM', name: 'Hệ thống' },
  },

  CONVERSATION_PARTICIPANT_ROLE: {
    HOST: { code: 'HOST', name: 'Chủ phòng' },
    MEMBER: { code: 'MEMBER', name: 'Thành viên' },
  },

  /** Vai trò người gửi tin trong `support_ticket_messages`. */
  TICKET_SENDER_ROLE: {
    USER: { code: 'USER', name: 'Khách hàng' },
    AGENT: { code: 'AGENT', name: 'Nhân viên hỗ trợ' },
    SYSTEM: { code: 'SYSTEM', name: 'Hệ thống' },
  },

  TICKET_CATEGORY: {
    ACCOUNT: { code: 'ACCOUNT', name: 'Tài khoản' },
    PAYMENT: { code: 'PAYMENT', name: 'Thanh toán' },
    CONTENT_ERROR: { code: 'CONTENT_ERROR', name: 'Nội dung sai' },
    TECHNICAL: { code: 'TECHNICAL', name: 'Lỗi kỹ thuật' },
    GRADING: { code: 'GRADING', name: 'Chấm bài' },
    OTHER: { code: 'OTHER', name: 'Khác' },
  },

  NOTIFICATION_TYPE: {
    SYSTEM: { code: 'SYSTEM', name: 'Hệ thống' },
    LEARNING_REMINDER: { code: 'LEARNING_REMINDER', name: 'Nhắc học' },
    REVIEW_DUE: { code: 'REVIEW_DUE', name: 'Đến hạn ôn tập' },
    ARENA: { code: 'ARENA', name: 'Đấu trường' },
    ACHIEVEMENT: { code: 'ACHIEVEMENT', name: 'Huy hiệu' },
    ORDER: { code: 'ORDER', name: 'Đơn hàng' },
    CLASSROOM: { code: 'CLASSROOM', name: 'Lớp học' },
    SUPPORT: { code: 'SUPPORT', name: 'Hỗ trợ' },
    GRADING_DONE: { code: 'GRADING_DONE', name: 'Đã chấm xong' },
  },

  DISCOUNT_TYPE: {
    PERCENT: { code: 'PERCENT', name: 'Phần trăm' },
    FIXED_AMOUNT: { code: 'FIXED_AMOUNT', name: 'Số tiền cố định' },
  },

  REWARD_TYPE: {
    POINTS: { code: 'POINTS', name: 'Điểm thưởng' },
    DISCOUNT: { code: 'DISCOUNT', name: 'Giảm giá' },
    FREE_DAYS: { code: 'FREE_DAYS', name: 'Ngày dùng miễn phí' },
  },

  BILLING_PERIOD: {
    ONE_TIME: { code: 'ONE_TIME', name: 'Một lần' },
    MONTHLY: { code: 'MONTHLY', name: 'Hằng tháng' },
    QUARTERLY: { code: 'QUARTERLY', name: 'Hằng quý' },
    YEARLY: { code: 'YEARLY', name: 'Hằng năm' },
  },

  ORG_MEMBER_ROLE: {
    OWNER: { code: 'OWNER', name: 'Chủ tổ chức' },
    ADMIN: { code: 'ADMIN', name: 'Quản trị' },
    TEACHER: { code: 'TEACHER', name: 'Giáo viên' },
    MEMBER: { code: 'MEMBER', name: 'Thành viên' },
  },
} as const;
