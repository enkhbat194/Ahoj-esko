import type { ContentQaStatus, CzechNounGender, LearnerSelfForm } from '../types/lesson';

export interface CanonicalItem {
  id: string;
  learningPriority: 'production' | 'receptive' | 'optional';
  register: 'formal' | 'informal' | 'neutral';
  agreementType: 'invariant' | 'learner_self';
  subject: 'none' | 'learner';
  csFixed?: string;
  csVariants?: { masculine: string; feminine: string };
  phoneticMn: string;
  meaningMn: string;
  lemmaGroup?: string;
  grammarTargets: string[];
  qaStatus: ContentQaStatus;
}

export interface CanonicalDialogueTurn {
  turnId: string;
  speakerId: 'A' | 'B';
  speakerNameMn: string;
  personaGender: LearnerSelfForm;
  textCs: string;
  phoneticMn: string;
  textMn: string;
  qaStatus: ContentQaStatus;
}

export interface CanonicalDialogue {
  dialogueId: string;
  titleMn: string;
  register: 'formal' | 'informal';
  qaStatus: ContentQaStatus;
  turns: CanonicalDialogueTurn[];
}

export interface PronunciationScaffoldItem {
  id: string;
  textCs: string;
  displaySyllables: string[];
  phoneticMn: string;
  meaningMn: string;
  contrastPair?: {
    shortWord: string;
    shortMeaningMn: string;
    longWord: string;
    longMeaningMn: string;
    contrastNoteMn: string;
  };
  segmentationNoteMn: string;
}

export interface CanonicalExercise {
  exerciseId: string;
  type: 'comprehension' | 'speaking_retrieval' | 'repair_request' | 'gender_self_form' | 'free_roleplay';
  promptMn: string;
  targetIntent: string;
  acceptableAnswersMn?: string[];
  exampleCs?: string;
  expectedBySelfForm?: {
    masculine: string;
    feminine: string;
  };
  evaluationNoteMn: string;
  qaStatus: ContentQaStatus;
}

export interface GenderColorExample {
  nounCs: string;
  meaningMn: string;
  gender: CzechNounGender;
  suffixHintMn: string;
}

