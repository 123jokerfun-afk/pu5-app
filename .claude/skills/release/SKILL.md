---
name: release
description: ПУ-5 аппын шинэ хувилбарыг гаргах бүрэн дараалал — шалгалт, хувилбарын дугаар, нэгтгэл, PR, merge, амьд эсэхийг батлах. Кодын өөрчлөлт хийж дуусаад гаргах үед ашигла. Мөн "release", "гаргалт", "хувилбар гаргах", "PR хийгээд merge" гэсэн хүсэлтэд.
---

# Гаргалтын дараалал

v87-д зөрчлийн тэмдэглэгээ `index.html` дотор үлдэж, аппын JS
бүхэлдээ уналаа — талбар дээрх хүмүүс хар дэлгэц харсан. Энэ
дараалал тэрнээс сэргийлнэ. **Алхам алгасах нь ажлыг хурдасгахгүй.**

## 1. Хувилбарын дугаар

Хоёр газарт нэгэн зэрэг:

```bash
# index.html дэх APP_BUILD  (·)  ба  version.txt  (-)
grep -n "const APP_BUILD" index.html; cat version.txt
```

`2026.08.28·99` ↔ `2026.08.28-99`. Зөрвөл CI унана.

## 2. Шалгалт (commit-ийн ӨМНӨ)

```bash
cd tests
node allA.js && node allB.js
node sweepA.js && node sweepB.js
```

Хөндсөн хэсэгт тохирох тусгай шалгалтыг мөн ажиллуул:
`sizeguard.js` (хадгалалт), `parts.js` `probe.js` (тусдаа баримт),
`docid.js` (Firestore-ын нэр), `theme.js` (дүрслэл).

Мөн inline скриптүүдийн синтакс:

```bash
python3 -c "
import re;h=open('index.html').read()
m=re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>',h,re.S)
for i,x in enumerate(m): open('/tmp/s%d.js'%i,'w').write(x)
print('scripts:',len(m))"
for f in /tmp/s*.js; do node --check "$f" || echo FAIL; done
```

## 3. Commit

Монголоор. Юу өөрчилснийг биш, **яагаад** гэдгийг тайлбарла.
Зассан алдаа байвал шалтгааныг нь бич.

## 4. Нэгтгэл — ХАМГИЙН АЮУЛТАЙ АЛХАМ

```bash
git fetch origin main -q
git diff HEAD origin/main --stat
git diff HEAD origin/main -- index.html | grep "^+" | grep -v "^+++" | head
```

**Main дээр өвөрмөц зүйл байгаа эсэхийг ЭХЛЭЭД хар.** Зөвхөн таны
шинэ кодоор солигдсон хуучин мөрүүд байвал `--ours` аюулгүй. Бусад
тохиолдолд зөрчлийг **гараар** шийд.

```bash
git merge origin/main --no-edit
# зөрчил гарвал: шалгасны дараа
git checkout --ours index.html version.txt && git add index.html version.txt
```

## 5. Нэгтгэлийн ДАРАА дахин шалга

Энэ алхмыг алгассанаас v87 унасан. Алгасах эрхгүй.

```bash
grep -c "<<<<<<<\|>>>>>>>\|^=======$" index.html version.txt   # 0 байх ёстой
grep -n "const APP_BUILD" index.html; cat version.txt          # таарах ёстой
cd tests && node boot.js                                        # 10/10
```

Хөндсөн хэсгийн шалгалтыг мөн дахин ажиллуул.

## 6. Push, PR, merge

```bash
git commit --no-edit
git push -u origin <салаа>     # алдвал 2s,4s,8s,16s-ээр 4 удаа дахин оролд
```

PR-ийн тайлбар монголоор, дараах бүтэцтэй: шийдэж буй асуудал →
өөрчлөлт → шалгалтын хүснэгт. Дараа нь **squash merge**.

## 7. Амьд эсэхийг батал

Merge хийсэн нь ажиллаж байгаа гэсэн үг биш:

```bash
git fetch origin main -q && git show origin/main:index.html > /tmp/live.html
grep -c "<<<<<<<\|>>>>>>>\|^=======$" /tmp/live.html    # 0
git show origin/main:version.txt
grep -n "const APP_BUILD" /tmp/live.html
# inline скриптийн синтаксыг мөн шалга
```

Шинэ онцлог байвал түүний тэмдэглэгээ (жишээ `id="tabbar"`) main
дээр байгааг бас батал.

## Санамж

- **Тест орчинд Firebase хуурамч.** Үүлтэй холбоотой өөрчлөлт
  тестээр батлагдахгүй — бодит нөхцөлд тусад нь турш.
- Тест унавал эхлээд **аппад алдаа байгаа эсэхийг** шалга. Тестийг
  "засаж" өнгөрүүлэх нь хамгийн муу зам. Шалгалт үнэхээр хуучирсан
  бол шалтгааныг тайлбартай хамт өөрчил.
- Эрсдэлтэй шинэ зүйлийг шууд бүү асаа: урьдчилсан туршилт →
  хэрэглэгч өөрөө асаах → 3 удаа алдвал өөрөө унтрах.
