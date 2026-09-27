// Silly art: a rubber duck, a smelly sock, a whoopee cushion, a music note,
// dizzy stars, stink lines and a big ACHOO cloud.

import { drawMap } from './pixelmap.js';

const OUT = '#2a1d2e';

export function drawSillyArt(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    fn(ctx, tex);
    tex.refresh();
  };

  one('duck', 12, 10, (ctx) => drawMap(ctx, 0, 0, [
    '.....ooo....',
    '....oyyyo...',
    '....oykyoo..',
    '....oyyyrro.',
    '.o..oyyyoo..',
    'oyo.oyyyyo..',
    'oyyooyyyyyo.',
    'oyyyyyyyyyo.',
    '.oyyyyyyyo..',
    '..ooooooo...',
  ], { o: '#8a6a10', y: '#ffd84a', k: OUT, r: '#ff8a3a' }));

  one('sock', 10, 12, (ctx) => drawMap(ctx, 0, 0, [
    '..oooooo..',
    '..owwwwo..',
    '..orrrro..',
    '..owwwwo..',
    '..owwwwo..',
    '..owwwwo..',
    '..owwwwo..',
    '.owwwwwo..',
    'owwwwwwwo.',
    'owwwwwwwwo',
    'owbwwwwbwo',
    '.oooooooo.',
  ], { o: '#5a5a6a', w: '#e8e4d8', r: '#e0403a', b: '#b8b0a0' }));

  // whoopee cushion: puffed up, and squashed flat
  one('cushion', 32, 10, (ctx, tex) => {
    drawMap(ctx, 0, 0, [
      '................',
      '....oooooooo....',
      '..oopppppppPoo..',
      '.opppwpppppppPo.',
      'oppppppppppppppo',
      'oppppppppppppppo',
      '.oppppppppppppo.',
      '..ooppppppppoo..',
      '....oooooooodd..',
      '...........oddo.',
    ], { o: '#8a1a4a', p: '#ff5a9a', P: '#ffb0d0', w: '#ffffff', d: '#c83a7a' });
    drawMap(ctx, 16, 0, [
      '................',
      '................',
      '................',
      '................',
      '................',
      '..oooooooooooo..',
      '.oppppppppppppo.',
      'oppppppppppppppo',
      '.oooooooooooooodd',
      '..............od',
    ].map((r) => r.slice(0, 16)), { o: '#8a1a4a', p: '#ff5a9a', d: '#c83a7a' });
    tex.add(0, 0, 0, 0, 16, 10);
    tex.add(1, 0, 16, 0, 16, 10);
  });

  one('note', 8, 10, (ctx) => drawMap(ctx, 0, 0, [
    '...oooo.',
    '...ommo.',
    '...oo.o.',
    '...o..o.',
    '...o..o.',
    '...o..o.',
    '.ooo.oo.',
    'ommo.oo.',
    'ommo....',
    '.oo.....',
  ], { o: '#5a3a8a', m: '#b98cff' }));

  one('dizzy-star', 7, 7, (ctx) => drawMap(ctx, 0, 0, [
    '...y...',
    '...y...',
    'yyyYyyy',
    '.yyYyy.',
    '..yyy..',
    '.yy.yy.',
    '.y...y.',
  ], { y: '#ffe066', Y: '#ffffff' }));

  one('stink', 8, 12, (ctx) => {
    for (let y = 0; y < 12; y++) {
      const dx = Math.round(Math.sin(y / 2) * 1.5);
      rect(ctx, '#8ad04a', 1 + dx, y, 1, 1);
      rect(ctx, '#a8e06a', 5 + dx, y, 1, 1);
    }
  });

  // a big dusty ACHOO cloud with speed lines
  one('achoo', 16, 12, (ctx) => {
    ctx.fillStyle = '#e8dcc0';
    for (const [x, y, r] of [[9, 6, 4], [5, 7, 3], [12, 4, 3], [12, 8, 3]]) {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#c8b890';
    ctx.beginPath(); ctx.arc(10, 8, 2, 0, Math.PI * 2); ctx.fill();
    rect(ctx, '#ffffff', 0, 3, 3, 1);
    rect(ctx, '#ffffff', 0, 6, 2, 1);
    rect(ctx, '#ffffff', 1, 9, 3, 1);
  });
}
