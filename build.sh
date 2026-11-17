#!/bin/sh
# Kaynak parçalarını tek dosyalık index.html'e birleştirir (M3 renk + stil dosyaları <style> sonuna eklenir)
cd "$(dirname "$0")/src" && python3 - <<'PY'
h=open('head.html').read()
css=open('m3colors.css').read()+open('m3.css').read()+open('responsive.css').read()
h=h.replace('</style>',css+'</style>',1)
js=''.join(open(f).read() for f in ['logic.js','gen.js','ui_top.js','haptics.js','net.js','part_snd.js','elem.js','ui_mid.js','part_ladder.js','part_edit.js','ui_bot.js','canvas_part.js','ui_loop.js'])
open('../index.html','w').write(h+js+open('tail.html').read())
PY
