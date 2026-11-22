# AHOJ — NEXT ACTION
Last updated: 2026-11-23. Proposal status.
Owner: MASTER / CURRICULUM workstream; branch target: new feature branch, NOT main.

## Exactly one next task
Reconcile the 140 A0 micro-skill IDs between Drive AHOJ_A0_16_TOPICS_140_LESSON_OUTLINE_v1_0, the canonical repository JSON, and the detailed research plan. There are 62 title mismatches, mostly stylistic but some semantic. Record for each mismatch: ID, Drive title, GitHub title, intended communicative can-do, final proposed wording, reason, editorial status. Explicitly investigate A0-T02-L10, A0-T02-L13, A0-T05-L08, A0-T09-L01.
DO NOT alter existing IDs or published student progress; propose mappings only until validated.

## Deliverables
- A machine-readable decision table for every conflicting ID and a consistent schema for skill_id / session_id.
- A generated readable report (not two divergent manual copies).
- One PR into main with validation for 16 topic IDs, 140 micro-skill IDs, no duplicate IDs and Drive-export parity.
- CI PASS and code review; do not label human Czech QA as completed if it is not.

## After completing this task
Start a 3–6 lesson vertical slice using A0-T02, early A0-T03 repair phrases and audio-manifest validation.
Update this NEXT_ACTION with: verified main SHA, branch/PR, completed work, failures, concrete next step. Only one active next action; track parallel workstreams in PROJECT_STATE_MASTER.

## Done means
Evidence of reconciled IDs and can-do mapping, tests passing, and no false claim that 140 lessons are live.
