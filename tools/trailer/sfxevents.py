import json, os
import edit
SKIP = {'sticker'}
GAIN = {'dig': 0.8, 'ore': 1.0, 'boom': 1.6, 'achoo': 2.2, 'glug': 2.2, 'burp': 2.6, 'roar': 1.6, 'chest': 1.3, 'heart': 1.8, 'squash': 1.4, 'boing': 1.5, 'rawr': 1.8, 'giggle': 1.5, 'whirr': 1.3, 'hammer': 1.0, 'build': 1.4, 'caw': 1.3}
ev = []
for s in edit.SHOTS:
    p = os.path.join(edit.ROOT, 'clips', s['clip'], 'sfx.json')
    for e in json.load(open(p)):
        tc = e['f'] / 60
        sp = s.get('speed', 1.0)
        if s['src'] <= tc < s['src'] + s['d'] * sp:
            if e['name'] in SKIP: continue
            ev.append(dict(t=s['t'] + (tc - s['src']) / sp, name=e['name'], arg=e.get('arg'), gain=GAIN.get(e['name'], 1.0)))
ev = [e for e in ev if not (71.0 <= e['t'] <= 72.2 and e['name'] in ('bubble', 'pop', 'dizzy', 'egg'))]
ev.sort(key=lambda e: e['t'])
json.dump(ev, open(os.path.join(edit.ROOT, 'sfx_events.json'), 'w'))
print(len(ev), 'events'); print([(round(e['t'],2), e['name']) for e in ev if e['name'] not in ('dig','ore')])
