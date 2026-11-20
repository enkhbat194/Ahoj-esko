"""Build the owner's local import file and hash receipts. Never commit the output pack."""
import argparse
import base64
import hashlib
import io
import json
import wave
import zipfile
from pathlib import Path

SOURCE_SHA = 'bf6de3f4872353d13768e79cb53299bfe1927ca3927209334df3e7e548860a03'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def pack(args):
    source = args.source.read_bytes()
    if sha(source) != SOURCE_SHA:
        raise ValueError('Wrong curriculum snapshot')
    lessons = json.loads(source)['lessons']
    texts = {}
    for lesson in lessons:
        for phrase in lesson['phrases']:
            texts[phrase['content_id']] = phrase['cs_text']
        for scene in lesson['dialogues']:
            for turn in scene['turns']:
                texts[turn['turn_id']] = turn['cs']
    scoring = args.contracts.read_bytes()
    contracts = [json.loads(row) for row in scoring.splitlines()]
    exercises = {ex['exercise_id']: ex['prompt_mn'] for lesson in lessons for ex in lesson['exercises']}
    if len(contracts) != len(exercises) or {c['exercise_id'] for c in contracts} != exercises.keys():
        raise ValueError('Incomplete scoring overlay')
    for row in contracts:
        if (row['source_json_sha256'] != SOURCE_SHA or row['prompt_mn_exact'] != exercises[row['exercise_id']]
                or row['full_auto_pass_allowed'] or row['publication_allowed']):
            raise ValueError(row['exercise_id'])
    receipts, audio = [], {}
    for path in args.audio:
        with zipfile.ZipFile(path) as archive:
            index = json.loads(archive.read('AUDIO_REVIEW_INDEX.json'))
            for clip in index['clips']:
                sid, text = clip['source_id'], clip['text']
                if (clip['qa_status'] != 'AUTO_PASS' or clip['release_allowed'] is not False
                        or texts.get(sid) != text or clip['model'] != 'gemini-3.8-flash-tts'
                        or clip['production_method'] != 'original_gemini_tts'):
                    continue
                data = archive.read(clip['filename'])
                digest = sha(data)
                if digest != clip['sha256'] or not sid.startswith(clip['lesson_id'] + '-'):
                    raise ValueError(sid)
                with wave.open(io.BytesIO(data)) as wav:
                    if wav.getsampwidth() != 2 or wav.getnframes() < 1:
                        raise ValueError('Invalid WAV ' + sid)
                if digest in audio:
                    continue
                audio[digest] = base64.b64encode(data).decode()
                receipts.append(dict(sourceId=sid, textSha256=sha(text.encode()), wavSha256=digest,
                                     voice=clip['voice'], style=clip['style'], model=clip['model'],
                                     qa=clip['qa_status'], batch=clip['batch_id'], publishAllowed=False))
    args.output.write_text(json.dumps(dict(format='ahoj-private-course-1', source=source.decode(),
                                          contracts=scoring.decode(), audio=audio), ensure_ascii=False,
                                     separators=(',', ':')), encoding='utf-8')
    args.receipts.write_text(json.dumps(dict(datasetSha256=SOURCE_SHA, contractsSha256=sha(scoring),
                                             clips=sorted(receipts, key=lambda c:(c['sourceId'], c['style']))),
                                        ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{len(lessons)} lessons, {len(contracts)} exercise contracts, {len(receipts)} matched WAVs')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('source', 'contracts', 'output', 'receipts'):
        parser.add_argument('--' + name, type=Path, required=True)
    parser.add_argument('--audio', nargs='+', type=Path, required=True)
    pack(parser.parse_args())
