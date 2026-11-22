# Ember Duel — Duel Kartu Bara
[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/maelaozera/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/maelaozera/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

Duel kartu orisinal untuk bounty make.fun **best-card-game-20261122-1826**.
Berjalan offline di desktop Chrome dari file statis, tanpa network.

## Cara main

- Kamu dan **Raka si Lawan** masing-masing punya **30 nyawa**.
- Mana bertambah 1 tiap giliran (maks 10). Kartu berharga mana untuk dimainkan.
- Empat elemen orisinal, dibedakan warna **dan** bentuk: ▲ Api (merah),
  ≈ Ombak (biru), ◆ Duri (hijau), ◎ Angin (ungu).
- 24 kartu: 15 makhluk (serangan/nyawa) dan 9 mantra (damage, pulih, tarik kartu).
- Makhluk baru tidak bisa menyerang di giliran yang sama ia dimainkan.
- Menangkan duel dengan menghabiskan nyawa lawan lebih dulu.

## Kontrol

- **Klik** kartu di tangan untuk memilih, klik lagi (atau Enter / Spasi) untuk memainkan.
- **1–7**: pilih kartu di tangan.
- **Klik makhlukmu** di papan, lalu klik makhluk lawan atau potret Raka untuk menyerang.
- **E**: akhiri giliran. **Esc**: batalkan pilihan. **M**: suara nyala/mati.
- **Enter** di title screen: mulai. **Enter** di layar akhir: main lagi.

## Menjalankan

```sh
# dari direktori ini, layani game/ lalu buka http://localhost:8080
python3 -m http.server 8080 --directory game
```

Untuk tangkapan layar demo (hanya untuk dokumentasi, bukan permainan normal):

```sh
http://localhost:8080/?demo=table   # meja tengah permainan
http://localhost:8080/?demo=win     # layar menang
http://localhost:8080/?demo=loss    # layar kalah
```

## Struktur

- `game/index.html` — halaman game
- `game/style.css` — meja, kartu, animasi, layar title/menang/kalah
- `game/src/cards.js` — katalog kartu dan deck (4 elemen orisinal)
- `game/src/game.js` — state dan aturan (giliran, mana, serang, mantra)
- `game/src/ai.js` — strategi Raka si Lawan
- `game/src/render.js` — renderer DOM: title, meja, tangan, papan, skor
- `game/src/audio.js` — efek suara sintetis WebAudio (tanpa file eksternal)
- `game/src/main.js` — bootstrap, input keyboard/mouse, demo hooks
- `main.ts` — entrypoint make.fun: menyalin game/ + screenshots/ dan menulis dossier.json
- `vendor/makefun-game.ts` — library make.fun dari kit (tidak diubah)

## Lisensi

MIT — lihat `LICENSE`.
