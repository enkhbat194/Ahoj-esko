/**
 * L01 working-source snapshot. Manual extraction from the 4,466,738-byte
 * AHOJ_72_LESSONS_AUDIO_PREFLIGHT_WORKING_v0_9_20.json.
 * NEVER import the old canonicalL01.ts IDs into this source-locked flow:
 * its PH002–PH006 were assigned to different strings.
 * No human/native approval or student publication is implied.
 */
export const L01_DATASET_SHA256 = 'bf6de3f4872353d13768e79cb53299bfe1927ca3927209334df3e7e548860a03';
export const L01_ID = 'CZ-A0-M01-L01';
export type L01Stage = 'dialogue' | 'phrases' | 'practice' | 'exit';

export const L01_WORKING_SOURCE = {
  lessonId: L01_ID,
  sourceVersion: 'v0.9.20',
  sourceSha256: L01_DATASET_SHA256,
  qaStatus: 'draft_ai' as const,
  publishAllowed: false as const,
  titleMn: 'Мэндлэх, нэрээ хэлэх, нэр асуух',
  missionMn: 'Танихгүй хүнтэй эелдгээр мэндэлж, нэрээ болон аль улсаас ирснээ хэлэх',
  phrases: [
    { id: 'CZ-A0-M01-L01-PH001', cs: 'Dobrý den.', mn: 'Сайн байна уу.' },
    { id: 'CZ-A0-M01-L01-PH002', cs: 'Jmenuji se …', mn: 'Намайг … гэдэг.', isTemplate: true },
    { id: 'CZ-A0-M01-L01-PH003', cs: 'Jak se jmenujete?', mn: 'Таныг хэн гэдэг вэ?' },
    { id: 'CZ-A0-M01-L01-PH004', cs: 'Jsem z Mongolska.', mn: 'Би Монголоос.' },
    { id: 'CZ-A0-M01-L01-PH005', cs: 'Nerozumím.', mn: 'Би ойлгохгүй байна.' },
    { id: 'CZ-A0-M01-L01-PH006', cs: 'Můžete to prosím zopakovat?', mn: 'Та үүнийг дахин хэлж өгч болох уу?' },
  ],
  dialogues: [
    {
      id: 'CZ-A0-M01-L01-B01', titleMn: 'Харилцан яриа 1. Албан танилцалт',
      turns: [
        { id: 'CZ-A0-M01-L01-B01-T01', speaker: 'A', cs: 'Dobrý den. Jmenuji se Jana. Jak se jmenujete?', mn: 'Сайн байна уу. Намайг Яна гэдэг. Таныг хэн гэдэг вэ?' },
        { id: 'CZ-A0-M01-L01-B01-T02', speaker: 'B', cs: 'Dobrý den. Jmenuji se Bat.', mn: 'Сайн байна уу. Намайг Бат гэдэг.' },
        { id: 'CZ-A0-M01-L01-B01-T03', speaker: 'A', cs: 'Odkud jste?', mn: 'Та хааных вэ?' },
        { id: 'CZ-A0-M01-L01-B01-T04', speaker: 'B', cs: 'Jsem z Mongolska.', mn: 'Би Монголоос.' },
        { id: 'CZ-A0-M01-L01-B01-T05', speaker: 'A', cs: 'Těší mě.', mn: 'Танилцсандаа таатай байна.' },
        { id: 'CZ-A0-M01-L01-B01-T06', speaker: 'B', cs: 'Mě také.', mn: 'Надад ч мөн адил.' },
      ],
    },
    {
      id: 'CZ-A0-M01-L01-B02', titleMn: 'Харилцан яриа 2. Шинэ хүний нэр',
      turns: [
        { id: 'CZ-A0-M01-L01-B02-T01', speaker: 'A', cs: 'Dobrý den. Jak se jmenujete?', mn: 'Сайн байна уу. Таныг хэн гэдэг вэ?' },
        { id: 'CZ-A0-M01-L01-B02-T02', speaker: 'B', cs: 'Jmenuji se Sara.', mn: 'Намайг Сара гэдэг.' },
        { id: 'CZ-A0-M01-L01-B02-T03', speaker: 'A', cs: 'Odkud jste?', mn: 'Та хааных вэ?' },
        { id: 'CZ-A0-M01-L01-B02-T04', speaker: 'B', cs: 'Jsem z Česka.', mn: 'Би Чехээс.' },
        { id: 'CZ-A0-M01-L01-B02-T05', speaker: 'A', cs: 'Těší mě.', mn: 'Танилцсандаа таатай байна.' },
      ],
    },
  ],
  exercises: [
    { id: 'CZ-A0-M01-L01-EX01', promptMn: 'Jak se jmenujete? гэсэн өгүүлбэр юуг асууж байна вэ?', proposedAnswer: 'Нэрийг нь асууж байна.', gradingPolicy: 'manual_semantic_review' },
    { id: 'CZ-A0-M01-L01-EX02', promptMn: 'Үгийн дарааллыг зөв болго: se / Bat / Jmenuji', proposedAnswer: 'Jmenuji se Bat.', gradingPolicy: 'manual_semantic_review' },
    { id: 'CZ-A0-M01-L01-EX03', promptMn: 'Намайг Сара гэдэг гэж хэл.', proposedAnswer: 'Jmenuji se Sara.', gradingPolicy: 'manual_semantic_review' },
    { id: 'CZ-A0-M01-L01-EX04', promptMn: 'Odkud jste? гэдэг асуултад аль нь тохирох вэ?', proposedAnswer: 'Jsem z Mongolska.', gradingPolicy: 'manual_semantic_review' },
    { id: 'CZ-A0-M01-L01-EX05', promptMn: 'A: Jak se jmenujete? B: ___. (Бат)', proposedAnswer: 'Jmenuji se Bat.', gradingPolicy: 'manual_semantic_review' },
    { id: 'CZ-A0-M01-L01-EX06', promptMn: 'Өмнөх ярианд байгаагүй шинэ хүн ирлээ. Эелдгээр мэндлээд өөрийгөө танилцуулж, нэрийг нь асуу.', proposedAnswer: 'A: Dobrý den. Jmenuji se Eva. Jak se jmenujete?  B: Jmenuji se Pavel.', gradingPolicy: 'semantic_can_do_rubric' },
  ],
  exit: {
    id: 'CZ-A0-M01-L01-EXIT01',
    promptMn: 'Өмнөх ярианд байгаагүй шинэ хүн ирлээ. Эелдгээр мэндлээд өөрийгөө танилцуулж, нэрийг нь асуу.',
    situationMn: 'Түрээсийн байрны хүлээн авах хэсэгт анх ирж бүртгүүлнэ.',
    missionMn: 'Эелдгээр мэндэл; өөрийн нэр болон гарал үүслээ хэл; нөгөө хүний нэрийг асуу. Сонсоогүй хэсгийг дахин хэлүүл.',
    criteriaMn: 'Нэр болон улсаа ойлгуулж, ажилтны нэрийг лавлаад, шаардлагатай бол нэг удаа тодруулна.',
    needsTransferRewrite: true,
    rubric: [
      { criterion: 'mission_completion', descriptionMn: 'Өгөгдсөн шинэ нөхцөлд харилцааны зорилгоо биелүүлсэн', maxPoints: 2 },
      { criterion: 'comprehensibility', descriptionMn: 'Яригчийн гол мэдээлэл ойлгомжтой, шаардлагатай тоо/цаг/байршил алдаагүй', maxPoints: 2 },
      { criterion: 'interaction_repair', descriptionMn: 'Буруу сонссон үед давтуулах, залруулах буюу баталгаажуулах', maxPoints: 2 },
      { criterion: 'appropriateness', descriptionMn: 'Ty/vy, эелдэг хэллэг, хүйс ба нөхцөлд тохирсон', maxPoints: 2 },
    ],
  },
} as const;
