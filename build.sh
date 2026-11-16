#!/bin/sh
# Kaynak parçalarını tek dosyalık index.html'e birleştirir
cd "$(dirname "$0")/src" && cat head.html logic.js gen.js ui_top.js part_snd.js ui_mid.js part_ladder.js part_edit.js ui_bot.js canvas_part.js ui_loop.js tail.html > ../index.html
