import { CZECH_ALPHABET_LETTERS, type CzechAlphabetLetter } from './czechAlphabetCourse';

/**
 * 42 letters in 9 packs of 4–5. These are Czech alphabet order, NOT English
 * alphabet order. "CH" is one Czech letter between H and I.
 *
 * Unit granularity is a PACK, never one long seven-step lesson per letter.
 */
const PACK_BOUNDARIES = [0,5,10,15,20,25,29,33,37,42] as const;

export type AlphabetPackStage = 'introduce'|'listen_name'|'match_sound'|'report';
export interface AlphabetPack {
  id: string;
  index: number;
  letters: readonly CzechAlphabetLetter[];
  contrastNoteMn: string;
}

const NOTES=[
  'A ба Á: ижил үсгийн богино, урт эгшиг. C ба Č: өөр авиа.',
  'D ба Ď; E, É, Ě: тэмдэглэгээ, байрлалаас хамаарах дуудлага.',
  'H ба CH: CH нь Чех цагаан толгойн бие даасан үсэг.',
  'I ба Í: эгшгийн уртыг ялгах; J ба K-г жишээ үгээр таних.',
  'N ба Ň, O ба Ó: зөөлөн гийгүүлэгч ба урт эгшгийн ялгаа.',
  'R ба Ř: авиа адил биш. Q нь ихэвчлэн гадаад гаралтай үгэнд орно.',
  'S ба Š-г дараагийн давтлагад харьцуулна; Ť бол зөөлөн гийгүүлэгч.',
  'Ú болон Ů: олон нөхцөлд ижил урт /uː/ авиа, бичгийн дүрэм өөр.',
  'Y болон Ý, Z болон Ž: эгшгийн урт болон háček тэмдэг.',
] as const;

export const CZECH_ALPHABET_PACKS: readonly AlphabetPack[]=PACK_BOUNDARIES.slice(0,-1).map((start,index)=>({
  id:`CZ-ALPHA-P${String(index+1).padStart(2,'0')}`,
  index,
  letters:CZECH_ALPHABET_LETTERS.slice(start,PACK_BOUNDARIES[index+1]),
  contrastNoteMn:NOTES[index],
}));

export const CZECH_ALPHABET_PACK_BY_ID=new Map(CZECH_ALPHABET_PACKS.map(p=>[p.id,p]));

export function packForLetter(letterId:string):AlphabetPack|undefined{
  return CZECH_ALPHABET_PACKS.find(p=>p.letters.some(l=>l.id===letterId));
}

export const CZECH_ALPHABET_PACK_VERSION='cz-alphabet-pack-v1';

/**
 * Two DIFFERENT recordings are required: Czech NAME OF LETTER and
 * SOUND IN CONTEXT/EXAMPLE. Never use the visible letter as fake audio,
 * synthesized browser voice, English letter names, or silent "success".
 *
 * Production audio assets may be added only after Gemini 3.8 Flash TTS QA,
 * immutable sha256, exact source id, private publication decision.
 */
export type AlphabetAudioKind = 'letter_name'|'sound_in_word';

/** Identical or overlapping Czech sounds cannot be uniquely discriminated
 * from an isolated waveform. Spelling needs word context and Czech lexicon.
 */
export const CONTEXT_REQUIRED_SPELLINGS = [
  ['Ú','Ů'],['I','Y'],['Í','Ý'],
] as const;

export function spellingRequiresWordContext(id:string):boolean{
  return CONTEXT_REQUIRED_SPELLINGS.some(pair=>pair.some(letter=>letter===id));
}
export interface ApprovedAlphabetAudio {
  sourceId:string;
  kind:AlphabetAudioKind;
  url:string;
  sha256:string;
  textSha256:string;
  sourceVersion:typeof CZECH_ALPHABET_PACK_VERSION;
  /** Exact Czech prompt audited for the generated recording. */
  csExact:string;
  model:'gemini-3.8-flash-tts';
  qaStatus:'native_approved';
}

/** Intentionally empty until real approved recordings exist. */
export const APPROVED_ALPHABET_AUDIO:readonly ApprovedAlphabetAudio[]=[];

export function approvedAlphabetAudio(letterId:string,kind:AlphabetAudioKind):ApprovedAlphabetAudio|undefined{
  if (!CZECH_ALPHABET_LETTERS.some(l=>l.id===letterId))return undefined;
  return APPROVED_ALPHABET_AUDIO.find(a=>a.sourceId===`CZ-ALPHA-${letterId}` &&a.kind===kind
    &&a.model==='gemini-3.8-flash-tts' &&a.qaStatus==='native_approved'
    &&a.sourceVersion===CZECH_ALPHABET_PACK_VERSION
    &&a.csExact.trim().length>0
    &&(kind==='letter_name'||a.csExact.toLocaleLowerCase('cs-CZ')===
       CZECH_ALPHABET_LETTERS.find(l=>l.id===letterId)?.exampleCs.toLocaleLowerCase('cs-CZ'))
    &&/^\/[a-z0-9/_\-.]+\.(wav|mp3|ogg)$/i.test(a.url)
    &&/^[a-f0-9]{64}$/.test(a.sha256)
    &&/^[a-f0-9]{64}$/.test(a.textSha256));
}
export function isPackAudioReady(pack:AlphabetPack,kind:AlphabetAudioKind):boolean{
  return pack.letters.every(l=>approvedAlphabetAudio(l.id,kind));
}
