# ⚡ Ladder Master — PLC Merdiven Mantığı Bulmacası

*PLC ladder logic puzzle game for mobile — Türkçe / English* · **Sürüm v1.1.8**

Telefon ekranı için tasarlanmış, tarayıcıda çalışan bir **PLC Ladder (merdiven) mantık bulmaca oyunu**.
Tek bir HTML dosyası; harici kütüphane, görsel veya ses dosyası yok.

## Oyna
**▶ Hemen oyna / Play now:** https://tunagirit.github.io/ladder-master/

Ya da `index.html` dosyasını tarayıcıda aç.

## Özellikler
- **Yol haritası:** 10.000 bölümlük, giderek zorlaşan tek bir yol. Temel mantıkla başlar; 16. bölümde zamanlayıcılar, 36. bölümde sayıcılar, sonra karşılaştırma (46), kenar ve özel bitler (56), taşıma ve matematik (66), 7-segment dönüştürme (81), kaydırma (91), bayt mantığı (101) ve saat (111) katılır. Sonra hepsi karışık gelir; her 10. bölüm 🔥 Ekstra Zor ve birden fazla komut ailesini birleştirir. Arada, ekstra zordan daha seyrek 🎉 Bonus bölümler gelir: trafik lambası, şifreli kasa, disko ışıkları, turbo bant rekoru
- **Bant dışı sistemler (v1.1.6):** motor yol verme, termik arıza kilidi, yıldız-üçgen, ileri-geri (kilitlemeli) motor, garaj kapısı (+ fotosel), 2 katlı asansör (+ kat göstergesi), otopark bariyeri, oto yıkama, çift el emniyetli pres, sera iklimi, dönüşümlü pompalar ve ev alarmı. 60. bölümden sonra yolun yaklaşık %40'ı bu sistemlerden oluşur.
- **Sanal PLC (S7-200 tarzı):** 20 ms scan cycle
  - Bit mantığı: Açık/Kapalı kontak, Bobin, Set/Reset, paralel kol (OR), kenar algılama P/N, NOT, özel bitler SM0.0 / SM0.1 / SM0.5
  - Zamanlayıcılar ve sayıcılar: TON, TOF, TONR, CTU, CTD
  - Karşılaştırma: =, ≠, ≥, ≤, >, < (sayıcı değeri, VW değişkeni, AIW analog giriş)
  - Taşıma ve tam sayı matematiği: MOV, ADD, SUB, MUL, DIV, INC, DEC
  - Kaydırma: SHL, SHR · Bayt mantığı: WAND, WOR, INV (QB0/IB0)
  - Dönüştürme: SEG (7-segment) · Saat: READ_RTC
- **Adresler sıralı:** girişler I0.0, I0.1, I0.2…, çıkışlar Q0.0, Q0.1… diye sırayla verilir
- **Canlı izleme:** RUN modunda enerjili hatlar neon yeşil, zamanlayıcı/sayıcı değerleri canlı
- **Fabrika simülasyonu:** konveyör (VW0 ile hız ayarı), sensörler, pistonlar, dolum valfi, boya kabini, lambalar, analog seviyeli tank, ısıtmalı fırın, 7-segment gösterge, lamba panosu, gerçek zaman saati
- **Sürükle-bırak editör:** blok yerleştir, taşı, yer değiştir, palete sürükleyerek sil; bloğa basılı tutunca ne işe yaradığını anlatan balon
- **Titreşim ve animasyonlar:** dokunsal geri bildirim (Android, iOS 18+), geçiş animasyonları, kazanınca konfeti
- **Puan sistemi:** her tamamlanan bölüm 1 puan; çözümler `localStorage`'a ve (giriş yapıldıysa) buluta kaydedilir
- **Web Audio** ile üretilen röle, piston ve melodi sesleri
- **Uygulama olarak yükle (PWA):** telefonda ana ekrana eklenir, tam ekran ve internetsiz çalışır
- **Tasarım:** Material 3 Expressive — Roboto Flex, Material Symbols, dinamik renk şeması, yay (spring) animasyonları, ifadeli şekiller
- **Tema:** Açık / Karanlık / Otomatik (sistem temasını izler)
- **Dil:** Türkçe / English (tüm bölüm metinleri dahil)

## Geliştirme
Kaynak `src/` klasöründe parçalar halinde durur:

| Dosya | İçerik |
|---|---|
| `logic.js` | PLC motoru (scan cycle) ve fabrika dünyası (`World`) |
| `gen.js` | Bölüm üreticisi — temel şablonlar, adres düzeni |
| `mach.js` | Bant dışı makinelerin fiziği (motor, kapı, asansör, otopark…) |
| `gen3.js` | v1.1.6 makine bölümleri ve 10.000 bölümlük yol |
| `mdraw.js` | Makine çizimleri |
| `tour.js` | İlk giriş tanıtımı (PLC nedir, ladder, örnek, nasıl oynanır) ve Nasıl Oynanır sayfası |
| `nav.js` | Geri tuşu: uygulama içinde bir adım geri (ana menüde iki kez basınca çıkar) |
| `gen2.js` | Yeni komut aileleri şablonları, yol haritası (`TPL`), adres kuralları, eski kayıt taşıma |
| `ui_*.js`, `part_*.js`, `canvas_part.js` | Arayüz, menüler, editör, canvas sahnesi |

```sh
./build.sh                      # src/ → index.html
node tests/levels.test.js       # 10.000 bölümün hepsini referans çözümle simülasyonda doğrular (FROM/TO ile aralık)
node tests/negative.test.js     # yeni sistemlerde bozulmuş çözümlerin geçmediğini doğrular
node tests/solutions.test.js    # çözümlerin editörde kurulabilir olduğunu (palet, adres, süre) doğrular
```

Yeni bölüm tipi eklemek için `gen2.js` içindeki `TPL` dizisine bir şablon fonksiyonu eklemek yeterli.

## Çevrimiçi hesap ve liderlik tablosu (Supabase)
1. [supabase.com](https://supabase.com) → yeni proje oluştur.
2. **SQL Editor** → `supabase.sql` dosyasının içeriğini yapıştır → **Run**.
3. **Authentication → Sign In / Providers → Email** → *Confirm email* seçeneğini **kapat** (kullanıcı adı + şifre ile giriş için).
4. **Project Settings → API**'den *Project URL* ve *anon public* anahtarını `src/net.js` içindeki `SB_URL` ve `SB_KEY`'e yaz, `./build.sh` çalıştır.

`SB_URL` boşsa oyun çevrimdışı çalışır; hesap ve liderlik ekranları "yapılandırılmadı" der.
