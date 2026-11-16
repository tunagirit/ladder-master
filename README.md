# ⚡ Ladder Master — PLC Merdiven Mantığı Bulmacası

*PLC ladder logic puzzle game for mobile — Türkçe / English* · **Sürüm v1.0.3**

Telefon ekranı için tasarlanmış, tarayıcıda çalışan bir **PLC Ladder (merdiven) mantık bulmaca oyunu**.
Tek bir HTML dosyası; harici kütüphane, görsel veya ses dosyası yok.

## Oyna
**▶ Hemen oyna / Play now:** https://tunagirit.github.io/ladder-master/

Ya da `index.html` dosyasını tarayıcıda aç.

## Özellikler
- **900 bölüm:** Temel Mantık, Zamanlayıcılar, Sayıcılar × Kolay / Orta / Zor × 100 bölüm
- **Sanal PLC:** 20 ms scan cycle; Açık/Kapalı kontak, Bobin, Set/Reset, TON, TOF, CTU, CTD, paralel kol (OR)
- **Canlı izleme:** RUN modunda enerjili hatlar neon yeşil, zamanlayıcı/sayıcı değerleri canlı
- **Fabrika simülasyonu:** konveyör, sensörler, pistonlar, dolum valfi, boya kabini, lambalar
- **Sürükle-bırak editör:** blok yerleştir, taşı, yer değiştir, palete sürükleyerek sil
- **Puan sistemi:** her tamamlanan bölüm 1 puan; çözümler `localStorage`'a kaydedilir
- **Web Audio** ile üretilen röle, piston ve melodi sesleri
- **Tema:** Açık / Karanlık / Otomatik (sistem temasını izler)
- **Dil:** Türkçe / English (tüm bölüm metinleri dahil)

## Geliştirme
Kaynak `src/` klasöründe parçalar halinde durur:

| Dosya | İçerik |
|---|---|
| `logic.js` | PLC motoru (scan cycle) ve fabrika dünyası (`World`) |
| `gen.js` | Bölüm üreticisi — şablonlar, kategori/zorluk tanımları |
| `ui_*.js`, `part_*.js`, `canvas_part.js` | Arayüz, menüler, editör, canvas sahnesi |

```sh
./build.sh                      # src/ → index.html
node tests/levels.test.js       # 900 bölümü referans çözümle doğrular
```

Yeni bölüm tipi eklemek için `gen.js` içindeki `TPL` dizisine bir şablon fonksiyonu eklemek yeterli.

## Çevrimiçi hesap ve liderlik tablosu (Supabase)
1. [supabase.com](https://supabase.com) → yeni proje oluştur.
2. **SQL Editor** → `supabase.sql` dosyasının içeriğini yapıştır → **Run**.
3. **Authentication → Sign In / Providers → Email** → *Confirm email* seçeneğini **kapat** (kullanıcı adı + şifre ile giriş için).
4. **Project Settings → API**'den *Project URL* ve *anon public* anahtarını `src/net.js` içindeki `SB_URL` ve `SB_KEY`'e yaz, `./build.sh` çalıştır.

`SB_URL` boşsa oyun çevrimdışı çalışır; hesap ve liderlik ekranları "yapılandırılmadı" der.