export const CANONICAL_A0_M01_L01 = {
  lessonId: 'CZ-A0-M01-L01',
  level: 'A0',
  status: 'draft_ai' as ContentQaStatus,
  titleMn: 'A0 · Модуль 1 · Хичээл 1: Анхны уулзалт ба танилцах',
  missionMn: 'Эелдэг мэндлэх, өөрийн нэр болон Монголоос ирснээ хэлэх, ойлгоогүй үед дахин асуух.',
  estimatedMinutes: '15–20 мин',
  qaNoteMn: 'Төлөв: Ноорог (draft_ai) — Чех болон Монгол эх хэлний редактор шалгах шат хүлээгдэж байна.',

  items: [
    {
      id: 'CZ-A0-M01-L01-PH001',
      learningPriority: 'production',
      register: 'formal',
      agreementType: 'invariant',
      subject: 'none',
      csFixed: 'Dobrý den.',
      phoneticMn: 'Добрий дэн.',
      meaningMn: 'Сайн байна уу. (албан ёсны)',
      lemmaGroup: 'greet',
      grammarTargets: [],
      qaStatus: 'draft_ai',
    },
    {
      id: 'CZ-A0-M01-L01-PH002',
      learningPriority: 'receptive',
      register: 'informal',
      agreementType: 'invariant',
      subject: 'none',
      csFixed: 'Ahoj.',
      phoneticMn: 'Ахой.',
      meaningMn: 'Сайн уу / Баяртай. (дотно)',
      lemmaGroup: 'greet',
      grammarTargets: [],
      qaStatus: 'draft_ai',
    },
    {
      id: 'CZ-A0-M01-L01-PH003',
      learningPriority: 'production',
      register: 'neutral',
      agreementType: 'invariant',
      subject: 'none',
      csFixed: 'Jmenuji se Bat.',
      phoneticMn: 'Ймэнуйи сэ Бат.',
      meaningMn: 'Намайг Бат гэдэг.',
      lemmaGroup: 'jmenovat',
      grammarTargets: [],
      qaStatus: 'draft_ai',
    },
    {
      id: 'CZ-A0-M01-L01-PH004',
      learningPriority: 'production',
      register: 'formal',
      agreementType: 'invariant',
      subject: 'none',
      csFixed: 'Jak se jmenujete?',
      phoneticMn: 'Як сэ ймэнуетэ?',
      meaningMn: 'Таныг хэн гэдэг вэ? (албан)',
      lemmaGroup: 'jmenovat',
      grammarTargets: ['ty_vy'],
      qaStatus: 'draft_ai',
    },
    {
      id: 'CZ-A0-M01-L01-PH005',
      learningPriority: 'receptive',
      register: 'informal',
      agreementType: 'invariant',
      subject: 'none',
      csFixed: 'Jak se jmenuješ?',
      phoneticMn: 'Як сэ ймэнуеш?',
      meaningMn: 'Чамайг хэн гэдэг вэ? (дотно)',
      lemmaGroup: 'jmenovat',
      grammarTargets: ['ty_vy'],
      qaStatus: 'draft_ai',
    },
    {
      id: 'CZ-A0-M01-L01-PH006',
      learningPriority: 'receptive',
      register: 'neutral',
      agreementType: 'invariant',
      subject: 'none',
      csFixed: 'Těší mě.',
      phoneticMn: 'Тешии мне.',
      meaningMn: 'Танилцсандаа таатай байна.',
      lemmaGroup: 'tesit',
      grammarTargets: [],
      qaStatus: 'draft_ai',
    },
    {
      id: 'CZ-A0-M01-L01-PH007',
      learningPriority: 'production',
      register: 'formal',
      agreementType: 'invariant',
      subject: 'none',
      csFixed: 'Odkud jste?',
      phoneticMn: 'Одкүд стэ?',
      meaningMn: 'Та хаанаас ирсэн бэ? (албан)',
      lemmaGroup: 'odkud',
      grammarTargets: ['ty_vy'],
      qaStatus: 'draft_ai',
    },
    {
      id: 'CZ-A0-M01-L01-PH008',
      learningPriority: 'receptive',
      register: 'informal',
      agreementType: 'invariant',
      subject: 'none',
      csFixed: 'Odkud jsi?',
      phoneticMn: 'Одкүд си?',
      meaningMn: 'Чи хаанаас ирсэн бэ? (дотно)',
      lemmaGroup: 'odkud',
      grammarTargets: ['ty_vy'],
      qaStatus: 'draft_ai',
    },
    {
      id: 'CZ-A0-M01-L01-PH009',
      learningPriority: 'production',
      register: 'neutral',
      agreementType: 'invariant',
      subject: 'none',
      csFixed: 'Jsem z Mongolska.',
      phoneticMn: 'Сэм з Монголска.',
      meaningMn: 'Би Монголоос ирсэн.',
      lemmaGroup: 'origin',
      grammarTargets: [],
      qaStatus: 'draft_ai',
    },
    {
      id: 'CZ-A0-M01-L01-PH010',
      learningPriority: 'production',
      register: 'neutral',
      agreementType: 'invariant',
      subject: 'none',
      csFixed: 'Nerozumím.',
      phoneticMn: 'Нэрозумиим.',
      meaningMn: 'Би ойлгохгүй байна.',
      lemmaGroup: 'rozumet',
      grammarTargets: [],
      qaStatus: 'draft_ai',
    },
    {
      id: 'CZ-A0-M01-L01-PH011',
      learningPriority: 'production',
      register: 'formal',
      agreementType: 'invariant',
      subject: 'none',
      csFixed: 'Můžete to prosím zopakovat?',
      phoneticMn: 'Муужэтэ то просиим зопаковат?',
      meaningMn: 'Та үүнийг дахин хэлж өгч болох уу?',
      lemmaGroup: 'repair',
      grammarTargets: ['ty_vy'],
      qaStatus: 'draft_ai',
    },
    {
      id: 'CZ-A0-M01-L01-PH012',
      learningPriority: 'receptive',
      register: 'formal',
      agreementType: 'invariant',
      subject: 'none',
      csFixed: 'Můžete prosím mluvit pomaleji?',
      phoneticMn: 'Муужэтэ просиим млувит помалэи?',
      meaningMn: 'Та арай удаан ярьж өгч болох уу?',
      lemmaGroup: 'repair',
      grammarTargets: ['ty_vy'],
      qaStatus: 'draft_ai',
    },
    {
      id: 'CZ-A0-M01-L01-PH013',
      learningPriority: 'optional',
      register: 'neutral',
      agreementType: 'learner_self',
      subject: 'learner',
      csVariants: {
        masculine: 'Jsem Mongol.',
        feminine: 'Jsem Mongolka.',
      },
      phoneticMn: 'Сэм Монгол / Сэм Монголка.',
      meaningMn: 'Би монгол хүн. (Өөрийн хүйсээр хувирна)',
      lemmaGroup: 'nationality',
      grammarTargets: ['learner_self_form'],
      qaStatus: 'draft_ai',
    },
  ] satisfies CanonicalItem[],

  dialogues: [
    {
      dialogueId: 'CZ-A0-M01-L01-D01',
      titleMn: 'Албан ёсны анхны танилцуулга (vy)',
      register: 'formal',
      qaStatus: 'draft_ai',
      turns: [
        {
          turnId: 'CZ-A0-M01-L01-D01-T01',
          speakerId: 'A',
          speakerNameMn: 'Яна (Чех)',
          personaGender: 'feminine',
          textCs: 'Dobrý den. Jmenuji se Jana. Jak se jmenujete?',
          phoneticMn: 'Добрий дэн. Ймэнуйи сэ Яна. Як сэ ймэнуетэ?',
          textMn: 'Сайн байна уу. Намайг Яна гэдэг. Таныг хэн гэдэг вэ?',
          qaStatus: 'draft_ai',
        },
        {
          turnId: 'CZ-A0-M01-L01-D01-T02',
          speakerId: 'B',
          speakerNameMn: 'Бат (Суралцагч)',
          personaGender: 'masculine',
          textCs: 'Dobrý den. Jmenuji se Bat.',
          phoneticMn: 'Добрий дэн. Ймэнуйи сэ Бат.',
          textMn: 'Сайн байна уу. Намайг Бат гэдэг.',
          qaStatus: 'draft_ai',
        },
        {
          turnId: 'CZ-A0-M01-L01-D01-T03',
          speakerId: 'A',
          speakerNameMn: 'Яна (Чех)',
          personaGender: 'feminine',
          textCs: 'Těší mě.',
          phoneticMn: 'Тешии мне.',
          textMn: 'Танилцсандаа таатай байна.',
          qaStatus: 'draft_ai',
        },
        {
          turnId: 'CZ-A0-M01-L01-D01-T04',
          speakerId: 'B',
          speakerNameMn: 'Бат (Суралцагч)',
          personaGender: 'masculine',
          textCs: 'Mě také.',
          phoneticMn: 'Мне такээ.',
          textMn: 'Надад ч бас таатай байна.',
          qaStatus: 'draft_ai',
        },
        {
          turnId: 'CZ-A0-M01-L01-D01-T05',
          speakerId: 'A',
          speakerNameMn: 'Яна (Чех)',
          personaGender: 'feminine',
          textCs: 'Odkud jste?',
          phoneticMn: 'Одкүд стэ?',
          textMn: 'Та хаанаас ирсэн бэ?',
          qaStatus: 'draft_ai',
        },
        {
          turnId: 'CZ-A0-M01-L01-D01-T06',
          speakerId: 'B',
          speakerNameMn: 'Бат (Суралцагч)',
          personaGender: 'masculine',
          textCs: 'Promiňte, nerozumím. Můžete to prosím zopakovat?',
          phoneticMn: 'Проминьтэ, нэрозумиим. Муужэтэ то просиим зопаковат?',
          textMn: 'Уучлаарай, би ойлгосонгүй. Та үүнийг дахин хэлж өгч болох уу?',
          qaStatus: 'draft_ai',
        },
        {
          turnId: 'CZ-A0-M01-L01-D01-T07',
          speakerId: 'A',
          speakerNameMn: 'Яна (Чех)',
          personaGender: 'feminine',
          textCs: 'Odkud jste?',
          phoneticMn: 'Одкүд стэ?',
          textMn: 'Та хаанаас ирсэн бэ?',
          qaStatus: 'draft_ai',
        },
        {
          turnId: 'CZ-A0-M01-L01-D01-T08',
          speakerId: 'B',
          speakerNameMn: 'Бат (Суралцагч)',
          personaGender: 'masculine',
          textCs: 'Jsem z Mongolska.',
          phoneticMn: 'Сэм з Монголска.',
          textMn: 'Би Монголоос ирсэн.',
          qaStatus: 'draft_ai',
        },
      ],
    },
    {
      dialogueId: 'CZ-A0-M01-L01-D02',
      titleMn: 'Дотно энгийн танилцуулга (ty)',
      register: 'informal',
      qaStatus: 'draft_ai',
      turns: [
        {
          turnId: 'CZ-A0-M01-L01-D02-T01',
          speakerId: 'A',
          speakerNameMn: 'Эва',
          personaGender: 'feminine',
          textCs: 'Ahoj! Já jsem Eva. Jak se jmenuješ?',
          phoneticMn: 'Ахой! Яа сэм Эва. Як сэ ймэнуеш?',
          textMn: 'Сайн уу! Би Эва байна. Чамайг хэн гэдэг вэ?',
          qaStatus: 'draft_ai',
        },
        {
          turnId: 'CZ-A0-M01-L01-D02-T02',
          speakerId: 'B',
          speakerNameMn: 'Бат',
          personaGender: 'masculine',
          textCs: 'Ahoj! Já jsem Bat.',
          phoneticMn: 'Ахой! Яа сэм Бат.',
          textMn: 'Сайн уу! Намайг Бат гэдэг.',
          qaStatus: 'draft_ai',
        },
        {
          turnId: 'CZ-A0-M01-L01-D02-T03',
          speakerId: 'A',
          speakerNameMn: 'Эва',
          personaGender: 'feminine',
          textCs: 'Odkud jsi?',
          phoneticMn: 'Одкүд си?',
          textMn: 'Чи хаанаас ирсэн бэ?',
          qaStatus: 'draft_ai',
        },
        {
          turnId: 'CZ-A0-M01-L01-D02-T04',
          speakerId: 'B',
          speakerNameMn: 'Бат',
          personaGender: 'masculine',
          textCs: 'Z Mongolska. A ty?',
          phoneticMn: 'З Монголска. А ти?',
          textMn: 'Монголоос. Харин чи?',
          qaStatus: 'draft_ai',
        },
        {
          turnId: 'CZ-A0-M01-L01-D02-T05',
          speakerId: 'A',
          speakerNameMn: 'Эва',
          personaGender: 'feminine',
          textCs: 'Z Česka.',
          phoneticMn: 'З Чэска.',
          textMn: 'Чехээс.',
          qaStatus: 'draft_ai',
        },
      ],
    },
  ] satisfies CanonicalDialogue[],

  pronunciation: [
    {
      id: 'pron-jmenuji',
      textCs: 'Jmenuji',
      displaySyllables: ['jme', 'nu', 'ji'],
      phoneticMn: 'ймэ · нү · йи',
      meaningMn: 'нэрлэгдэх / миний нэр...',
      segmentationNoteMn:
        'Эхний үе дээр өргөлт орно (JME-nu-ji). Эхний «J» маш хөнгөн дуудагдаж «m»-тэй нийлнэ.',
    },
    {
      id: 'pron-prosim',
      textCs: 'Prosím',
      displaySyllables: ['pro', 'sím'],
      phoneticMn: 'про · сиим',
      meaningMn: 'Гуйя / Тэгээрэй',
      contrastPair: {
        shortWord: 'byt',
        shortMeaningMn: 'байр (богино i/y)',
        longWord: 'být',
        longMeaningMn: 'байх (урт ý)',
        contrastNoteMn:
          'Чех хэлэнд өргөлт 1-р үе дээр, харин урт эгшиг (á, é, í, ý, ó, ú/ů) нь өөр утга ялгадаг.',
      },
      segmentationNoteMn:
        '«pro» богино, «sím» урт эгшигтэй (PRO-siim) — эгшгийн урт өргөлтөөс тусдаа.',
    },
    {
      id: 'pron-nerozumim',
      textCs: 'Nerozumím',
      displaySyllables: ['ne', 'ro', 'zu', 'mím'],
      phoneticMn: 'нэ · ро · зү · миим',
      meaningMn: 'Би ойлгохгүй байна',
      contrastPair: {
        shortWord: 'rada',
        shortMeaningMn: 'зөвлөгөө (энгийн r)',
        longWord: 'řada',
        longMeaningMn: 'эгнээ / дараалал (ř)',
        contrastNoteMn:
          '«ř» авиаг хэлэхэд хэлний үзүүр тагнайд чичирч агаар шүргэнэ; удаан (0.65x) сонсож ялгаарай.',
      },
      segmentationNoteMn: '1-р үе «ne» дээр өргөлттэй, төгсгөлийн «mím» урт сунана.',
    },
  ] satisfies PronunciationScaffoldItem[],

  genderColorsPreview: [
    {
      nounCs: 'muž / kolega',
      meaningMn: 'эр хүн / хамт олон (эр)',
      gender: 'masculine_animate',
      suffixHintMn: 'Амьтай эр: ten dobrý muž',
    },
    {
      nounCs: 'stůl / dům',
      meaningMn: 'ширээ / байшин',
      gender: 'masculine_inanimate',
      suffixHintMn: 'Амьгүй эр: ten velký stůl',
    },
    {
      nounCs: 'káva / práce',
      meaningMn: 'кофе / ажил',
      gender: 'feminine',
      suffixHintMn: 'Эм хүйс: ta dobrá káva · mám novou práci',
    },
    {
      nounCs: 'město / auto',
      meaningMn: 'хот / машин',
      gender: 'neuter',
      suffixHintMn: 'Саармаг: to velké město',
    },
  ] satisfies GenderColorExample[],

  extraGenderSelfExamples: [
    {
      id: 'GEN-WORK',
      meaningMn: 'Би ажилласан.',
      variants: { masculine: 'Pracoval jsem.', feminine: 'Pracovala jsem.' },
    },
    {
      id: 'GEN-WANT',
      meaningMn: 'Би ... хүсэж байна.',
      variants: { masculine: 'Chtěl bych kávu.', feminine: 'Chtěla bych kávu.' },
    },
    {
      id: 'GEN-GLAD',
      meaningMn: 'Би баяртай байна.',
      variants: { masculine: 'Jsem rád.', feminine: 'Jsem ráda.' },
    },
  ],

  exercises: [
    {
      exerciseId: 'CZ-A0-M01-L01-EX01',
      type: 'comprehension',
      promptMn: '«Jak se jmenujete?» гэдэг нь юу асууж байна вэ?',
      targetIntent: 'ask_name',
      acceptableAnswersMn: ['Таны нэрийг асууж байна.', 'Та хаана амьдардаг вэ?', 'Юу захиалах вэ?'],
      evaluationNoteMn: 'Зөв хариулт: Таны нэрийг асууж байна (албан ёсны vy хэлбэр).',
      qaStatus: 'draft_ai',
    },
    {
      exerciseId: 'CZ-A0-M01-L01-EX02',
      type: 'speaking_retrieval',
      promptMn: 'Танихгүй хүнээс нэрийг нь эелдгээр асуу.',
      targetIntent: 'ask_name_polite',
      exampleCs: 'Jak se jmenujete?',
      evaluationNoteMn: 'Танихгүй хүнд vy хэлбэр буюу jmenujete хэрэглэнэ.',
      qaStatus: 'draft_ai',
    },
    {
      exerciseId: 'CZ-A0-M01-L01-EX03',
      type: 'speaking_retrieval',
      promptMn: '«Би Монголоос ирсэн» гэж чехээр хэл.',
      targetIntent: 'state_origin',
      exampleCs: 'Jsem z Mongolska.',
      evaluationNoteMn: 'z + 2-р тийн ялгал (Mongolska).',
      qaStatus: 'draft_ai',
    },
    {
      exerciseId: 'CZ-A0-M01-L01-EX04',
      type: 'repair_request',
      promptMn: 'Ярилцагчийн хэлснийг ойлгосонгүй. Эелдгээр дахин хэлэхийг хүс.',
      targetIntent: 'request_repetition',
      exampleCs: 'Promiňte, nerozumím. Můžete to prosím zopakovat?',
      evaluationNoteMn: 'Ойлгоогүй үед дахин лавлах нь харилцааны хамгийн чухал чадвар.',
      qaStatus: 'draft_ai',
    },
    {
      exerciseId: 'CZ-A0-M01-L01-EX05',
      type: 'gender_self_form',
      promptMn: 'Өөрийн сонгосон хүйсийн дагуу «Би монгол хүн» гэж хэл.',
      targetIntent: 'state_nationality',
      expectedBySelfForm: {
        masculine: 'Jsem Mongol.',
        feminine: 'Jsem Mongolka.',
      },
      evaluationNoteMn: 'Эрэгтэй бол Jsem Mongol, эмэгтэй бол Jsem Mongolka.',
      qaStatus: 'draft_ai',
    },
  ] satisfies CanonicalExercise[],
};
