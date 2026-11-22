# A0 — 14 scope discrepancies: learning-outcome evidence review v0.1

**Status: REVIEW DRAFT — NOT APPROVED, NOT PUBLISHED.** 2026-11-23.
Source: \`docs/data/a0_outline_reconciliation_2026-11-23.json\` (PR #30); existing \`public/cesky-reading-uiux/a0-curriculum.json\` (main). All stable skill IDs retained.

## Purpose and validation contract

This is the **step after preliminary classification and before any canonical data write**. Each proposal requires: (a) one concrete observable can-do, (b) at least one Czech utterance or phonetic sample supporting that can-do, (c) a realistic scenario and exit check, (d) overlap check with neighboring skills, (e) Czech/Mongolian editorial sign-off. Examples marked **NEW** below are *not present* in the existing topic phrase banks and must be researched, checked, and sourced before publication. Current 14 \`approved\` flags remain \`false\`.

The title differences are **not** automatically all mistakes: multiple rows in the PR #30 report are valid but only require editorial scope decisions; a title match alone cannot validate a learning outcome. Incorrect audio generation would multiply these errors.

| Skill ID | Canonical title to review (MN) | Observable can-do (MN) | Czech sample / evidence gap | Exit-task design and scope action |
|---|---|---|---|---|
| A0-T01-L05 | C/Č, S/Š, Z/Ž авиаг сонсож ялгах | Сонссон авиаг хосоос нь зөв танина. | **NEW audio required:** c/č, s/š, z/ž with checked native pronunciation. A0-T01 current phrase bank has no these samples. | Зураг/текстийн 2 сонголт; 3 хосыг тус тус шалгах. Энэ нь **сонсож ялгах** даалгавар, дуудлага үнэлэх даалгавар биш. |
| A0-T01-L06 | Ď, Ť, Ň авиаг сонсоод дуурайж хэлэх | Тус бүрийн авиаг таньж, дуу авианы загварыг дуурайж хэлнэ. | **NEW:** děti, tělo, něco — spelling/soft-consonant association and sound need Czech phonetics review. Do not substitute final-position devoiced consonants. | Сонсох → дуурайх → жишээтэй харьцуулах. **STT transcript ≠ phonetic grading**; objective performance requires validated pronunciation assessment or human scoring. |
| A0-T02-L09 | Чи/Та хэлбэрийг нөхцөлд тохируулан хэрэглэх | Найз ба танихгүй насанд хүрсэн хүний ярианд дотно/хүндэтгэлийн хэлбэрийг ялгана. | Existing: \`Jak se máte?\`; **NEW:** \`Jak se máš?\`; compare ty/vy. Cross-checked introductory reference below. | Найз vs албан уулзалтын 2 нөхцөлд хэлбэрээ сонгоно. L10-н нэр асуух зорилгыг давхар авахгүй. |
| A0-T02-L10 | Дотно ба хүндэтгэлийн хэлбэрээр нэр асуух | Тухайн хүнтэй тохирох хэлбэрээр нэрийг нь асууна. | **NEW:** \`Jak se jmenuješ?\` / \`Jak se jmenujete?\`; the existing topic bank lacks **both**. | Нэр асуух 2 нөхцөл, тохирох асуултыг бие даан хэлнэ; эхлээд L09-ийн register ялгалтыг шалгана. |
| A0-T02-L18 | Танихгүй хүнтэй мэндэлж, бие даан танилцах сорил | Албан нөхцөлд мэндэлж, нэр хэлж, нэр асууж, эелдгээр сална. | Existing: \`Dobrý den.\`, \`Jmenuji se Eba.\`, \`Na shledanou.\`; **NEW:** \`Jak se jmenujete?\`. | 4 үе шаттай шинэ харилцан яриа. **Нэр асуух хэллэг нэмэгдэхгүй бол энэ exit task батлагдах боломжгүй.** Formal register first; informal scenario may be separate review, not silent extra objective. |
| A0-T05-L08 | Уулзалтын цагийг тохиролцож батлах сорил | Санал болгосон цагийг ойлгож, хүлээн авч батлах эсвэл тохирохгүйг илэрхийлнэ. | Existing: \`V kolik hodin?\`, \`Zítra.\`, \`V osm.\`, \`Tak zítra v osm.\`. **NEW** counterproposal/refusal required if task truly claims negotiation. | **Scope decision needed:** base A0 exit task should test a simple proposed-time confirmation; add new Czech alternatives before claiming *negotiation* ability. L07 already covers offering a time. |
| A0-T09-L01 | Ажил мэргэжлээ энгийнээр хэлэх | Өөрийн ажил/мэргэжлийг богино өгүүлбэрээр хэлнэ. | Current \`Pracuji tady.\` = "Би энд ажилладаг"; **does not name a profession**. **NEW:** \`Jsem svářeč.\` / \`Jsem svářečka.\` (gender-aware samples require CZ editorial). | Ажил мэргэжлээ нэрлэх one-turn task; хамтрагчаа танилцуулах нь өөр чадвар. **Cannot approve against existing phrase bank.** |
| A0-T09-L05 | Багажийн байршлыг энд/тэнд гэж хэлэх | Тодорхой багаж хаана байгааг зааж, богино өгүүлбэрээр хэлнэ. | Current bank only \`Pracuji tady.\`; **NEW:** \`Kde je kladivo?\`, \`Kladivo je tady.\`, \`Kladivo je tam.\`. | Хоёр байрлалтай зураг/бодит сцен дээр багажийг зааж хэлэх; general location words from T08 reused, with tools from preceding L02/L04. |
| A0-T09-L07 | Ажил дээрх «Зогс!» тушаалыг сонсоод ойлгох | Шууд зогсох тушаалыг ерөнхий анхааруулгаас ялгаж, аюулгүй сонголт хийнэ. | Current \`Pozor!\` = **Анхаар!**, **not a lexical synonym for «Зогс!»**. **NEW:** \`Stůj!\` / \`Stůjte!\` (speaker/number/register to review). BOZP reference below explicitly distinguishes stop commands and warning signals. | Audio of stop command → safe simulated response; **no real machinery control**. DO NOT teach \`Pozor!\` as exact stop command. This is a blocking semantic error. |
| A0-T09-L08 | Ажлын аюулын энгийн анхааруулгыг таних | Анхааруулга сонсоод/хараад боломжит аюулын талаар ойлгон болгоомжлоно. | Current \`Pozor!\` supports **general attention warning**, but does **not** name a specific hazard. **NEW** labeled signs/utterances necessary for plural hazard types. | Start with \`Pozor!\` vs safe text; if title promises **multiple kinds of hazard** then add distinct verified warning signs and risk-specific exit tests. Separate from L07 stop command. |
| A0-T11-L03 | Хаалга, цонхыг зааж нэрлэх | Хаалга, цонхыг таньж зөв нэрлэнэ. | **NEW:** \`dveře\` (plural form), \`okno\` (singular). The current topic bank has no such labels. | Distinguish L04 \`Гэрт байгаа зүйлс\`. Drive title includes other household objects; expanding L03 would duplicate L04. **Explicit curriculum scope decision**, not a silent rename. |
| A0-T12-L01 | Үндсэн өнгийг сонсож ялгах | Чехээр хэлсэн өнгөнөөс зөв өнгийн дүрсийг сонгоно. | Current \`Je to červené.\` is one example; **NEW:** additional color names/recordings. Czech adjective agreement must be checked when extending to noun phrases. | Listening discrimination of at least 3 colors (not just a single red example). Reserve spoken naming/selection for L02. |
| A0-T13-L04 | Хүссэн хувцсаа зааж, хүсэлтээ хэлэх | Хувцасны дэлгүүрт тодорхой хувцас хүсэж байгаагаа энгийнээр илэрхийлнэ. | Current \`Vezmu si to.\` expresses **decision to take/buy**, not initial selection/request. **NEW:** \`Hledám bundu.\` / \`Tuhle, prosím.\` need Czech editorial and precise visual context. | A0 one-step request; do not mix size query (L03) or permission to try on (L05). Clarify whether wanting vs buying is the can-do. |
| A0-T13-L05 | Өмсөж үзэх зөвшөөрөл хүсэх | Хувцас өмсөж үзэж болох эсэхийг эелдгээр асууна. | Existing \`Můžu si to zkusit?\` matches the intention; requires real voice and context review, but **no new example needed to state core target**. | Shop attendant role-play: ask permission and recognize an answer. Current course lacks answer phrases; add before claiming complete two-turn interaction. |

## Findings blocking premature finalization

1. **Meaning conflation:** \`Pozor!\` must not stand in for \`Stůj!\`. This affects safety teaching (A0-T09-L07).
2. **Objective unsupported by sample:** \`Pracuji tady.\` is insufficient for profession (A0-T09-L01); both name-question registers are missing from current phrase bank (A0-T02-L10/L18).
3. **Over-scoped tests:** A0-T05-L08 cannot claim counter-proposal negotiation with only \`V osm.\` and \`Tak zítra v osm.\`.
4. **Neighbor collision:** A0-T11-L03 vs L04 household vocabulary; A0-T13-L04 vs L05 choosing/requesting vs try-on permission; L07 vs L08 workplace stop vs warning.
5. **Audio modality:** phonetics and color discrimination require actual Czech reference audio; text correctness alone cannot approve these objectives.

## Narrow external cross-check (not human editor approval)

- CzechOnline material on formal/informal address: https://www.czechonline.org/upload/Downloads/files/table/19/item/12/54/g-01-formalni-a-neformalni-osloveni.pdf?v=1691418467
- CzechCourse explicit \`Jak se jmenujete?\` / \`Jak se jmenuješ?\`: https://czechcourse.com/en/reference/sociocultural/formal-informal
- BOZP safety signals/commands: https://www.bozpprocizince.cz/uvod-do-bozp/bezpecnostni-znacky-barvy-signaly

## Verification gates and disposition

- **Machine review completed:** all 14 PR #30 scope IDs compared against current topic phrase banks and neighbor IDs. The table records provenance and missing utterances, not adopted decisions.
- **Limited public-language cross-check:** selected formal/informal and stop/warning distinctions checked against public references linked above.
- **Unverified:** remaining new Czech samples, phonetics/word-final voicing, each natural Mongolian gloss, actual audio, authentic learner performance, native Czech editorial.
- **Publication status:** all 14 remain **DRAFT; approved=false**. **No** edits to canonical \`a0-curriculum.json\` / JS, no new user lessons, no audio/API work, no production publication.
- **Next gate:** expert editorial sign-off on each proposed utterance/register and exit task, then resolve all 62 titles with a published decision register; only then change canonical JSON and start fully working lessons.

Related: PR #29 continuity plan, PR #30 initial reconciliation. PR #31 attempted premature lesson work and was closed unmerged; do not reincorporate it until curriculum validation.
