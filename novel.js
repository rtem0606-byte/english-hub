// =========================================================================
// MIDNIGHT NEVER COMES — ВИЗУАЛЬНАЯ НОВЕЛЛА (ДВИЖОК + СЕЗОН 1, ЭПИЗОД 1)
// =========================================================================
(function() {
  const SAVE_KEY = 'esh_vn_chronicles_v3';
  const DECKS_KEY = 'esh_custom_decks_v1';

  // ==================== 1. ФОНЫ И ПЕРСОНАЖИ ====================
  const BACKGROUNDS = {
    black: {
      file: '',
      fallback: 'radial-gradient(circle at 50% 45%, #161113 0%, #050405 100%)',
      fog: false
    },
    wisteria_morning: {
      file: 'novel/bg-wisteria-morning.jpg',
      fallback: 'linear-gradient(180deg, #4b7999 0%, #9dc3d4 45%, #4f7348 46%, #2f472c 100%)',
      fog: false
    },
    wisteria_fog: {
      file: 'novel/bg-wisteria-fog.jpg',
      fallback: 'linear-gradient(180deg, #161f29 0%, #2c3842 50%, #141a1d 100%)',
      fog: true
    },
    house_hall: {
      file: 'novel/bg-house-hall.jpg',
      fallback: 'radial-gradient(circle at 50% 30%, rgba(201, 162, 75, 0.16), transparent 60%), linear-gradient(180deg, #18120f 0%, #261b15 55%, #0d0908 100%)',
      fog: false
    },
    sam_garage: {
      file: 'novel/bg-sam-garage.jpg',
      fallback: 'radial-gradient(circle at 65% 42%, rgba(230, 162, 68, 0.24), transparent 52%), linear-gradient(180deg, #0b0e14 0%, #181d26 52%, #07080b 100%)',
      fog: true
    },
    clock_tower: {
      file: 'novel/bg-clock-tower.jpg',
      fallback: 'radial-gradient(circle at 50% 28%, rgba(212, 175, 55, 0.25), transparent 55%), linear-gradient(180deg, #0b1320 0%, #1c2433 52%, #0b0c10 100%)',
      fog: true
    },
    regina_office: {
      file: 'novel/bg-regina-office.jpg',
      fallback: 'radial-gradient(circle at 50% 32%, rgba(168, 64, 136, 0.22), transparent 55%), linear-gradient(180deg, #140b12 0%, #24131c 52%, #0a0609 100%)',
      fog: false
    }
  };

  // Движок сам сначала ищет прозрачный .png, а если его нет — берёт .jpg
  const CHARACTERS = {
    clara: {
      name: 'Clara Vance',
      ruName: 'Клара Вэнс',
      series: 'Wisteria Lane',
      color: '#c84b59',
      monogram: 'CV',
      breathDur: '4.5s',
      breathDelay: '-0.4s',
      emotions: {
        calm: 'novel/char-clara-calm',
        suspicious: 'novel/char-clara-suspicious'
      },
      fallbackImg: 'house-wives.jpg'
    },
    lucas: {
      name: 'Lucas Grant',
      ruName: 'Лукас Грант',
      series: 'Wisteria Lane',
      color: '#5b8fb9',
      monogram: 'LG',
      breathDur: '5.1s',
      breathDelay: '-2.1s',
      emotions: {
        calm: 'novel/char-lucas-calm',
        serious: 'novel/char-lucas-serious'
      },
      fallbackImg: 'house-wives.jpg'
    },
    sam: {
      name: 'Sam Winchester',
      ruName: 'Сэм Винчестер',
      series: 'Supernatural',
      color: '#739e73',
      monogram: 'SW',
      breathDur: '5.4s',
      breathDelay: '-1.3s',
      emotions: {
        calm: 'novel/char-sam-calm',
        serious: 'novel/char-sam-serious'
      },
      fallbackImg: 'spn-card.jpg'
    },
    regina: {
      name: 'Regina Mills',
      ruName: 'Реджина Миллс',
      series: 'Storybrooke',
      color: '#a855f7',
      monogram: 'RM',
      breathDur: '4.7s',
      breathDelay: '-2.8s',
      emotions: {
        calm: 'novel/char-regina-calm',
        serious: 'novel/char-regina-serious'
      },
      fallbackImg: 'once-upon.jpg'
    }
  };

  const MC_PORTRAITS = {
    m: 'novel/char-mc-male',
    f: 'novel/char-mc-female'
  };

  // ==================== 2. СЕЗОН 1 · ЭПИЗОД 1: ONE MINUTE TO MIDNIGHT ====================
  const EPISODE_1 = {
    id: 'ep1',
    season: 1,
    number: 1,
    title: 'One Minute to Midnight',
    ruTitle: 'За минуту до полуночи',
    vocab: [
      { en: 'keep up appearances', ru: 'держать марку / делать вид, что всё в порядке', ex: 'On Wisteria Lane, Lucas, we always keep up appearances.' },
      { en: 'move on', ru: 'двигаться дальше / уйти в новую жизнь', ex: 'The old neighbors moved on years ago, but the street never changed.' },
      { en: 'out of nowhere', ru: 'из ниоткуда / внезапно', ex: 'A wall of freezing fog appeared out of nowhere.' },
      { en: 'freeze in place', ru: 'замереть на месте', ex: 'Every clock on the street froze in place at 11:59.' },
      { en: 'something is off', ru: 'что-то здесь не так', ex: 'I thought I was out, but something is seriously off.' },
      { en: 'walk away', ru: 'уйти / оставить прошлое позади', ex: 'I promised myself I would walk away from hunting.' },
      { en: 'go wrong', ru: 'пойти не так', ex: 'My light spell was meant to bring peace, so how did it go wrong?' },
      { en: 'keep a straight face', ru: 'сохранять невозмутимое лицо', ex: 'Keep a straight face, Clara. What are you hiding?' },
      { en: 'cut the small talk', ru: 'хватит светских бесед / к делу', ex: 'Cut the small talk and tell me why my name is on that mailbox.' },
      { en: 'figure out', ru: 'разобраться / выяснить', ex: 'Let us stay calm and figure out what happened to this street.' },
      { en: 'catch my eye', ru: 'привлечь моё внимание', ex: 'Something shiny on the table caught my eye.' },
      { en: 'take cover', ru: 'укрыться от опасности', ex: 'Watch out! Take cover behind the car!' },
      { en: 'on edge', ru: 'на взводе / в напряжении', ex: 'Everyone in town is on edge since the fog arrived.' },
      { en: 'back me up', ru: 'прикрыть меня / поддержать', ex: 'If things get ugly, can you back me up?' },
      { en: 'for good', ru: 'навсегда', ex: 'I hoped the monsters were gone for good.' },
      { en: 'pull the strings', ru: 'дёргать за ниточки / управлять из тени', ex: 'Someone is pulling the strings behind this curse.' },
      { en: 'walk in blind', ru: 'действовать вслепую', ex: 'Without magic, you are walking in blind.' },
      { en: 'watch out for', ru: 'остерегаться кого-то / быть начеку', ex: 'Watch out for the new guests from Mystic Falls.' }
    ],
    nodes: {
      // ==================== ПРОЛОГ: ТРИ МИРА ДО СБОЯ ====================
      p1_1: {
        bg: 'wisteria_morning',
        chapterTag: 'WISTERIA LANE · 11:58',
        speaker: 'Закадровый голос',
        speakerStyle: 'narrator',
        en: 'Years ago, the women who made Wisteria Lane famous packed their suitcases and moved on. New families moved into the old houses, painted the fences white, and swore they only wanted peace.',
        ru: 'Много лет назад женщины, прославившие Вистерия Лейн, собрали чемоданы и уехали. В старые дома въехали новые жильцы, перекрасили заборы в белый и поклялись, что им нужен только покой.',
        next: 'p1_2'
      },
      p1_2: {
        bg: 'wisteria_morning',
        speaker: 'Закадровый голос',
        speakerStyle: 'narrator',
        en: 'But streets like this never truly stay quiet. On a crisp November morning, the grass was neat, the coffee was hot—and behind every polite smile, someone was counting down the minutes.',
        ru: 'Но такие улицы никогда не остаются тихими надолго. Тем свежим ноябрьским утром газоны были подстрижены, кофе — горячим, а за каждой вежливой улыбкой кто-то уже отсчитывал минуты.',
        next: 'p1_3'
      },
      p1_3: {
        bg: 'wisteria_morning',
        chars: [
          { id: 'clara', emo: 'calm', pos: 'left', active: true },
          { id: 'lucas', emo: 'calm', pos: 'right', active: false }
        ],
        speaker: 'clara',
        en: 'Good morning, Lucas! Fresh lemon muffins, still warm from the oven. And please tell me you finally trimmed those bushes by your porch.',
        ru: 'Доброе утро, Лукас! Свежие лимонные маффины, ещё тёплые из духовки. И скажи, пожалуйста, что ты наконец подстриг кусты у крыльца.',
        next: 'p1_4'
      },
      p1_4: {
        bg: 'wisteria_morning',
        chars: [
          { id: 'clara', emo: 'calm', pos: 'left', active: false },
          { id: 'lucas', emo: 'calm', pos: 'right', active: true }
        ],
        speaker: 'lucas',
        en: 'Morning, Clara. I left the city to escape editors and deadlines, not to join a garden patrol. Nobody is checking our lawns with a ruler.',
        ru: 'Утро, Клара. Я уехал из города, чтобы сбежать от редакторов и дедлайнов, а не записаться в садовый патруль. Никто не ходит по газонам с линейкой.',
        next: 'p1_5'
      },
      p1_5: {
        bg: 'wisteria_morning',
        chars: [
          { id: 'clara', emo: 'calm', pos: 'left', active: true },
          { id: 'lucas', emo: 'calm', pos: 'right', active: false }
        ],
        speaker: 'clara',
        en: 'I am checking, Lucas. On Wisteria Lane, we always keep up appearances. Order is the only thing that keeps chaos outside the gate.',
        ru: 'Я хожу, Лукас. На Вистерия Лейн мы всегда держим марку. Порядок — единственное, что не пускает хаос за ворота.',
        next: 'p1_6'
      },
      p1_6: {
        bg: 'wisteria_morning',
        chars: [
          { id: 'clara', emo: 'calm', pos: 'left', active: false },
          { id: 'lucas', emo: 'calm', pos: 'right', active: true }
        ],
        speaker: 'lucas',
        en: 'Sure, sure. By the way, did you see anyone moving into the empty lot next to your house? I could have sworn I heard hammering at three in the morning.',
        ru: 'Ну да, ну да. Кстати, ты не видела, чтобы кто-то въезжал на пустой участок рядом с тобой? Клянусь, в три часа ночи я слышал какой-то стук.',
        next: 'p1_7'
      },
      p1_7: {
        bg: 'wisteria_morning',
        chars: [
          { id: 'clara', emo: 'suspicious', pos: 'left', active: true },
          { id: 'lucas', emo: 'calm', pos: 'right', active: false }
        ],
        speaker: 'clara',
        en: 'You stay up way too late, Lucas. There is nothing on that lot except wet grass and—',
        ru: 'Ты слишком поздно ложишься, Лукас. На том участке ничего нет, кроме мокрой травы и...',
        next: 'p1_8'
      },
      p1_8: {
        bg: 'wisteria_morning',
        chars: [
          { id: 'clara', emo: 'suspicious', pos: 'left', active: false },
          { id: 'lucas', emo: 'serious', pos: 'right', active: true }
        ],
        sfx: 'tick',
        speaker: 'Закадровый голос',
        speakerStyle: 'narrator',
        en: 'She never finished the sentence. Every bird on the lane stopped singing at once. Through Clara\'s open kitchen window, the wall clock began to tick—slow, heavy, impossibly loud.',
        ru: 'Она не успела договорить. Все птицы на улице смолкли в одну секунду. Из открытого кухонного окна Клары донеслось тиканье настенных часов — медленное, тяжёлое, неестественно громкое.',
        next: 'p1_9'
      },
      p1_9: {
        bg: 'wisteria_fog',
        cg: 'clock_1159',
        sfx: 'chime',
        fx: 'glitch',
        speaker: 'lucas',
        en: 'Whoa! What the—? My coffee! Where did this freezing mist come from? It rolled in out of nowhere!',
        ru: 'Ого! Что за чёрт?.. Мой кофе! Откуда взялся этот ледяной туман? Он накрыл улицу буквально из ниоткуда!',
        next: 'p1_10'
      },
      p1_10: {
        bg: 'wisteria_fog',
        chars: [
          { id: 'clara', emo: 'suspicious', pos: 'left', active: false },
          { id: 'lucas', emo: 'serious', pos: 'right', active: true }
        ],
        speaker: 'lucas',
        en: 'My watch stopped! 11:59. And my phone has zero bars—not even emergency calls. Clara, look at the end of the street!',
        ru: 'Мои часы встали! 11:59. И телефон вообще не ловит — даже экстренные вызовы. Клара, посмотри в конец улицы!',
        next: 'p1_11'
      },
      p1_11: {
        bg: 'wisteria_fog',
        chars: [{ id: 'clara', emo: 'suspicious', pos: 'center', active: true }],
        speaker: 'Рассказчик',
        speakerStyle: 'narrator',
        en: 'Across the driveway, Clara doesn\'t look at the street. She stares straight at the empty lot beside her fence, her knuckles white around the basket handle. She whispers so softly Lucas doesn\'t hear:',
        ru: 'Через дорогу Клара даже не смотрит в конец улицы. Она не отрывает взгляда от пустого участка у своего забора, до побеления сжимая ручку корзинки, и шепчет так тихо, что Лукас не слышит:',
        next: 'p1_12'
      },
      p1_12: {
        bg: 'wisteria_fog',
        chars: [{ id: 'clara', emo: 'suspicious', pos: 'center', active: true }],
        speaker: 'clara',
        en: 'Too early... No, it wasn\'t supposed to start until midnight.',
        ru: 'Слишком рано... Нет, это не должно было начаться до полуночи.',
        next: 'p2_1'
      },

      // --- ПРОЛОГ: ГАРАЖ СЭМА ВИНЧЕСТЕРА ---
      p2_1: {
        bg: 'sam_garage',
        chapterTag: 'ГАРАЖ СЭМА · НОЧЬ',
        chars: [{ id: 'sam', emo: 'calm', pos: 'center', active: true }],
        speaker: 'Рассказчик',
        speakerStyle: 'narrator',
        en: 'Hundreds of miles away, rain taps softly on the roof of a quiet wooden garage. Sam Winchester leans over a workbench, tightening a loose wire inside an old desk radio.',
        ru: 'За сотни миль оттуда дождь тихо стучит по крыше старого деревянного гаража. Сэм Винчестер склонился над верстаком, подкручивая провод в старом радиоприёмнике.',
        next: 'p2_2'
      },
      p2_2: {
        bg: 'sam_garage',
        chars: [{ id: 'sam', emo: 'calm', pos: 'center', active: true }],
        speaker: 'Рассказчик',
        speakerStyle: 'narrator',
        en: 'Behind him sits a black 1967 Impala, hidden under a heavy gray tarp. He hasn\'t turned the key in months.',
        ru: 'Позади него под тяжёлым серым брезентом стоит чёрная Impala 1967 года. Он не поворачивал ключ в зажигании уже несколько месяцев.',
        next: 'p2_3'
      },
      p2_3: {
        bg: 'sam_garage',
        chars: [{ id: 'sam', emo: 'calm', pos: 'center', active: true }],
        speaker: 'sam',
        en: 'One quiet life. That was the deal, Dean. No hunts, no midnight highways—I walked away for good.',
        ru: 'Одна спокойная жизнь. Так мы договорились, Дин. Никакой охоты, никаких ночных трасс — я ушёл навсегда.',
        next: 'p2_4'
      },
      p2_4: {
        bg: 'sam_garage',
        chars: [{ id: 'sam', emo: 'serious', pos: 'center', active: true }],
        sfx: 'static',
        fx: 'glitch',
        speaker: 'Рассказчик',
        speakerStyle: 'narrator',
        en: 'KZZZHT! The radio explodes into harsh white noise. Above the bench, a dusty brass EMF meter lights up red all the way to the top and starts screaming.',
        ru: 'КЗЗЗТ! Радио срывается в резкий белый шум. На полке над верстаком пыльный латунный датчик ЭМП загорается красным до самого предела и начинает пронзительно пищать.',
        next: 'p2_5'
      },
      p2_5: {
        bg: 'sam_garage',
        cg: 'clock_1159',
        sfx: 'tick',
        speaker: 'Рассказчик',
        speakerStyle: 'narrator',
        en: 'A ribbon of cold silver fog creeps under the closed garage door. The wall clock freezes at 11:59. Sam doesn\'t hesitate—he grabs the heavy tarp and pulls it off the Impala\'s hood.',
        ru: 'Полоска холодного серебристого тумана заползает под закрытые ворота гаража. Настенные часы замирают на 11:59. Сэм не медлит — берётся за край брезента и сдёргивает его с капота Импалы.',
        next: 'p2_6'
      },
      p2_6: {
        bg: 'sam_garage',
        chars: [{ id: 'sam', emo: 'serious', pos: 'center', active: true }],
        speaker: 'sam',
        en: 'I thought I was out... Something is seriously off. Come on, baby—looks like we have one more job.',
        ru: 'А я думал, всё позади... Что-то здесь серьёзно не так. Ну что, детка — похоже, у нас ещё одно дело.',
        next: 'p3_1'
      },

      // --- ПРОЛОГ: СТОРИБРУК / КАБИНЕТ РЕДЖИНЫ ---
      p3_1: {
        bg: 'clock_tower',
        chapterTag: 'STORYBROOKE · ПОЛНОЧЬ',
        cg: 'clock_1159',
        sfx: 'chime',
        speaker: 'Рассказчик',
        speakerStyle: 'narrator',
        en: 'High above the damp square of Storybrooke, the giant Clock Tower groans with the sound of grinding iron. Its heavy hands shudder and lock one minute before midnight.',
        ru: 'Высоко над сырой площадью Сторибрука старинная Часовая башня стонет со скрежетом железа. Её тяжёлые стрелки вздрагивают и замирают за минуту до полуночи.',
        next: 'p3_2'
      },
      p3_2: {
        bg: 'regina_office',
        chars: [{ id: 'regina', emo: 'calm', pos: 'center', active: true }],
        speaker: 'Рассказчик',
        speakerStyle: 'narrator',
        en: 'Inside her dark mahogany study overlooking the square, Queen Regina Mills stands over the glowing parchment map of the United Realms. All evening, the borders have been completely still.',
        ru: 'В своём кабинете из тёмного дерева с видом на площадь Королева Реджина Миллс склонилась над светящейся картой Объединённых Королевств. Весь вечер границы оставались неподвижными.',
        next: 'p3_3'
      },
      p3_3: {
        bg: 'regina_office',
        chars: [{ id: 'regina', emo: 'serious', pos: 'center', active: true }],
        sfx: 'crack',
        fx: 'shake',
        speaker: 'Рассказчик',
        speakerStyle: 'narrator',
        en: 'Then the golden ink boils over the edge of the map. New roads draw themselves out of thin air: a neat suburban cul-de-sac and a dark strip of forest highway.',
        ru: 'А потом золотые чернила закипают и переливаются через край карты. Прямо из воздуха прорисовываются чужие дороги: аккуратный пригородный тупик и тёмная полоса лесного шоссе.',
        next: 'p3_4'
      },
      p3_4: {
        bg: 'regina_office',
        chars: [{ id: 'regina', emo: 'serious', pos: 'center', active: true }],
        speaker: 'Рассказчик',
        speakerStyle: 'narrator',
        en: 'Regina lifts her palm to burn the anomaly away. Purple sparks flare around her fingers—and instantly scatter into gray smoke.',
        ru: 'Реджина поднимает ладонь, чтобы выжечь аномалию. Вокруг пальцев вспыхивают фиолетовые искры — и тут же рассыпаются серым дымом.',
        next: 'p3_5'
      },
      p3_5: {
        bg: 'regina_office',
        chars: [{ id: 'regina', emo: 'serious', pos: 'center', active: true }],
        speaker: 'regina',
        en: 'Impossible. My light spell united the realms in peace—how did it go wrong? Someone is pulling the strings... and stitching strangers straight into my city.',
        ru: 'Невозможно. Моё светлое заклинание объединило миры без тьмы — как оно могло пойти не так? Кто-то дёргает за ниточки... и вшивает чужаков прямо в мой город.',
        next: 'title_card'
      },

      // ==================== ЗАСТАВКА СЕРИИ ====================
      title_card: {
        type: 'title_card',
        bg: 'clock_tower',
        sfx: 'chime',
        titleMain: 'MIDNIGHT NEVER COMES',
        titleEp: 'СЕЗОН 1 · ЭПИЗОД I',
        titleSub: 'ONE MINUTE TO MIDNIGHT',
        next: 'act1_1'
      },

      // ==================== АКТ 1: ДОМ № 4354 ====================
      act1_1: {
        bg: 'house_hall',
        chapterTag: 'АКТ I // ДОМ № 4354',
        speaker: 'Рассказчик',
        speakerStyle: 'narrator',
        en: 'You wake up standing in a quiet wooden foyer. Your coat is still damp from rain you don\'t remember walking through. The house smells of old books, lemon wax, and cold autumn air.',
        ru: 'Ты приходишь в себя в тихой деревянной прихожей. Твоё пальто всё ещё влажное от дождя, под который ты не помнишь, как попал(а). В доме пахнет старыми книгами, лимонным воском и холодным осенним воздухом.',
        next: 'act1_2'
      },
      act1_2: {
        bg: 'house_hall',
        speaker: 'Рассказчик',
        speakerStyle: 'narrator',
        en: 'Behind the lace curtains of the front door, thick silver fog presses against the glass like water. Down the hall, everything is silent—not even the hum of a fridge.',
        ru: 'За кружевными занавесками входной двери к стеклу, точно вода, прижимается густой серебристый туман. В глубине дома мёртвая тишина — не гудит даже холодильник.',
        next: 'act1_3'
      },
      act1_3: {
        bg: 'house_hall',
        speaker: 'Рассказчик',
        speakerStyle: 'narrator',
        en: 'You reach into your pocket for your phone, only to find a dead black screen. Right ahead of you stands a tall antique mirror with a thin crack in its upper corner.',
        ru: 'Ты лезешь в карман за телефоном, но экран мёртвый и чёрный. Прямо перед тобой стоит высокое старинное зеркало с тонкой трещиной в верхнем углу.',
        next: 'act1_mirror'
      },
      act1_mirror: {
        type: 'setup_player',
        bg: 'house_hall',
        next: 'act1_journal_1'
      },
      act1_journal_1: {
        bg: 'house_hall',
        cg: 'journal_note',
        sfx: 'reveal',
        speaker: 'Рассказчик',
        speakerStyle: 'narrator',
        en: 'Something on the mahogany table catches your eye: a heavy dark-brown leather journal with your name—{name}—pressed into the cover in faded gold.',
        ru: 'На столике из красного дерева кое-что привлекает твоё внимание: тяжёлый тёмно-коричневый кожаный дневник с твоим именем — {name} — вытисненным на обложке потускневшим золотом.',
        next: 'act1_journal_2'
      },
      act1_journal_2: {
        bg: 'house_hall',
        cg: 'journal_note',
        speaker: 'Рассказчик',
        speakerStyle: 'narrator',
        en: 'Your fingers feel oddly cold as you open it. Almost every page is empty, and the very first sheet has been torn out cleanly along the spine—leaving only a jagged paper edge.',
        ru: 'Пальцы неприятно холодеют, когда ты раскрываешь его. Почти все страницы чистые, а самый первый лист аккуратно вырван вдоль корешка — осталась лишь неровная бумажная кромка.',
        next: 'act1_journal_3'
      },
      act1_journal_3: {
        bg: 'house_hall',
        cg: 'journal_note',
        speaker: 'Запись в дневнике',
        speakerStyle: 'note',
        en: '"Do not trust the first smile you see. Find the missing page before the clock strikes twelve."',
        ru: '«Не доверяй первой улыбке, которую увидишь. Найди пропавшую страницу до того, как часы пробьют двенадцать».',
        next: 'act1_journal_4'
      },
      act1_journal_4: {
        bg: 'house_hall',
        speaker: 'Рассказчик',
        speakerStyle: 'narrator',
        en: 'That is your own handwriting—every loop, every slanted letter. Yet you have zero memory of writing it. Outside on the gravel walkway, footsteps suddenly crunch toward your porch.',
        ru: 'Это твой собственный почерк — каждый изгиб, каждый наклон букв. Но ты совершенно не помнишь, как писал(а) это. Снаружи по гравийной дорожке к крыльцу внезапно приближаются шаги.',
        next: 'act1_inspect_choice'
      },
      act1_inspect_choice: {
        type: 'choice',
        bg: 'house_hall',
        promptRu: 'У тебя есть пара секунд до того, как гость подойдёт к двери. Что сделаешь?',
        options: [
          {
            en: 'Look closely at the crack in the mirror before turning away.',
            ru: 'Вглядеться в трещину зеркала, прежде чем отвернуться.',
            stat: { intuition: 1 },
            setFlag: { sawMirrorLag: true },
            toast: '+1 Интуиция · Ты заметил(а) странность в отражении',
            goto: 'act1_insp_mirror'
          },
          {
            en: 'Hide the journal inside your coat and check your pockets.',
            ru: 'Спрятать дневник под пальто и проверить карманы.',
            stat: { composure: 1 },
            setFlag: { foundBrassKey: true },
            toast: '+1 Хладнокровие · Найден старинный латунный ключ',
            goto: 'act1_insp_pocket'
          },
          {
            en: 'Walk straight to the front door and pull it open first.',
            ru: 'Подойти к двери и распахнуть её первым(ой).',
            stat: { audacity: 1 },
            setFlag: { openedFirst: true },
            toast: '+1 Дерзость · Ты не привык(ла) прятаться',
            goto: 'act1_insp_door'
          }
        ]
      },
      act1_insp_mirror: {
        bg: 'house_hall',
        sfx: 'heartbeat',
        speaker: 'Рассказчик',
        speakerStyle: 'narrator',
        en: 'You blink—and your reflection blinks half a second late. Time inside house 4354 is slightly out of sync, just like the frozen clocks outside.',
        ru: 'Ты моргаешь — а твоё отражение моргает на полсекунды позже. Время внутри дома № 4354 сбилось, точно так же, как и замершие часы снаружи.',
        next: 'act1_knock'
      },
      act1_insp_pocket: {
        bg: 'house_hall',
        sfx: 'reveal',
        speaker: 'Рассказчик',
        speakerStyle: 'narrator',
        en: 'You tuck the journal under your coat and feel cold metal in your left pocket: an antique brass key with no tag, engraved with tiny Roman numerals—XI:LIX.',
        ru: 'Ты прячешь дневник под пальто и нащупываешь в левом кармане холодный металл: старинный латунный ключ без бирки, на котором выгравированы мелкие римские цифры — XI:LIX.',
        next: 'act1_knock'
      },
      act1_insp_door: {
        bg: 'wisteria_fog',
        chars: [{ id: 'clara', emo: 'suspicious', pos: 'center', active: true }],
        speaker: 'Рассказчик',
        speakerStyle: 'narrator',
        en: 'You swing the heavy door open before her knuckles even touch the wood. A neatly dressed woman in a burgundy dress freezes for half a second—her hand still raised in mid-air.',
        ru: 'Ты распахиваешь тяжёлую дверь раньше, чем её костяшки успевают коснуться дерева. Безупречно одетая женщина в бордовом платье на полсекунды замирает с поднятой рукой.',
        next: 'act2_clara_greet'
      },
      act1_knock: {
        bg: 'house_hall',
        sfx: 'knock',
        fx: 'shake',
        speaker: 'Рассказчик',
        speakerStyle: 'narrator',
        en: 'Knock. Knock. Knock. Three crisp, polite raps echo through the hall. You steady your breathing and turn the brass handle.',
        ru: 'Тук. Тук. Тук. Три чётких, вежливых стука отдаются эхом по прихожей. Ты переводишь дыхание и поворачиваешь латунную ручку.',
        next: 'act2_clara_greet'
      },

      // ==================== АКТ 2: ВИСТЕРИЯ ЛЕЙН И СОСЕДИ ====================
      act2_clara_greet: {
        bg: 'wisteria_fog',
        chapterTag: 'АКТ II // ВИСТЕРИЯ ЛЕЙН',
        chars: [{ id: 'clara', emo: 'calm', pos: 'center', active: true }],
        speaker: 'clara',
        en: 'Oh! Good morning! Welcome to Wisteria Lane, {name}. I am Clara Vance from across the street. I brought warm lemon muffins to help you settle in.',
        ru: 'О! Доброе утро! Добро пожаловать на Вистерия Лейн, {name}. Я Клара Вэнс из дома напротив. Принесла тёплых лимонных маффинов, чтобы помочь тебе освоиться.',
        next: 'act2_clara_2'
      },
      act2_clara_2: {
        bg: 'wisteria_fog',
        chars: [{ id: 'clara', emo: 'calm', pos: 'center', active: true }],
        speaker: 'Рассказчик',
        speakerStyle: 'narrator',
        en: 'She smiles as if the whole neighborhood isn\'t buried in freezing silver fog. Before you can even say a word, boots hurry across the wet asphalt behind her.',
        ru: 'Она улыбается так, словно всю улицу не накрыл ледяной серебристый туман. Не успеваешь ты открыть рот, как позади неё по мокрому асфальту раздаются быстрые шаги.',
        next: 'act2_lucas_arrive'
      },
      act2_lucas_arrive: {
        bg: 'wisteria_fog',
        chars: [
          { id: 'clara', emo: 'calm', pos: 'left', active: false },
          { id: 'lucas', emo: 'serious', pos: 'right', active: true }
        ],
        speaker: 'lucas',
        en: 'Seriously, Clara? Muffins?! The phone lines are dead, every clock stopped at 11:59, and the end of our street now crashes straight into some old stone town square!',
        ru: 'Серьёзно, Клара? Маффины?! Телефонная связь мертва, все часы встали на 11:59, а конец нашей улицы теперь упирается прямо в какую-то старую каменную площадь!',
        next: 'act2_lucas_intro'
      },
      act2_lucas_intro: {
        bg: 'wisteria_fog',
        chars: [
          { id: 'clara', emo: 'calm', pos: 'left', active: false },
          { id: 'lucas', emo: 'calm', pos: 'right', active: true }
        ],
        speaker: 'lucas',
        en: 'Sorry—I am Lucas Grant, house 4351. Used to be a reporter. And I swear on my career that house 4354 did NOT exist on this street ten minutes ago.',
        ru: 'Прости — я Лукас Грант, дом 4351. В прошлом журналист. И клянусь своей карьерой, дома № 4354 НЕ существовало на этой улице десять минут назад.',
        next: 'act2_clara_deflect'
      },
      act2_clara_deflect: {
        bg: 'wisteria_fog',
        chars: [
          { id: 'clara', emo: 'calm', pos: 'left', active: true },
          { id: 'lucas', emo: 'serious', pos: 'right', active: false }
        ],
        speaker: 'clara',
        en: 'Lucas, please. You are making our new neighbor on edge. Strange fog happens in November, and shouting on the porch never solved anything. Isn\'t that right, {name}?',
        ru: 'Лукас, пожалуйста. Ты только нервируешь нашего нового соседа. В ноябре бывает странный туман, а крики на крыльце ещё никому не помогли. Правда, {name}?',
        next: 'act2_choice1'
      },
      act2_choice1: {
        type: 'choice',
        bg: 'wisteria_fog',
        chars: [
          { id: 'clara', emo: 'suspicious', pos: 'left', active: true },
          { id: 'lucas', emo: 'calm', pos: 'right', active: true }
        ],
        promptRu: 'Ты вспоминаешь запись в дневнике: «Не доверяй первой улыбке». А Клара к тому же уже знает твоё имя. Как ответишь?',
        options: [
          {
            en: '"Keep a straight face, Clara. You don\'t look surprised at all—what are you hiding?"',
            ru: '«Сохраняй невозмутимое лицо, Клара. Ты вообще не выглядишь удивлённой — что ты скрываешь?»',
            stat: { intuition: 1 },
            rel: { lucas: 1, clara: -1 },
            setFlag: { suspectedClara: true },
            toast: '+1 Интуиция · Лукас оценил вопрос · Клара насторожилась',
            goto: 'act2_c1_int'
          },
          {
            en: '"Thank you for the welcome, Clara. Let\'s stay calm and figure out this fog together."',
            ru: '«Спасибо за приём, Клара. Давайте сохранять спокойствие и разберёмся с этим туманом вместе».',
            stat: { composure: 1 },
            rel: { clara: 2 },
            setFlag: { politeToClara: true },
            toast: '+1 Хладнокровие · Клара оценила твои манеры',
            goto: 'act2_c1_comp'
          },
          {
            en: '"Cut the small talk. How do you already know my name if I just woke up here?"',
            ru: '«Хватит светских бесед. Откуда ты уже знаешь моё имя, если я только очнулся(лась) здесь?»',
            stat: { audacity: 1 },
            rel: { lucas: 1, clara: -1 },
            setFlag: { boldWithClara: true },
            toast: '+1 Дерзость · Ты сразу взял(а) разговор в свои руки',
            goto: 'act2_c1_aud'
          }
        ]
      },
      act2_c1_int: {
        bg: 'wisteria_fog',
        chars: [{ id: 'clara', emo: 'suspicious', pos: 'center', active: true }],
        speaker: 'clara',
        en: 'What an active imagination. Your name is engraved on the brass mailbox right behind your shoulder. Though I can tell you are sharper than most people who arrive here.',
        ru: 'Какое богатое воображение. Твоё имя выгравировано на латунном почтовом ящике прямо за твоим плечом. Впрочем, вижу, ты наблюдательнее большинства тех, кто сюда попадает.',
        next: 'act2_clara_slip'
      },
      act2_c1_comp: {
        bg: 'wisteria_fog',
        chars: [{ id: 'clara', emo: 'calm', pos: 'center', active: true }],
        speaker: 'clara',
        en: 'Finally, someone civilized! Your name was already on the mailbox when the mist rolled in. And if you want answers, look toward that tall Clock Tower—the woman who runs that square is already watching us.',
        ru: 'Наконец-то цивилизованный человек! Твоё имя уже было на почтовом ящике, когда наполз туман. А если хочешь ответов, смотри в сторону той высокой Часовой башни — женщина, которая там всем заправляет, уже наблюдает за нами.',
        next: 'act2_clara_slip'
      },
      act2_c1_aud: {
        bg: 'wisteria_fog',
        chars: [{ id: 'clara', emo: 'suspicious', pos: 'center', active: true }],
        speaker: 'clara',
        en: 'Goodness, such sharp manners! Check your own mailbox—your name is right there in brass. Just remember, {name}, loud voices attract the wrong kind of neighbors.',
        ru: 'Боже мой, какие резкие манеры! Взгляни на свой почтовый ящик — твоё имя там выбито на латуни. Только помни, {name}, громкие голоса привлекают не тех соседей.',
        next: 'act2_clara_slip'
      },
      act2_clara_slip: {
        bg: 'wisteria_fog',
        chars: [
          { id: 'clara', emo: 'calm', pos: 'left', active: false },
          { id: 'lucas', emo: 'serious', pos: 'right', active: true }
        ],
        speaker: 'lucas',
        en: 'Wait a second. You just said "most people who arrive here." And how do you know a woman runs that Clock Tower? The fog showed up ten minutes ago!',
        ru: 'Погоди секунду. Откуда ты знаешь, что там кто-то заправляет и что сюда кто-то «попадает»? Туман появился десять минут назад!',
        next: 'act2_clara_tea'
      },
      act2_clara_tea: {
        bg: 'wisteria_fog',
        chars: [{ id: 'clara', emo: 'calm', pos: 'center', active: true }],
        speaker: 'clara',
        en: 'You always twist people\'s words, Lucas. Now if you will excuse me, I need to check on my rose garden before the frost ruins it. Oh—and {name}, I will leave a little packet of dried herbal tea on your porch railing. Vervain and mint. Wonderful for keeping a clear head.',
        ru: 'Ты вечно перекручиваешь чужие слова, Лукас. А теперь прошу извинить — мне нужно проверить розарий, пока его не побил мороз. И да, {name}, я оставлю на перилах пакетик сушёного травяного чая. Вербена и мята. Чудесно помогает сохранять ясную голову.',
        next: 'act2_tea_choice'
      },
      act2_tea_choice: {
        type: 'choice',
        bg: 'wisteria_fog',
        chars: [{ id: 'lucas', emo: 'calm', pos: 'center', active: true }],
        promptRu: 'Клара уходит через дорогу в туман. Заберёшь её пакетик с сушёной вербеной?',
        options: [
          {
            en: 'Take the vervain packet and slip it into your pocket.',
            ru: 'Забрать пакетик с вербеной и убрать в карман.',
            setFlag: { hasVervain: true },
            rel: { clara: 1 },
            toast: 'Получен предмет: Сушёная вербена',
            goto: 'act2_street_1'
          },
          {
            en: 'Leave it on the railing—you don\'t trust gifts from Clara.',
            ru: 'Оставить на перилах — не стоит брать подарки от Клары.',
            setFlag: { hasVervain: false },
            stat: { composure: 1 },
            toast: '+1 Хладнокровие · Осторожность превыше всего',
            goto: 'act2_street_1'
          }
        ]
      },
      act2_street_1: {
        bg: 'wisteria_fog',
        chars: [{ id: 'lucas', emo: 'serious', pos: 'center', active: true }],
        speaker: 'lucas',
        en: 'Did you see her eyes when the fog hit? She wasn\'t scared—she was annoyed, like someone broke her schedule. And look at the rest of the street: every other house is completely empty.',
        ru: 'Ты видел(а) её глаза, когда ударил туман? Она не испугалась — она разозлилась, словно кто-то сбил ей расписание. И посмотри на остальные дома на улице: в них вообще никого нет.',
        next: 'act2_street_2'
      },
      act2_street_2: {
        bg: 'wisteria_fog',
        chars: [{ id: 'lucas', emo: 'calm', pos: 'center', active: true }],
        speaker: 'lucas',
        en: 'No cars, no mailman, no kids playing. Just me, Clara, and suddenly you in a house that wasn\'t here at breakfast. Tell me honestly, {name}—do you remember how you got to Wisteria Lane?',
        ru: 'Ни машин, ни почтальона, ни детей. Только я, Клара — и вдруг ты в доме, которого не было за завтраком. Скажи честно, {name} — ты вообще помнишь, как попал(а) на Вистерия Лейн?',
        next: 'act2_lucas_choice'
      },
      act2_lucas_choice: {
        type: 'choice',
        bg: 'wisteria_fog',
        chars: [{ id: 'lucas', emo: 'calm', pos: 'center', active: true }],
        promptRu: 'Лукас явно хочет понять, можно ли тебе доверять. Расскажешь ему про дневник?',
        options: [
          {
            en: 'Show him the leather journal. ("I woke up with this—and a warning written in my own hand.")',
            ru: 'Показать ему кожаный дневник. («Я очнулся(лась) с этим — и с предупреждением моим почерком».)',
            rel: { lucas: 2 },
            stat: { intuition: 1 },
            setFlag: { showedLucasJournal: true },
            toast: '+1 Интуиция · Лукас доверяет тебе больше',
            goto: 'act2_lucas_show'
          },
          {
            en: 'Keep the journal hidden for now. ("All I know is my phone is dead and the street is locked.")',
            ru: 'Пока не говорить про дневник. («Знаю только, что телефон мёртв, а улица отрезана».)',
            stat: { composure: 1 },
            setFlag: { showedLucasJournal: false },
            toast: '+1 Хладнокровие · Ты не раскрываешь все карты сразу',
            goto: 'act2_lucas_hide'
          }
        ]
      },
      act2_lucas_show: {
        bg: 'wisteria_fog',
        chars: [{ id: 'lucas', emo: 'serious', pos: 'center', active: true }],
        speaker: 'lucas',
        en: '"Do not trust the first smile you see." Well, Clara definitely smiled first. Thanks for trusting me, {name}. Whatever this is, we are not going to let anyone lie to us.',
        ru: '«Не доверяй первой улыбке, которую увидишь». Что ж, Клара точно улыбнулась первой. Спасибо за доверие, {name}. Что бы это ни было, мы не дадим водить себя за нос.',
        next: 'act2_engine_sound'
      },
      act2_lucas_hide: {
        bg: 'wisteria_fog',
        chars: [{ id: 'lucas', emo: 'calm', pos: 'center', active: true }],
        speaker: 'lucas',
        en: 'Fair enough—I wouldn\'t trust a stranger on a weird morning either. Still, two pairs of eyes are better than one.',
        ru: 'Справедливо — я бы тоже не стал доверять незнакомцу в такое странное утро. И всё же две пары глаз лучше одной.',
        next: 'act2_engine_sound'
      },
      act2_engine_sound: {
        bg: 'wisteria_fog',
        chars: [{ id: 'lucas', emo: 'serious', pos: 'center', active: true }],
        sfx: 'heartbeat',
        speaker: 'Рассказчик',
        speakerStyle: 'narrator',
        en: 'From the far end of Wisteria Lane comes the deep rumble of a classic V8 engine—followed by a sharp, steady electronic beep. Lucas nods toward the mist.',
        ru: 'С дальнего конца Вистерия Лейн доносится низкий рокот классического мотора V8 — а за ним резкий, частый электронный писк. Лукас кивает в сторону тумана.',
        next: 'act2_engine_2'
      },
      act2_engine_2: {
        bg: 'wisteria_fog',
        chars: [{ id: 'lucas', emo: 'serious', pos: 'center', active: true }],
        speaker: 'lucas',
        en: 'Hear that? Someone just drove straight through the fog. Let\'s go see who it is before they vanish.',
        ru: 'Слышишь? Кто-то только что проехал прямо сквозь туман. Пошли посмотрим, кто это, пока не исчез.',
        next: 'act3_1'
      },

      // ==================== АКТ 3: ОХОТНИК НА ГРАНИЦЕ ТУМАНА ====================
      act3_1: {
        bg: 'wisteria_fog',
        chapterTag: 'АКТ III // ГРАНИЦА ТУМАНА',
        chars: [{ id: 'sam', emo: 'serious', pos: 'center', active: true }],
        speaker: 'Рассказчик',
        speakerStyle: 'narrator',
        en: 'Where Wisteria Lane should meet the main highway, the suburban asphalt stops dead against wet, old cobblestones. Parked crookedly by the curb is a glossy black 1967 Impala, its headlights cutting into the mist.',
        ru: 'Там, где Вистерия Лейн должна выходить на шоссе, пригородный асфальт резко обрывается о мокрую старую брусчатку. У обочины наискосок стоит блестящая чёрная Impala 1967 года, рассекая фарами туман.',
        next: 'act3_2'
      },
      act3_2: {
        bg: 'wisteria_fog',
        chars: [{ id: 'sam', emo: 'serious', pos: 'center', active: true }],
        sfx: 'static',
        speaker: 'Рассказчик',
        speakerStyle: 'narrator',
        en: 'A tall man in a dark green field jacket stands beside the open driver\'s door, sweeping a small brass meter along the stone border. Every few seconds the device crackles loudly.',
        ru: 'Высокий мужчина в тёмно-зелёной куртке стоит у открытой водительской двери и водит небольшим латунным прибором вдоль каменной границы. Каждые пару секунд прибор громко трещит.',
        next: 'act3_3'
      },
      act3_3: {
        bg: 'wisteria_fog',
        chars: [
          { id: 'sam', emo: 'serious', pos: 'left', active: false },
          { id: 'lucas', emo: 'serious', pos: 'right', active: true }
        ],
        speaker: 'lucas',
        en: 'Hold it right there! Who are you—government? Military? And what is that buzzing box in your hand?',
        ru: 'Стоять на месте! Кто ты — правительство? Военные? И что это за пищащая коробка у тебя в руках?',
        next: 'act3_4'
      },
      act3_4: {
        bg: 'wisteria_fog',
        chars: [
          { id: 'sam', emo: 'calm', pos: 'left', active: true },
          { id: 'lucas', emo: 'serious', pos: 'right', active: false }
        ],
        speaker: 'sam',
        en: 'Easy, pal. I am not with the government—trust me, they are way too slow for stuff like this. Name is Sam Winchester. And this is an EMF meter.',
        ru: 'Полегче, приятель. Я не из правительства — поверь, для таких дел они слишком медлительны. Меня зовут Сэм Винчестер. А это детектор ЭМП.',
        next: 'act3_5'
      },
      act3_5: {
        bg: 'wisteria_fog',
        chars: [
          { id: 'sam', emo: 'calm', pos: 'left', active: true },
          { id: 'lucas', emo: 'calm', pos: 'right', active: false }
        ],
        speaker: 'sam',
        en: 'Ten minutes ago I was driving down an empty highway. My GPS went dead, the engine stalled, and when the fog cleared—there were white picket fences on my left and a brick town square on my right.',
        ru: 'Десять минут назад я ехал по пустому шоссе. Навигатор сдох, мотор заглох, а когда туман чуть разошёлся — слева оказались белые заборы, а справа кирпичная городская площадь.',
        next: 'act3_6'
      },
      act3_6: {
        bg: 'wisteria_fog',
        chars: [
          { id: 'sam', emo: 'serious', pos: 'left', active: true },
          { id: 'lucas', emo: 'calm', pos: 'right', active: false }
        ],
        sfx: 'static',
        speaker: 'sam',
        en: 'Wait a second... Stop moving. The needle isn\'t pointing at the fog anymore. It is pointing straight at you, {name}—specifically at whatever you are carrying.',
        ru: 'Секунду... Не двигайся. Стрелка больше не показывает на туман. Она указывает прямо на тебя, {name} — точнее, на то, что у тебя при себе.',
        next: 'act3_7'
      },
      act3_7: {
        bg: 'wisteria_fog',
        chars: [
          { id: 'sam', emo: 'serious', pos: 'left', active: true },
          { id: 'lucas', emo: 'serious', pos: 'right', active: true }
        ],
        speaker: 'sam',
        en: 'That leather journal... it is radiating residual spell energy. Not a demon, not a ghost—something old and stitched together by magic.',
        ru: 'Этот кожаный дневник... от него фонит остаточной энергией заклятия. Не демон, не призрак — что-то древнее и сшитое магией.',
        next: 'act3_8'
      },
      act3_8: {
        bg: 'wisteria_fog',
        chars: [
          { id: 'sam', emo: 'serious', pos: 'left', active: true },
          { id: 'lucas', emo: 'serious', pos: 'right', active: true }
        ],
        sfx: 'crack',
        fx: 'glitch',
        speaker: 'Рассказчик',
        speakerStyle: 'narrator',
        en: 'CRACK! Before you can answer, a shockwave of violet magic rips out of the mist! Streetlamps overhead burst into blinding sparks, glass rains down toward Lucas—and a glowing scrap of parchment whips past your face!',
        ru: 'ТРЕСК! Не успеваешь ты ответить, как из тумана вырывается ударная волна фиолетовой магии! Фонари над головой взрываются ослепительными искрами, осколки сыпятся прямо на Лукаса — а мимо твоего лица проносится светящийся обрывок пергамента!',
        next: 'act3_timed_choice'
      },
      act3_timed_choice: {
        type: 'choice',
        timed: 15,
        defaultOption: 2,
        bg: 'wisteria_fog',
        chars: [
          { id: 'sam', emo: 'serious', pos: 'left', active: true },
          { id: 'lucas', emo: 'serious', pos: 'right', active: true }
        ],
        promptRu: 'ВЫБОР НА ВРЕМЯ (15 СЕК)! Вспышка магии разносит фонари — как ты действуешь?',
        options: [
          {
            en: 'Shield the journal and pull Lucas behind the Impala\'s hood!',
            ru: 'Прикрыть дневник и оттолкнуть Лукаса за капот Импалы!',
            stat: { intuition: 1 },
            rel: { sam: 2, lucas: 1 },
            setFlag: { shieldedJournal: true },
            toast: '+1 Интуиция · Сэм и Лукас оценили твою реакцию',
            goto: 'act3_res_shield'
          },
          {
            en: '"Sam, spike on the left! Everyone take cover behind the car!"',
            ru: '«Сэм, всплеск слева! Всем укрыться за машиной!»',
            stat: { composure: 1 },
            rel: { sam: 1 },
            setFlag: { calledCover: true },
            toast: '+1 Хладнокровие · Чёткая команда в критический момент',
            goto: 'act3_res_cover'
          },
          {
            en: 'Lunge into the sparks and catch the glowing parchment scrap mid-air!',
            ru: 'Броситься в сноп искр и поймать светящийся обрывок пергамента на лету!',
            stat: { audacity: 2 },
            setFlag: { grabbedScrap: true },
            toast: '+2 Дерзость · Получена улика: Обгоревший обрывок с печатью',
            goto: 'act3_res_scrap'
          }
        ]
      },
      act3_res_shield: {
        bg: 'wisteria_fog',
        chars: [
          { id: 'sam', emo: 'calm', pos: 'left', active: true },
          { id: 'lucas', emo: 'calm', pos: 'right', active: false }
        ],
        speaker: 'sam',
        en: 'Good instincts, {name}. You kept your head cool and pulled your neighbor out of the glass. Most people freeze the first time they see real magic.',
        ru: 'Хорошие инстинкты, {name}. Ты сохранил(а) холодную голову и вытащил(а) соседа из-под осколков. Большинство людей столбенеют, когда впервые видят настоящую магию.',
        next: 'act3_after_surge'
      },
      act3_res_cover: {
        bg: 'wisteria_fog',
        chars: [
          { id: 'sam', emo: 'calm', pos: 'left', active: true },
          { id: 'lucas', emo: 'serious', pos: 'right', active: false }
        ],
        speaker: 'sam',
        en: 'Smart call—not a scratch on anyone, and not a scratch on my car. You sound like someone who knows how to back me up when things get ugly.',
        ru: 'Умное решение — ни на ком ни царапины, и на моей машине тоже. Звучишь так, будто умеешь прикрыть спину, когда всё идёт наперекосяк.',
        next: 'act3_after_surge'
      },
      act3_res_scrap: {
        bg: 'wisteria_fog',
        fx: 'flash',
        chars: [
          { id: 'sam', emo: 'serious', pos: 'left', active: true },
          { id: 'lucas', emo: 'serious', pos: 'right', active: false }
        ],
        speaker: 'sam',
        en: 'Are you crazy?! You almost burned your hand off—wait, let me see that scrap. There is a golden seal of a Clock Tower burned right into the edge. Reckless... but brilliant.',
        ru: 'Ты с ума сошёл(ла)?! Чуть руку не обжёг(ла) — погоди, дай взглянуть на обрывок. На самом краю выжжена золотая печать Часовой башни. Безрассудно... но гениально.',
        next: 'act3_after_surge'
      },
      act3_after_surge: {
        bg: 'wisteria_fog',
        chars: [
          { id: 'sam', emo: 'serious', pos: 'left', active: false },
          { id: 'lucas', emo: 'serious', pos: 'right', active: true }
        ],
        speaker: 'lucas',
        en: 'Okay, hold everything. Did you both just casually say "magic" like it\'s Tuesday?! Because ten minutes ago I was drinking coffee and arguing about hedges!',
        ru: 'Так, стоп. Вы оба только что спокойно сказали «магия», будто это обычный вторник?! Десять минут назад я пил кофе и спорил про кусты!',
        next: 'act3_after_surge_2'
      },
      act3_after_surge_2: {
        bg: 'wisteria_fog',
        chars: [
          { id: 'sam', emo: 'calm', pos: 'left', active: true },
          { id: 'lucas', emo: 'serious', pos: 'right', active: false }
        ],
        speaker: 'sam',
        en: 'Take a deep breath, Lucas. Look up through the fog. That giant Clock Tower is the center of the energy spike. If we want to figure out who trapped us here, that is where we start.',
        ru: 'Глубокий вдох, Лукас. Посмотри вверх сквозь туман. Та огромная Часовая башня — центр энергетического всплеска. Если хотим понять, кто запер нас здесь, начинать надо оттуда.',
        next: 'act3_walk_choice'
      },
      act3_walk_choice: {
        type: 'choice',
        bg: 'clock_tower',
        chars: [
          { id: 'sam', emo: 'calm', pos: 'left', active: true },
          { id: 'lucas', emo: 'calm', pos: 'right', active: true }
        ],
        promptRu: 'Вы идёте по пустой брусчатке к площади Часовой башни. С кем пойдёшь рядом и поговоришь?',
        options: [
          {
            en: 'Walk beside Sam. ("You said you walked away from this life. What happened?")',
            ru: 'Идти рядом с Сэмом. («Ты сказал, что ушёл от этой жизни. Что случилось?»)',
            rel: { sam: 2 },
            setFlag: { companionWalk: 'sam' },
            toast: 'Отношения с Сэмом заметно улучшились',
            goto: 'act3_walk_sam'
          },
          {
            en: 'Walk beside Lucas. ("You were watching Clara before today. What did you see?")',
            ru: 'Идти рядом с Лукасом. («Ты следил за Кларой и раньше. Что ты видел?»)',
            rel: { lucas: 2 },
            setFlag: { companionWalk: 'lucas' },
            toast: 'Отношения с Лукасом заметно улучшились',
            goto: 'act3_walk_lucas'
          }
        ]
      },
      act3_walk_sam: {
        bg: 'clock_tower',
        chars: [{ id: 'sam', emo: 'calm', pos: 'center', active: true }],
        speaker: 'sam',
        en: 'My brother Dean and I spent our whole lives hunting things people think are just bedtime stories. Ghosts, demons, witches—you name it.',
        ru: 'Мы с братом Дином всю жизнь охотились на то, что люди считают просто страшилками. Призраки, демоны, ведьмы — всё подряд.',
        next: 'act3_walk_sam_2'
      },
      act3_walk_sam_2: {
        bg: 'clock_tower',
        chars: [{ id: 'sam', emo: 'calm', pos: 'center', active: true }],
        speaker: 'sam',
        en: 'After I lost him, I parked the Impala and tried to live like a normal guy. I don\'t want another war, {name}. I just want to keep people safe—including you.',
        ru: 'После того как я его потерял, я поставил Импалу в гараж и попытался жить как обычный человек. Я не хочу новой войны, {name}. Я просто хочу уберечь людей — и тебя тоже.',
        next: 'act3_walk_sam_3'
      },
      act3_walk_sam_3: {
        bg: 'clock_tower',
        chars: [{ id: 'sam', emo: 'calm', pos: 'center', active: true }],
        speaker: 'sam',
        en: 'Whatever is hidden in that journal, you don\'t have to face it alone. Stick close when we reach the square.',
        ru: 'Что бы ни скрывалось в этом дневнике, тебе не придётся разбираться с этим в одиночку. Держись рядом, когда выйдем на площадь.',
        next: 'act4_1'
      },
      act3_walk_lucas: {
        bg: 'clock_tower',
        chars: [{ id: 'lucas', emo: 'serious', pos: 'center', active: true }],
        speaker: 'lucas',
        en: 'Keep your voice down. Two weeks ago I couldn\'t sleep, looked out my bedroom window at 2 AM, and saw Clara in her backyard with a flashlight and a garden shovel.',
        ru: 'Говори потише. Две недели назад мне не спалось, я выглянул из окна спальни в два часа ночи и увидел Клару на заднем дворе с фонариком и садовой лопаткой.',
        next: 'act3_walk_lucas_2'
      },
      act3_walk_lucas_2: {
        bg: 'clock_tower',
        chars: [{ id: 'lucas', emo: 'serious', pos: 'center', active: true }],
        speaker: 'lucas',
        en: 'She buried a small silver box right under her white roses. I wrote it down in my notebook, thinking it was just weird suburban drama. Now? I think she knew this fog was coming.',
        ru: 'Она закопала небольшую серебряную шкатулку прямо под белыми розами. Я записал это в блокнот, подумав, что это просто странная пригородная драма. А теперь? Думаю, она знала, что этот туман придёт.',
        next: 'act3_walk_lucas_3'
      },
      act3_walk_lucas_3: {
        bg: 'clock_tower',
        chars: [{ id: 'lucas', emo: 'calm', pos: 'center', active: true }],
        speaker: 'lucas',
        en: 'Every perfect street hides a dirty story, {name}. Stick with me, and we will dig up the truth before midnight.',
        ru: 'Каждая идеальная улица прячет грязную историю, {name}. Держись со мной, и мы докопаемся до правды до полуночи.',
        next: 'act4_1'
      },

      // ==================== АКТ 4: ПЛОЩАДЬ И КАБИНЕТ РЕДЖИНЫ ====================
      act4_1: {
        bg: 'clock_tower',
        chapterTag: 'АКТ IV // ПЛОЩАДЬ ЧАСОВОЙ БАШНИ',
        chars: [{ id: 'regina', emo: 'serious', pos: 'center', active: true }],
        speaker: 'Рассказчик',
        speakerStyle: 'narrator',
        en: 'The mist opens onto a quiet brick square lit by warm vintage lamps. Above it looms the Clock Tower, frozen at 11:59. Across the square, the tall wooden doors of Town Hall swing open—and a striking woman in a tailored black coat descends the stairs.',
        ru: 'Туман расступается перед тихой кирпичной площадью с тёплыми старинными фонарями. Над ней возвышается Часовая башня, застывшая на 11:59. Напротив распахиваются высокие двери ратуши — и по ступеням спускается статная женщина в строгом чёрном пальто.',
        next: 'act4_2'
      },
      act4_2: {
        bg: 'clock_tower',
        chars: [
          { id: 'sam', emo: 'serious', pos: 'left', active: true },
          { id: 'regina', emo: 'calm', pos: 'right', active: false }
        ],
        sfx: 'static',
        speaker: 'sam',
        en: 'Stop! {name}, stay behind me. My EMF meter is screaming—she is carrying enough magical power to level a whole block.',
        ru: 'Стоп! {name}, встань за меня. Датчик ЭМП просто разрывается — в ней столько магической силы, что хватит снести целый квартал.',
        next: 'act4_3'
      },
      act4_3: {
        bg: 'clock_tower',
        chars: [
          { id: 'sam', emo: 'serious', pos: 'left', active: false },
          { id: 'regina', emo: 'calm', pos: 'right', active: true }
        ],
        speaker: 'regina',
        en: 'Put your noisy little toy away, hunter. If I wanted to turn the three of you into dust, I wouldn\'t have bothered walking down the stairs. I am Regina Mills—Queen of the United Realms.',
        ru: 'Убери свою шумную игрушку, охотник. Если бы я хотела стереть вас троих в порошок, я бы не стала спускаться по лестнице. Я Реджина Миллс — Королева Объединённых Королевств.',
        next: 'act4_4'
      },
      act4_4: {
        bg: 'clock_tower',
        chars: [
          { id: 'lucas', emo: 'serious', pos: 'left', active: true },
          { id: 'regina', emo: 'calm', pos: 'right', active: false }
        ],
        speaker: 'lucas',
        en: '"Queen of the United Realms"? Great. Either I hit my head this morning, or Wisteria Lane just got annexed by a fairy tale.',
        ru: '«Королева Объединённых Королевств»? Чудесно. Либо я ударился головой этим утром, либо Вистерия Лейн только что захватила сказка.',
        next: 'act4_5'
      },
      act4_5: {
        bg: 'clock_tower',
        chars: [{ id: 'regina', emo: 'serious', pos: 'center', active: true }],
        speaker: 'regina',
        en: 'Save the sarcasm, reporter. Wait... what is that tucked under your arm, {name}? A leather journal with gold lettering? Come upstairs to my office—right now, before the street listens in.',
        ru: 'Прибереги сарказм, репортёр. Постой... что это у тебя под мышкой, {name}? Кожаный дневник с золотым тиснением? Поднимайтесь в мой кабинет — немедленно, пока улица не подслушала.',
        next: 'act4_office_1'
      },
      act4_office_1: {
        bg: 'regina_office',
        chapterTag: 'АКТ IV // КАБИНЕТ РЕДЖИНЫ',
        chars: [{ id: 'regina', emo: 'calm', pos: 'center', active: true }],
        speaker: 'Рассказчик',
        speakerStyle: 'narrator',
        en: 'Inside her dark mahogany study, tall gothic windows frame the glowing Clock Tower outside. Regina unrolls a glowing parchment map across her desk—its golden borders trembling like live wires.',
        ru: 'В её кабинете из тёмного красного дерева за высокими готическими окнами светится Часовая башня. Реджина разворачивает на столе светящуюся пергаментную карту — золотые границы на ней дрожат, точно оголённые провода.',
        next: 'act4_office_2'
      },
      act4_office_2: {
        bg: 'regina_office',
        chars: [{ id: 'regina', emo: 'serious', pos: 'center', active: true }],
        speaker: 'regina',
        en: 'I will not waste time lying to you. Not long ago, I cast a light curse to unite the fairy-tale realms in peace. Mr. Gold gave his life to end the old darkness—we finally earned a quiet ending.',
        ru: 'Не стану тратить время на ложь. Не так давно я наложила светлое заклятие, чтобы объединить сказочные миры. Мистер Голд отдал жизнь, чтобы покончить со старой тьмой — мы наконец заслужили спокойный финал.',
        next: 'act4_office_3'
      },
      act4_office_3: {
        bg: 'regina_office',
        chars: [{ id: 'regina', emo: 'serious', pos: 'center', active: true }],
        speaker: 'regina',
        en: 'Someone secretly broke into my spell using a stolen Blank Page. Now this town is a seam between completely different worlds. Every time the fog shifts, it pulls in another street—and traps everyone inside.',
        ru: 'Кто-то тайно взломал моё заклинание с помощью украденной Чистой Страницы. Теперь этот город — шов между совершенно разными мирами. Каждый раз, когда туман сдвигается, он втягивает ещё одну улицу — и запирает всех внутри.',
        next: 'act4_office_4'
      },
      act4_office_4: {
        bg: 'regina_office',
        chars: [
          { id: 'regina', emo: 'calm', pos: 'left', active: false },
          { id: 'sam', emo: 'serious', pos: 'right', active: true }
        ],
        speaker: 'sam',
        en: 'And the clocks freezing at 11:59? That is a countdown. Whatever happens when those hands hit twelve, nobody in this town is going to like it.',
        ru: 'А часы, замершие на 11:59? Это обратный отсчёт. Что бы ни случилось, когда стрелки дойдут до двенадцати, никому в этом городе это не понравится.',
        next: 'act4_scrap_check'
      },
      act4_scrap_check: {
        bg: 'regina_office',
        chars: [{ id: 'regina', emo: 'calm', pos: 'center', active: true }],
        speaker: 'regina',
        en: 'Exactly. And your journal, {name}, is the anchor holding the missing page\'s memory. Whoever tore that first sheet out is already hiding inside our perimeter.',
        ru: 'Именно. А твой дневник, {name}, — якорь, хранящий память о пропавшей странице. Тот, кто вырвал первый лист, уже прячется внутри нашего периметра.',
        branchFlag: 'grabbedScrap',
        ifTrue: 'act4_scrap_bonus',
        ifFalse: 'act4_question_choice'
      },
      act4_scrap_bonus: {
        bg: 'regina_office',
        chars: [{ id: 'regina', emo: 'serious', pos: 'center', active: true }],
        sfx: 'reveal',
        relGain: { regina: 1 },
        toast: 'Улика сработала! +1 Реджина · Печать хранилища башни подтверждена',
        speaker: 'regina',
        en: 'Hold on—that burned scrap you caught in the street! That is the seal of the Clock Tower vault! Whoever stole the page used my own tower to lock the fog in place!',
        ru: 'Постой — тот обгоревший обрывок, который ты поймал(а) на улице! Это печать хранилища Часовой башни! Тот, кто украл страницу, использовал мою собственную башню, чтобы запереть туман!',
        next: 'act4_question_choice'
      },
      act4_question_choice: {
        type: 'choice',
        bg: 'regina_office',
        chars: [{ id: 'regina', emo: 'calm', pos: 'center', active: true }],
        promptRu: 'У тебя есть шанс задать Реджине один прямой вопрос, прежде чем решать, что делать дальше:',
        options: [
          {
            en: '"Why is MY name on the journal? Why did the street pull me here?"',
            ru: '«Почему на дневнике МОЁ имя? Зачем этот город затянул сюда именно меня?»',
            stat: { intuition: 1 },
            toast: '+1 Интуиция',
            goto: 'act4_q_whyme'
          },
          {
            en: '"If we find the missing page, can you actually send everyone home?"',
            ru: '«Если мы найдём пропавшую страницу, ты точно сможешь вернуть всех домой?»',
            stat: { composure: 1 },
            rel: { regina: 1 },
            toast: '+1 Хладнокровие · Реджина оценила деловой подход',
            goto: 'act4_q_home'
          },
          {
            en: '"How do we know YOU aren\'t the one who broke the spell?"',
            ru: '«Откуда нам знать, что заклятие сломала не ты сама?»',
            stat: { audacity: 1 },
            rel: { regina: -1, lucas: 1 },
            toast: '+1 Дерзость · Реджина прищурилась · Лукас усмехнулся',
            goto: 'act4_q_accuse'
          }
        ]
      },
      act4_q_whyme: {
        bg: 'regina_office',
        chars: [{ id: 'regina', emo: 'serious', pos: 'center', active: true }],
        speaker: 'regina',
        en: 'That is the one part the map refuses to answer. The spell didn\'t just catch you by accident, {name}—someone wrote you into the center of it.',
        ru: 'Это единственное, на что карта отказывается отвечать. Заклятие не просто зацепило тебя случайно, {name} — кто-то намеренно вписал тебя в самый центр.',
        next: 'act4_ritual_offer'
      },
      act4_q_home: {
        bg: 'regina_office',
        chars: [{ id: 'regina', emo: 'calm', pos: 'center', active: true }],
        speaker: 'regina',
        en: 'Bring me that page before twelve, and I will tear this stitch apart myself. Every street goes back where it belongs—you have my word.',
        ru: 'Принеси мне эту страницу до двенадцати, и я сама разорву этот шов. Каждая улица вернётся туда, где ей место — даю слово.',
        next: 'act4_ritual_offer'
      },
      act4_q_accuse: {
        bg: 'regina_office',
        chars: [{ id: 'regina', emo: 'serious', pos: 'center', active: true }],
        speaker: 'regina',
        en: 'Bold words for someone standing in my office. Believe me, {name}—if I still wanted to curse a town, my magic wouldn\'t be misfiring in my own hands.',
        ru: 'Смелые слова для человека, стоящего в моём кабинете. Поверь, {name} — если бы я всё ещё хотела проклясть город, моя магия не давала бы осечку в моих же руках.',
        next: 'act4_ritual_offer'
      },
      act4_ritual_offer: {
        bg: 'regina_office',
        chars: [
          { id: 'regina', emo: 'calm', pos: 'left', active: true },
          { id: 'sam', emo: 'serious', pos: 'right', active: false }
        ],
        speaker: 'regina',
        en: 'We are losing precious minutes. Let me cast a tracing spell on your journal right now—I can pull an echo of the thief\'s face and voice straight out of the ink.',
        ru: 'Мы теряем драгоценные минуты. Позволь мне наложить поисковое заклинание на твой дневник прямо сейчас — я смогу вытянуть отголосок лица и голоса похитителя прямо из чернил.',
        next: 'act4_sam_warn'
      },
      act4_sam_warn: {
        bg: 'regina_office',
        chars: [
          { id: 'regina', emo: 'serious', pos: 'left', active: false },
          { id: 'sam', emo: 'serious', pos: 'right', active: true }
        ],
        sfx: 'heartbeat',
        speaker: 'sam',
        en: 'Wait, {name}. Her magic already failed once tonight. If she lights up that book with a big spell, it could act like a flare—and tell whoever is pulling the strings exactly where we are.',
        ru: 'Погоди, {name}. Её магия сегодня уже дала сбой. Если она зажжёт эту книгу сильным заклинанием, это может сработать как сигнальная ракета — и выдать тому, кто дёргает за ниточки, где именно мы находимся.',
        next: 'act4_key_choice'
      },
      act4_key_choice: {
        type: 'choice',
        bg: 'regina_office',
        chars: [
          { id: 'regina', emo: 'serious', pos: 'left', active: true },
          { id: 'sam', emo: 'serious', pos: 'right', active: true }
        ],
        promptRu: 'КЛЮЧЕВОЙ ВЫБОР ЭПИЗОДА 1: Доверишься магии Реджины или послушаешь Сэма?',
        options: [
          {
            en: 'Trust Regina. ("Do the spell. We cannot afford to walk in blind.")',
            ru: 'Довериться Реджине. («Проводи ритуал. Мы не можем идти вслепую».)',
            stat: { intuition: 2 },
            rel: { regina: 2, sam: -1 },
            setFlag: { trustedRegina: true },
            toast: 'Ты доверился(лась) Реджине · +2 Интуиция',
            goto: 'act4_ritual_yes'
          },
          {
            en: 'Side with Sam. ("No magic beacons. We will investigate the smart way.")',
            ru: 'Поддержать Сэма. («Никаких магических маяков. Проведём расследование с умом».)',
            stat: { composure: 1, audacity: 1 },
            rel: { sam: 2, lucas: 1, regina: -1 },
            setFlag: { trustedRegina: false },
            toast: 'Скрытность сохранена · +1 Хладнокровие, +1 Дерзость',
            goto: 'act4_ritual_no'
          }
        ]
      },
      act4_ritual_yes: {
        bg: 'regina_office',
        chars: [{ id: 'regina', emo: 'serious', pos: 'center', active: true }],
        sfx: 'reveal',
        fx: 'flash',
        speaker: 'Рассказчик',
        speakerStyle: 'narrator',
        en: 'Regina sweeps her hand over the open journal. Gold-violet smoke curls upward—and for two heartbeats, a sharp vision flashes behind your eyes:',
        ru: 'Реджина проводит рукой над раскрытым дневником. Вверх взвивается золотисто-фиолетовый дым — и на два удара сердца перед глазами вспыхивает чёткое видение:',
        next: 'act4_ritual_yes_2'
      },
      act4_ritual_yes_2: {
        bg: 'regina_office',
        chars: [{ id: 'regina', emo: 'serious', pos: 'center', active: true }],
        speaker: 'Видение из дневника',
        speakerStyle: 'note',
        en: 'A grand Southern mansion wrapped in mist... a mocking laugh with a crisp British accent... and a sudden flare of white-hot witch fire blazing in a dark alley.',
        ru: 'Старинный южный особняк, окутанный туманом... насмешливый смех с чётким британским акцентом... и внезапная вспышка ослепительного ведьмовского огня в тёмном переулке.',
        next: 'act4_ritual_yes_3'
      },
      act4_ritual_yes_3: {
        bg: 'regina_office',
        chars: [
          { id: 'regina', emo: 'serious', pos: 'left', active: true },
          { id: 'sam', emo: 'serious', pos: 'right', active: false }
        ],
        speaker: 'regina',
        en: 'A powerful witch and something far older... They are entering the city right now! Hurry—listen to the Clock Tower!',
        ru: 'Могущественная ведьма и кто-то куда более древний... Они входят в город прямо сейчас! Скорее — слышите Часовую башню?!',
        next: 'act5_1'
      },
      act4_ritual_no: {
        bg: 'regina_office',
        chars: [
          { id: 'regina', emo: 'serious', pos: 'left', active: true },
          { id: 'sam', emo: 'calm', pos: 'right', active: false }
        ],
        speaker: 'regina',
        en: 'Fine. Keep your secrets and walk in blind if you wish. Just don\'t blame me when the next piece of a broken world lands on your doorstep. Wait... do you hear that?!',
        ru: 'Ладно. Храните свои секреты и идите вслепую, если так хотите. Только не вините меня, когда следующий осколок чужого мира упадёт прямо к вашему порогу. Погодите... слышите это?!',
        next: 'act5_1'
      },

      // ==================== АКТ 5: ФИНАЛ ЭПИЗОДА — 11:59:30 ====================
      act5_1: {
        bg: 'clock_tower',
        chapterTag: 'ФИНАЛ ЭПИЗОДА 1 // 11:59:30',
        cg: 'clock_1159',
        sfx: 'chime',
        fx: 'shake',
        speaker: 'Рассказчик',
        speakerStyle: 'narrator',
        en: 'BOOM! A thunderous bell shakes every window on the square. You rush outside with Sam, Lucas, and Regina just as the giant iron minute hand shudders forward half a notch: 11:59:30.',
        ru: 'БУМ! Громовой удар колокола сотрясает все окна на площади. Вы выбегаете наружу вместе с Сэмом, Лукасом и Реджиной ровно в тот миг, когда гигантская железная стрелка со скрежетом прыгает на полделения вперёд: 11:59:30.',
        next: 'act5_2'
      },
      act5_2: {
        bg: 'clock_tower',
        chars: [
          { id: 'sam', emo: 'serious', pos: 'left', active: false },
          { id: 'lucas', emo: 'serious', pos: 'right', active: true }
        ],
        fx: 'glitch',
        speaker: 'lucas',
        en: 'Look east! The fog is splitting right down the middle! Where did that whole brick street come from?! The neon sign says... "Mystic Grill"?',
        ru: 'Смотрите на восток! Туман расходится прямо пополам! Откуда взялась целая кирпичная улица?! На неоновой вывеске написано... «Mystic Grill»?',
        next: 'act5_3'
      },
      act5_3: {
        bg: 'clock_tower',
        cg: 'journal_note',
        sfx: 'reveal',
        speaker: 'Рассказчик',
        speakerStyle: 'narrator',
        en: 'An icy gust sweeps across the cobblestones and drops a single crimson envelope sealed in dark red wax right at your boots. Inside are two lines written in sharp ink:',
        ru: 'Ледяной порыв ветра проносится по брусчатке и бросает прямо к твоим ботинкам один-единственный багровый конверт с тёмно-красной сургучной печатью. Внутри — две строчки чёткими чернилами:',
        next: 'act5_4'
      },
      act5_4: {
        bg: 'clock_tower',
        cg: 'journal_note',
        speaker: 'Письмо в багровом конверте',
        speakerStyle: 'note',
        en: '"Act One is over, {name}. Ask Clara what is buried under her roses... and watch out for the guests from Mystic Falls."',
        ru: '«Первый акт окончен, {name}. Спроси Клару, что закопано под её розами... и остерегайся гостей из Мистик Фоллс».',
        next: 'act5_5'
      },
      act5_5: {
        bg: 'clock_tower',
        chars: [
          { id: 'regina', emo: 'serious', pos: 'left', active: false },
          { id: 'sam', emo: 'serious', pos: 'right', active: false }
        ],
        speaker: 'Закадровый голос',
        speakerStyle: 'narrator',
        en: 'High on the balcony of a newly appeared mansion on the hill, two silhouettes look out over the misty square—a man with a dangerous smirk and a blonde woman staring at a phone with no signal.',
        ru: 'Высоко на балконе внезапно появившегося на холме особняка два силуэта смотрят на туманную площадь — мужчина с опасной ухмылкой и блондинка, растерянно глядящая в телефон без сети.',
        next: 'act5_6'
      },
      act5_6: {
        bg: 'clock_tower',
        sfx: 'heartbeat',
        speaker: 'Закадровый голос',
        speakerStyle: 'narrator',
        en: 'Down in a shadowed alley, a single candle flares white-hot with raw witch fire—then snaps out into the dark. Only thirty seconds remain until midnight.',
        ru: 'А внизу, в тёмном переулке, одинокая свеча вспыхивает ослепительным ведьмовским огнём — и мгновенно гаснет в темноте. До полуночи остаётся всего тридцать секунд.',
        next: 'episode_end'
      },
      episode_end: {
        type: 'ending',
        bg: 'clock_tower'
      }
    }
  };

  const EPISODES = { ep1: EPISODE_1 };

  // ==================== 3. WEB AUDIO SFX ====================
  let vnAudioCtx = null;
  let vnSfxOn = true;
  let vnBgmOn = true;
  let vnBgmAudio = null;
  let vnAutoRu = false;

  function startVnBgm() {
    if (!vnBgmOn) return;
    try {
      if (!vnBgmAudio) {
        vnBgmAudio = new Audio('novel/bgm-main.mp3');
        vnBgmAudio.loop = true;
        vnBgmAudio.volume = 0.28;
      }
      const p = vnBgmAudio.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (e) {}
  }

  function stopVnBgm() {
    if (vnBgmAudio) {
      try { vnBgmAudio.pause(); } catch (e) {}
    }
  }
  let vnTypeTimer = null;
  let vnChoiceTimer = null;
  let vnChoiceDeadline = 0;

  function ensureAudioCtx() {
    if (!vnAudioCtx) vnAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (vnAudioCtx.state === 'suspended') vnAudioCtx.resume();
    return vnAudioCtx;
  }

  function playVnSfx(kind) {
    if (!vnSfxOn || !kind) return;
    try {
      const ctx = ensureAudioCtx();
      const now = ctx.currentTime;
      if (kind === 'tick') {
        for (let k = 0; k < 2; k++) {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(k === 0 ? 950 : 740, now + k * 0.42);
          osc.frequency.exponentialRampToValueAtTime(160, now + k * 0.42 + 0.04);
          g.gain.setValueAtTime(0.11, now + k * 0.42);
          g.gain.exponentialRampToValueAtTime(0.001, now + k * 0.42 + 0.06);
          osc.connect(g); g.connect(ctx.destination);
          osc.start(now + k * 0.42); osc.stop(now + k * 0.42 + 0.07);
        }
      } else if (kind === 'chime') {
        [146.83, 220, 293.66].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = idx === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, now);
          g.gain.setValueAtTime(idx === 0 ? 0.14 : 0.06, now);
          g.gain.exponentialRampToValueAtTime(0.0008, now + 1.9);
          osc.connect(g); g.connect(ctx.destination);
          osc.start(now); osc.stop(now + 1.95);
        });
      } else if (kind === 'knock') {
        [0, 0.22, 0.44].forEach(dt => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(135, now + dt);
          osc.frequency.exponentialRampToValueAtTime(48, now + dt + 0.08);
          g.gain.setValueAtTime(0.18, now + dt);
          g.gain.exponentialRampToValueAtTime(0.001, now + dt + 0.1);
          osc.connect(g); g.connect(ctx.destination);
          osc.start(now + dt); osc.stop(now + dt + 0.11);
        });
      } else if (kind === 'crack' || kind === 'static') {
        const bufferSize = ctx.sampleRate * 0.22;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.45));
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const g = ctx.createGain();
        g.gain.setValueAtTime(kind === 'crack' ? 0.16 : 0.11, now);
        noise.connect(g); g.connect(ctx.destination);
        noise.start(now);
      } else if (kind === 'heartbeat') {
        [0, 0.28].forEach(dt => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(72, now + dt);
          osc.frequency.exponentialRampToValueAtTime(34, now + dt + 0.18);
          g.gain.setValueAtTime(0.18, now + dt);
          g.gain.exponentialRampToValueAtTime(0.001, now + dt + 0.2);
          osc.connect(g); g.connect(ctx.destination);
          osc.start(now + dt); osc.stop(now + dt + 0.21);
        });
      } else if (kind === 'reveal' || kind === 'choice') {
        const notes = kind === 'reveal' ? [392, 493.88, 587.33] : [440, 554.37];
        notes.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + idx * 0.08);
          g.gain.setValueAtTime(0.08, now + idx * 0.08);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
          osc.connect(g); g.connect(ctx.destination);
          osc.start(now + idx * 0.08); osc.stop(now + idx * 0.08 + 0.36);
        });
      }
    } catch (e) {}
  }

  // ==================== 4. СОСТОЯНИЕ И СОХРАНЕНИЕ ====================
  function defaultState() {
    return {
      episodeId: 'ep1',
      nodeId: 'p1_1',
      started: false,
      completed: false,
      playerName: 'Alex',
      gender: 'm',
      stats: { intuition: 0, composure: 0, audacity: 0 },
      rels: { clara: 0, lucas: 0, sam: 0, regina: 0 },
      flags: {},
      history: []
    };
  }

  let st = defaultState();
  let isTyping = false;
  let fullCurrentHtml = '';
  let currentNodeObj = null;
  let ruVisibleForLine = false;
  let lastBgKey = '';

  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        st = Object.assign(defaultState(), parsed);
        st.stats = Object.assign({ intuition: 0, composure: 0, audacity: 0 }, parsed.stats || {});
        st.rels = Object.assign({ clara: 0, lucas: 0, sam: 0, regina: 0 }, parsed.rels || {});
        st.flags = Object.assign({}, parsed.flags || {});
        if (!Array.isArray(st.history)) st.history = [];
      }
    } catch (e) { st = defaultState(); }
  }

  function writeSave() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(st)); } catch (e) {}
  }

  function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function interpolateText(txt) {
    if (!txt) return '';
    let out = String(txt).replace(/\{name\}/g, st.playerName || 'Alex');
    if (st.gender === 'f') {
      out = out
        .replace(/очутился\(лась\)/g, 'очутилась')
        .replace(/попал\(а\)/g, 'попала')
        .replace(/писал\(а\)/g, 'писала')
        .replace(/заметил\(а\)/g, 'заметила')
        .replace(/первым\(ой\)/g, 'первой')
        .replace(/привык\(ла\)/g, 'привыкла')
        .replace(/очнулся\(лась\)/g, 'очнулась')
        .replace(/появился\(лась\)/g, 'появилась')
        .replace(/взял\(а\)/g, 'взяла')
        .replace(/видел\(а\)/g, 'видела')
        .replace(/спас\(ла\)/g, 'спасла')
        .replace(/вытащил\(а\)/g, 'вытащила')
        .replace(/сошёл\(ла\)/g, 'сошла')
        .replace(/обжёг\(ла\)/g, 'обожгла')
        .replace(/остался\(лась\)/g, 'осталась')
        .replace(/поймал\(а\)/g, 'поймала')
        .replace(/доверился\(лась\)/g, 'доверилась')
        .replace(/сохранил\(а\)/g, 'сохранила')
        .replace(/отказался\(лась\)/g, 'отказалась')
        .replace(/выбрал\(а\)/g, 'выбрала')
        .replace(/пошёл\(ла\)/g, 'пошла')
        .replace(/узнал\(а\)/g, 'узнала');
    } else {
      out = out
        .replace(/очутился\(лась\)/g, 'очутился')
        .replace(/попал\(а\)/g, 'попал')
        .replace(/писал\(а\)/g, 'писал')
        .replace(/заметил\(а\)/g, 'заметил')
        .replace(/первым\(ой\)/g, 'первым')
        .replace(/привык\(ла\)/g, 'привык')
        .replace(/очнулся\(лась\)/g, 'очнулся')
        .replace(/появился\(лась\)/g, 'появился')
        .replace(/взял\(а\)/g, 'взял')
        .replace(/видел\(а\)/g, 'видел')
        .replace(/спас\(ла\)/g, 'спас')
        .replace(/вытащил\(а\)/g, 'вытащил')
        .replace(/сошёл\(ла\)/g, 'сошёл')
        .replace(/обжёг\(ла\)/g, 'обжёг')
        .replace(/остался\(лась\)/g, 'остался')
        .replace(/поймал\(а\)/g, 'поймал')
        .replace(/доверился\(лась\)/g, 'доверился')
        .replace(/сохранил\(а\)/g, 'сохранил')
        .replace(/отказался\(лась\)/g, 'отказался')
        .replace(/выбрал\(а\)/g, 'выбрал')
        .replace(/пошёл\(ла\)/g, 'пошёл')
        .replace(/узнал\(а\)/g, 'узнал');
    }
    return out;
  }

  function wrapVnWords(text) {
    return escapeHtml(text).replace(/([A-Za-z’'-]{2,})/g, function(m) {
      return `<span class="vn-word" data-word="${m.replace(/['’]/g, '')}">${m}</span>`;
    });
  }

  // ==================== 5. ЗАГРУЗКА АРТОВ (.png С ПРОЗРАЧНОСТЬЮ -> .jpg + ВЫРЕЗКА НА HTTPS) ====================
  const spriteDataCache = {};

  function cutoutWhiteBg(probe) {
    try {
      const maxDim = 800;
      const sc = Math.min(1, maxDim / Math.max(probe.naturalWidth, probe.naturalHeight));
      const w = Math.max(1, Math.round(probe.naturalWidth * sc));
      const h = Math.max(1, Math.round(probe.naturalHeight * sc));
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(probe, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;

      // Если PNG уже имеет прозрачные углы — оставляем как есть
      if (d[3] < 200 || d[(w - 1) * 4 + 3] < 200) return probe.src;

      const samplePts = [0, 3, w - 1, w - 4, Math.floor(h * 0.15) * w, Math.floor(h * 0.15) * w + w - 1];
      let sr = 0, sg = 0, sb = 0, cnt = 0;
      samplePts.forEach(p => {
        const i = p * 4;
        if ((d[i] + d[i + 1] + d[i + 2]) / 3 > 165) {
          sr += d[i]; sg += d[i + 1]; sb += d[i + 2]; cnt++;
        }
      });
      if (cnt < 2) return probe.src;
      const bgR = sr / cnt, bgG = sg / cnt, bgB = sb / cnt;

      const total = w * h;
      const vis = new Uint8Array(total);
      const q = new Int32Array(total);
      let head = 0, tail = 0;
      const isBg = p => {
        const i = p * 4;
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const lum = (r + g + b) / 3;
        const dist = Math.hypot(r - bgR, g - bgG, b - bgB);
        return (dist < 54 && lum > 155) || (lum > 228 && (Math.max(r, g, b) - Math.min(r, g, b)) < 44);
      };
      const seed = (x, y) => {
        const p = y * w + x;
        if (!vis[p] && isBg(p)) { vis[p] = 1; q[tail++] = p; }
      };
      for (let x = 0; x < w; x++) { seed(x, 0); seed(x, h - 1); }
      for (let y = 0; y < h; y++) { seed(0, y); seed(w - 1, y); }
      while (head < tail) {
        const p = q[head++]; const x = p % w; const y = (p - x) / w;
        if (x > 0 && !vis[p - 1] && isBg(p - 1)) { vis[p - 1] = 1; q[tail++] = p - 1; }
        if (x + 1 < w && !vis[p + 1] && isBg(p + 1)) { vis[p + 1] = 1; q[tail++] = p + 1; }
        if (y > 0 && !vis[p - w] && isBg(p - w)) { vis[p - w] = 1; q[tail++] = p - w; }
        if (y + 1 < h && !vis[p + w] && isBg(p + w)) { vis[p + w] = 1; q[tail++] = p + w; }
      }
      for (let p = 0; p < total; p++) {
        if (vis[p]) {
          d[p * 4 + 3] = 0;
        } else {
          const x = p % w; const y = (p - x) / w;
          const touchesBg = (x > 0 && vis[p - 1]) || (x + 1 < w && vis[p + 1]) || (y > 0 && vis[p - w]) || (y + 1 < h && vis[p + w]);
          if (touchesBg) {
            const i = p * 4;
            const lum = (d[i] + d[i + 1] + d[i + 2]) / 3;
            if (lum > 175) d[i + 3] = Math.max(0, Math.min(255, Math.round(255 * (238 - lum) / 65)));
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
      return c.toDataURL('image/png');
    } catch (err) {
      return probe.src;
    }
  }

  function loadSpriteWithFallback(basePath, onReady, onMissing) {
    if (!basePath) { onMissing(); return; }
    if (spriteDataCache[basePath]) {
      if (spriteDataCache[basePath] === 'MISSING') onMissing();
      else onReady(spriteDataCache[basePath]);
      return;
    }
    const pngUrl = basePath.endsWith('.png') || basePath.endsWith('.jpg') ? basePath : (basePath + '.png');
    const jpgUrl = basePath.endsWith('.png') || basePath.endsWith('.jpg') ? basePath : (basePath + '.jpg');

    const imgPng = new Image();
    imgPng.onload = function() {
      spriteDataCache[basePath] = cutoutWhiteBg(imgPng);
      onReady(spriteDataCache[basePath]);
    };
    imgPng.onerror = function() {
      if (jpgUrl === pngUrl) {
        spriteDataCache[basePath] = 'MISSING';
        onMissing();
        return;
      }
      const imgJpg = new Image();
      imgJpg.onload = function() {
        spriteDataCache[basePath] = cutoutWhiteBg(imgJpg);
        onReady(spriteDataCache[basePath]);
      };
      imgJpg.onerror = function() {
        spriteDataCache[basePath] = 'MISSING';
        onMissing();
      };
      imgJpg.src = jpgUrl;
    };
    imgPng.src = pngUrl;
  }

  // Состояние активных персонажей на сцене (для плавных переходов, дыхания и эмоций без мигания)
  let activeCharMap = {};
  let lastSpeakerId = '';
  let activeBgSlideIdx = 0;

  function clearCharactersLayer(immediate) {
    const charsLayer = document.getElementById('vncCharsLayer');
    if (!charsLayer) return;
    if (immediate) {
      charsLayer.innerHTML = '';
      activeCharMap = {};
      lastSpeakerId = '';
      return;
    }
    Object.keys(activeCharMap).forEach(cid => {
      const rec = activeCharMap[cid];
      if (rec && rec.slot) {
        rec.slot.classList.add('vnc-char-exit');
        setTimeout(() => { if (rec.slot && rec.slot.parentNode) rec.slot.remove(); }, 340);
      }
    });
    activeCharMap = {};
    lastSpeakerId = '';
  }

  function triggerCharReaction(slotEl, reactClass) {
    if (!slotEl || !reactClass) return;
    const reactEl = slotEl.querySelector('.vnc-char-react');
    if (!reactEl) return;
    reactEl.classList.remove('react-speak', 'react-tense', 'react-calm', 'react-shock');
    void reactEl.offsetWidth;
    reactEl.classList.add(reactClass);
    setTimeout(() => { if (reactEl) reactEl.classList.remove(reactClass); }, 620);
  }

  function setTalkingState(speakerId, talking) {
    Object.keys(activeCharMap).forEach(cid => {
      const rec = activeCharMap[cid];
      if (!rec || !rec.slot) return;
      rec.slot.classList.toggle('is-talking', Boolean(talking && cid === speakerId));
    });
  }

  function applyCharSpriteToBreath(charId, emo, breathEl, crossfade) {
    const ch = CHARACTERS[charId];
    if (!ch || !breathEl) return;
    const basePath = (ch.emotions && ch.emotions[emo]) || (ch.emotions && Object.values(ch.emotions)[0]) || '';

    function renderFallbackPortrait() {
      breathEl.innerHTML = `
        <div class="vnc-char-fallback" style="--char-accent:${ch.color};">
          <div class="vnc-char-fallback-ring">
            <img src="${ch.fallbackImg}" alt="${escapeHtml(ch.name)}" onerror="this.style.display='none'">
            <span class="vnc-char-monogram">${ch.monogram}</span>
          </div>
          <div class="vnc-char-fallback-name">${escapeHtml(ch.ruName)}</div>
          <div class="vnc-char-fallback-series">${escapeHtml(ch.series)}</div>
        </div>
      `;
    }

    loadSpriteWithFallback(
      basePath,
      src => {
        if (!breathEl.isConnected) return;
        const oldImg = breathEl.querySelector('.vnc-char-img:not(.vnc-char-ghost)');
        if (crossfade && oldImg && oldImg.getAttribute('src') !== src) {
          const ghost = oldImg.cloneNode(true);
          ghost.classList.add('vnc-char-ghost');
          breathEl.appendChild(ghost);
          oldImg.src = src;
          oldImg.classList.remove('vnc-emo-fadein');
          void oldImg.offsetWidth;
          oldImg.classList.add('vnc-emo-fadein');
          setTimeout(() => { if (ghost && ghost.parentNode) ghost.remove(); }, 300);
        } else {
          breathEl.innerHTML = `<img class="vnc-char-img" src="${src}" alt="${escapeHtml(ch.name)}">`;
        }
      },
      renderFallbackPortrait
    );
  }

  function syncCharactersOnStage(charsList, speakerId, stageFx) {
    const charsLayer = document.getElementById('vncCharsLayer');
    if (!charsLayer) return;
    const nextList = Array.isArray(charsList) ? charsList : [];
    const nextIds = new Set(nextList.map(c => c.id));

    // Плавно убираем героев, которых нет в новой сцене
    Object.keys(activeCharMap).forEach(cid => {
      if (!nextIds.has(cid)) {
        const rec = activeCharMap[cid];
        delete activeCharMap[cid];
        if (rec && rec.slot) {
          rec.slot.classList.remove('is-talking');
          rec.slot.classList.add('vnc-char-exit');
          setTimeout(() => { if (rec.slot && rec.slot.parentNode) rec.slot.remove(); }, 340);
        }
      }
    });

    // Обновляем оставшихся и плавно вводим новых
    nextList.forEach(c => {
      const ch = CHARACTERS[c.id];
      if (!ch) return;
      const pos = c.pos || 'center';
      const emo = c.emo || 'calm';
      const isSpeaking = c.active !== false;
      const existing = activeCharMap[c.id];

      if (existing && existing.slot && existing.slot.isConnected) {
        const slot = existing.slot;
        slot.classList.remove('pos-left', 'pos-center', 'pos-right', 'speaking', 'dimmed', 'vnc-char-exit');
        slot.classList.add('pos-' + pos, isSpeaking ? 'speaking' : 'dimmed');

        const emoChanged = existing.emo !== emo;
        if (emoChanged) {
          applyCharSpriteToBreath(c.id, emo, existing.breath, true);
          existing.emo = emo;
          if (emo === 'serious' || emo === 'suspicious') {
            triggerCharReaction(slot, 'react-tense');
          } else {
            triggerCharReaction(slot, 'react-calm');
          }
        } else if (isSpeaking && c.id === speakerId && lastSpeakerId !== speakerId) {
          triggerCharReaction(slot, 'react-speak');
        }

        if (stageFx === 'shake' || stageFx === 'glitch') {
          triggerCharReaction(slot, 'react-shock');
        }
        existing.pos = pos;
        existing.active = isSpeaking;
      } else {
        const slot = document.createElement('div');
        slot.className = `vnc-char-slot pos-${pos} ${isSpeaking ? 'speaking' : 'dimmed'} vnc-enter-${pos}`;
        slot.style.setProperty('--char-accent', ch.color);
        slot.innerHTML = `
          <div class="vnc-char-actor">
            <div class="vnc-char-react">
              <div class="vnc-char-breath" style="--breath-dur:${ch.breathDur || '4.8s'}; --breath-delay:${ch.breathDelay || '0s'};"></div>
            </div>
          </div>
        `;
        const breath = slot.querySelector('.vnc-char-breath');
        charsLayer.appendChild(slot);
        applyCharSpriteToBreath(c.id, emo, breath, false);
        activeCharMap[c.id] = { slot, breath, emo, pos, active: isSpeaking };

        setTimeout(() => {
          slot.classList.remove('vnc-enter-left', 'vnc-enter-right', 'vnc-enter-center');
        }, 560);

        if (stageFx === 'shake' || stageFx === 'glitch') {
          setTimeout(() => triggerCharReaction(slot, 'react-shock'), 120);
        }
      }
    });
  }

  function updateMcMirrorPreview() {
    const box = document.getElementById('vncMcMirrorBox');
    if (!box) return;
    const basePath = MC_PORTRAITS[st.gender] || MC_PORTRAITS.m;
    const label = st.gender === 'f' ? 'Главная героиня' : 'Главный герой';
    loadSpriteWithFallback(
      basePath,
      src => {
        const b = document.getElementById('vncMcMirrorBox');
        if (b) b.innerHTML = `<img class="vnc-mc-img" src="${src}" alt="${label}">`;
      },
      () => {
        const b = document.getElementById('vncMcMirrorBox');
        if (b) b.innerHTML = `<div class="vnc-mc-placeholder"><span>11:59</span><small>${label}</small></div>`;
      }
    );
  }

  function ensureAmbientParticles(isFoggy) {
    const stage = document.getElementById('vncStage');
    if (!stage) return;
    let pLayer = document.getElementById('vncParticlesLayer');
    if (!pLayer) {
      pLayer = document.createElement('div');
      pLayer.id = 'vncParticlesLayer';
      pLayer.className = 'vnc-particles-layer';
      for (let i = 0; i < 18; i++) {
        const dot = document.createElement('span');
        dot.className = 'vnc-mote';
        const size = (2.2 + (i % 4) * 1.15).toFixed(1);
        const left = ((i * 19 + 7) % 94) + 3;
        const dur = (7.5 + (i % 6) * 2.1).toFixed(1);
        const delay = (-((i * 1.7) % 9)).toFixed(1);
        const drift = (i % 2 === 0 ? 1 : -1) * (14 + (i % 5) * 7);
        dot.style.cssText = `width:${size}px;height:${size}px;left:${left}%;--mote-dur:${dur}s;--mote-delay:${delay}s;--mote-drift:${drift}px;`;
        pLayer.appendChild(dot);
      }
      const fogEl = document.getElementById('vncFogLayer');
      if (fogEl && fogEl.parentNode) fogEl.parentNode.insertBefore(pLayer, fogEl.nextSibling);
      else stage.appendChild(pLayer);
    }
    pLayer.classList.toggle('is-fog', !!isFoggy);
  }

  function applyBackground(bgKey) {
    const bgEl = document.getElementById('vncBgLayer');
    const fogEl = document.getElementById('vncFogLayer');
    if (!bgEl) return;
    const cfg = BACKGROUNDS[bgKey] || BACKGROUNDS.black;
    if (fogEl) fogEl.classList.toggle('active', !!cfg.fog);
    ensureAmbientParticles(!!cfg.fog);

    if (lastBgKey === bgKey) return;
    lastBgKey = bgKey;

    // Создаём два слоя внутри #vncBgLayer для плавного киношного кроссфейда фонов
    let slides = bgEl.querySelectorAll('.vnc-bg-slide');
    if (slides.length < 2) {
      bgEl.style.backgroundImage = 'none';
      bgEl.innerHTML = '<div class="vnc-bg-slide active"></div><div class="vnc-bg-slide"></div>';
      slides = bgEl.querySelectorAll('.vnc-bg-slide');
      activeBgSlideIdx = 0;
    }

    const nextIdx = 1 - activeBgSlideIdx;
    const prevSlide = slides[activeBgSlideIdx];
    const nextSlide = slides[nextIdx];
    activeBgSlideIdx = nextIdx;

    const setSlideBg = (bgCss) => {
      nextSlide.style.backgroundImage = bgCss;
      nextSlide.classList.remove('kenburns');
      void nextSlide.offsetWidth;
      nextSlide.classList.add('kenburns', 'active');
      prevSlide.classList.remove('active');
    };

    setSlideBg(cfg.fallback);

    if (cfg.file) {
      const img = new Image();
      img.onload = () => {
        if (lastBgKey === bgKey) {
          nextSlide.style.backgroundImage = `linear-gradient(180deg, rgba(8,6,8,0.34) 0%, rgba(8,6,8,0.18) 45%, rgba(8,6,8,0.72) 100%), url('${cfg.file}')`;
        }
      };
      img.src = cfg.file;
    }
  }

  function renderCgOverlay(cgKey) {
    const cgBox = document.getElementById('vncCgLayer');
    if (!cgBox) return;
    if (!cgKey) {
      cgBox.classList.remove('active');
      cgBox.innerHTML = '';
      return;
    }
    cgBox.classList.add('active');
    if (cgKey === 'clock_1159') {
      cgBox.innerHTML = `
        <div class="vnc-cg-card">
          <img src="novel/cg-clock-1159.jpg" alt="11:59" class="vnc-cg-real-img" onload="this.nextElementSibling.style.display='none'" onerror="this.style.display='none'">
          <div class="vnc-clock-fallback">
            <div class="vnc-clock-dial">
              <div class="vnc-clock-mark m12">XII</div>
              <div class="vnc-clock-mark m3">III</div>
              <div class="vnc-clock-mark m6">VI</div>
              <div class="vnc-clock-mark m9">IX</div>
              <div class="vnc-hand-hour"></div>
              <div class="vnc-hand-min"></div>
              <div class="vnc-hand-pin"></div>
            </div>
            <div class="vnc-clock-digital">11:59</div>
          </div>
        </div>
      `;
    } else if (cgKey === 'journal_note') {
      cgBox.innerHTML = `
        <div class="vnc-cg-card">
          <img src="novel/cg-journal-note.jpg" alt="Дневник" class="vnc-cg-real-img" onload="this.nextElementSibling.style.display='none'" onerror="this.style.display='none'">
          <div class="vnc-journal-fallback">
            <div class="vnc-wax-seal">11:59</div>
            <div class="vnc-journal-page-title">${escapeHtml(st.playerName || 'Alex')}'s Journal</div>
            <div class="vnc-journal-page-line">“Do not trust the first smile you see.<br>Find the missing page before twelve.”</div>
          </div>
        </div>
      `;
    }
  }

  // ==================== 6. УВЕДОМЛЕНИЯ ====================
  let toastTimeout = null;
  function showVnToast(text) {
    const el = document.getElementById('vncToast');
    if (!el || !text) return;
    el.textContent = text;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => el.classList.remove('show'), 3800);
  }

  function triggerStageFx(fx) {
    const stage = document.getElementById('vncStage');
    if (!stage || !fx) return;
    stage.classList.remove('fx-shake', 'fx-flash', 'fx-glitch');
    void stage.offsetWidth;
    stage.classList.add('fx-' + fx);
    setTimeout(() => stage.classList.remove('fx-' + fx), 650);
  }

  // ==================== 7. МЕНЮ И ОТРИСОВКА СЦЕН ====================
  function updateTopStats() {
    const el = document.getElementById('vncStatsMini');
    if (!el) return;
    el.innerHTML = `
      <span title="Интуиция">Интуиция: <b>${st.stats.intuition}</b></span>
      <span title="Хладнокровие">Хладнокровие: <b>${st.stats.composure}</b></span>
      <span title="Дерзость">Дерзость: <b>${st.stats.audacity}</b></span>
    `;
  }

  function renderHubMenu() {
    clearTimers();
    lastBgKey = '';
    applyBackground('clock_tower');
    renderCgOverlay(null);
    clearCharactersLayer(true);
    document.getElementById('vncDialogWrap').style.display = 'none';
    document.getElementById('vncOverlayCenter').style.display = 'flex';
    document.getElementById('vncChapterPill').textContent = 'СЕЗОН 1';
    updateTopStats();

    const canResume = st.started && !st.completed && st.nodeId && st.nodeId !== 'p1_1';
    document.getElementById('vncOverlayCenter').innerHTML = `
      <div class="vnc-menu-card">
        <div class="vnc-menu-hero">
          <img src="novel/cover.jpg" alt="Midnight Never Comes" class="vnc-menu-cover" onerror="this.style.display='none'">
          <div class="vnc-menu-hero-info">
            <div class="vnc-menu-kicker">СЕЗОН 1</div>
            <h2 class="vnc-menu-title">Midnight Never Comes</h2>
            <p class="vnc-menu-desc">
              Ноябрьским утром в городе замирают все часы, а за стеной тумана оказываются чужие улицы. Никто не может уйти, пока не найдётся вырванная страница.
            </p>
          </div>
        </div>

        <div class="vnc-ep-list">
          <div class="vnc-ep-card active">
            <div>
              <div class="vnc-ep-num">ЭПИЗОД 1</div>
              <div class="vnc-ep-name">One Minute to Midnight</div>
              <div class="vnc-ep-cast">Тихое утро на Вистерия Лейн обрывается ровно в 11:59.</div>
            </div>
            <div class="vnc-ep-actions">
              ${canResume ? `<button class="vnc-btn primary" onclick="window.VNC.resumeEpisode()">Продолжить</button>` : ''}
              <button class="vnc-btn ${canResume ? 'ghost' : 'primary'}" onclick="window.VNC.startNewEpisode('ep1')">${canResume ? 'С начала' : 'Играть'}</button>
            </div>
          </div>

          <div class="vnc-ep-card locked">
            <div>
              <div class="vnc-ep-num">ЭПИЗОД 2</div>
              <div class="vnc-ep-name">Guests from Mystic Falls</div>
              <div class="vnc-ep-cast">Туман сдвигается снова, открывая дорогу в новый квартал.</div>
            </div>
            <span class="vnc-ep-soon">Скоро</span>
          </div>
        </div>
      </div>
    `;
  }

  function clearTimers() {
    if (vnTypeTimer) { clearInterval(vnTypeTimer); vnTypeTimer = null; }
    if (vnChoiceTimer) { clearInterval(vnChoiceTimer); vnChoiceTimer = null; }
    if (typeof window.stopAllAudio === 'function') window.stopAllAudio();
  }

  function goToNode(nodeId) {
    clearTimers();
    const ep = EPISODES[st.episodeId] || EPISODE_1;
    const node = ep.nodes[nodeId];
    if (!node) { renderHubMenu(); return; }

    st.nodeId = nodeId;
    st.started = true;
    currentNodeObj = node;
    ruVisibleForLine = vnAutoRu;

    if (node.statGain && !st.flags['gained_' + nodeId]) {
      st.flags['gained_' + nodeId] = true;
      Object.keys(node.statGain).forEach(k => { st.stats[k] = (st.stats[k] || 0) + node.statGain[k]; });
    }
    if (node.relGain && !st.flags['relgained_' + nodeId]) {
      st.flags['relgained_' + nodeId] = true;
      Object.keys(node.relGain).forEach(k => { st.rels[k] = (st.rels[k] || 0) + node.relGain[k]; });
    }
    if (node.toast) showVnToast(interpolateText(node.toast));

    writeSave();
    updateTopStats();

    if (node.bg) applyBackground(node.bg);
    if (node.chapterTag) document.getElementById('vncChapterPill').textContent = node.chapterTag;
    if (node.sfx) playVnSfx(node.sfx);
    if (node.fx) triggerStageFx(node.fx);
    renderCgOverlay(node.cg || null);

    const activeSpeakerId = CHARACTERS[node.speaker] ? node.speaker : '';
    syncCharactersOnStage(node.chars || [], activeSpeakerId, node.fx || '');

    if (node.type === 'title_card') { renderTitleCard(node); return; }
    if (node.type === 'setup_player') { renderPlayerSetup(node); return; }
    if (node.type === 'choice') { renderChoiceNode(node); return; }
    if (node.type === 'ending') { renderEndingScreen(ep); return; }

    document.getElementById('vncOverlayCenter').style.display = 'none';
    document.getElementById('vncDialogWrap').style.display = 'block';

    const spEl = document.getElementById('vncSpeakerName');
    const enEl = document.getElementById('vncTextEn');
    const ruEl = document.getElementById('vncTextRu');
    const ruBtn = document.getElementById('vncRuToggleBtn');

    const nextSpKey = node.speaker || '';
    const speakerChanged = nextSpKey !== lastSpeakerId;
    lastSpeakerId = nextSpKey;

    if (CHARACTERS[node.speaker]) {
      const ch = CHARACTERS[node.speaker];
      spEl.textContent = ch.name;
      spEl.style.borderColor = ch.color;
      spEl.style.color = '#faf4e8';
      spEl.style.background = 'rgba(18, 12, 12, 0.94)';
      spEl.style.display = 'inline-block';
    } else if (node.speaker) {
      spEl.textContent = node.speaker;
      spEl.style.borderColor = node.speakerStyle === 'note' ? '#c9a24b' : 'rgba(201,162,75,0.45)';
      spEl.style.color = node.speakerStyle === 'note' ? '#fde047' : '#d6cab8';
      spEl.style.background = 'rgba(14, 11, 10, 0.9)';
      spEl.style.display = 'inline-block';
    } else {
      spEl.style.display = 'none';
    }
    if (speakerChanged && spEl.style.display !== 'none') {
      spEl.classList.remove('vnc-tag-pop');
      void spEl.offsetWidth;
      spEl.classList.add('vnc-tag-pop');
    }

    const finalEn = interpolateText(node.en || '');
    const finalRu = interpolateText(node.ru || '');
    fullCurrentHtml = wrapVnWords(finalEn);

    const spLabel = CHARACTERS[node.speaker] ? CHARACTERS[node.speaker].name : (node.speaker || '');
    if (finalEn && (!st.history.length || st.history[st.history.length - 1].en !== finalEn)) {
      st.history.push({ sp: spLabel, en: finalEn, ru: finalRu });
      if (st.history.length > 55) st.history.shift();
      writeSave();
    }

    ruEl.textContent = finalRu;
    ruEl.style.display = ruVisibleForLine ? 'block' : 'none';
    if (ruBtn) ruBtn.textContent = ruVisibleForLine ? 'Скрыть перевод' : 'Перевод';

    isTyping = true;
    setTalkingState(activeSpeakerId, true);
    let charIdx = 0;
    enEl.textContent = '';
    vnTypeTimer = setInterval(() => {
      charIdx += 3;
      if (charIdx >= finalEn.length) {
        finishTyping();
      } else {
        enEl.textContent = finalEn.slice(0, charIdx);
      }
    }, 18);
  }

  function finishTyping() {
    if (vnTypeTimer) { clearInterval(vnTypeTimer); vnTypeTimer = null; }
    isTyping = false;
    setTalkingState('', false);
    const enEl = document.getElementById('vncTextEn');
    if (enEl) enEl.innerHTML = fullCurrentHtml;
  }

  function advanceLine() {
    if (!currentNodeObj) return;
    if (currentNodeObj.type === 'choice' || currentNodeObj.type === 'setup_player' || currentNodeObj.type === 'ending') return;
    if (currentNodeObj.type === 'title_card') {
      goToNode(currentNodeObj.next);
      return;
    }
    if (isTyping) {
      finishTyping();
      return;
    }
    if (currentNodeObj.branchFlag) {
      const ok = !!st.flags[currentNodeObj.branchFlag];
      goToNode(ok ? currentNodeObj.ifTrue : currentNodeObj.ifFalse);
      return;
    }
    if (currentNodeObj.next) goToNode(currentNodeObj.next);
  }

  function renderTitleCard(node) {
    document.getElementById('vncDialogWrap').style.display = 'none';
    const center = document.getElementById('vncOverlayCenter');
    center.style.display = 'flex';
    center.innerHTML = `
      <div class="vnc-title-splash" onclick="window.VNC.advance()">
        <div class="vnc-splash-ep">${escapeHtml(node.titleEp)}</div>
        <h1 class="vnc-splash-main">${escapeHtml(node.titleMain)}</h1>
        <div class="vnc-splash-sub">${escapeHtml(node.titleSub)}</div>
        <div class="vnc-splash-hint">Нажми, чтобы продолжить →</div>
      </div>
    `;
  }

  function renderPlayerSetup(node) {
    document.getElementById('vncDialogWrap').style.display = 'none';
    const center = document.getElementById('vncOverlayCenter');
    center.style.display = 'flex';
    center.innerHTML = `
      <div class="vnc-setup-card">
        <div class="vnc-setup-layout">
          <div class="vnc-mc-mirror-frame" id="vncMcMirrorBox"></div>
          <div class="vnc-setup-form">
            <div class="vnc-menu-kicker">ДОМ № 4354 · ОТРАЖЕНИЕ</div>
            <h3 style="font-family:'Cormorant Garamond',serif; font-size:1.7rem; color:#e8c775; margin-bottom:6px;">Кто смотрит на тебя?</h3>
            <p style="font-size:0.82rem; color:#c2b29f; margin-bottom:12px;">Имя и образ сохранятся для следующих серий.</p>

            <label class="vnc-setup-label">Имя героя:</label>
            <input id="vncNameInput" class="vnc-setup-input" type="text" maxlength="18" value="${escapeHtml(st.playerName || 'Alex')}" placeholder="Alex, Kate, Max...">

            <label class="vnc-setup-label" style="margin-top:11px;">Персонаж:</label>
            <div class="vnc-gender-row">
              <button type="button" class="vnc-btn ${st.gender === 'm' ? 'primary' : 'ghost'}" id="vncGenM" onclick="window.VNC.setGender('m')">Он</button>
              <button type="button" class="vnc-btn ${st.gender === 'f' ? 'primary' : 'ghost'}" id="vncGenF" onclick="window.VNC.setGender('f')">Она</button>
            </div>

            <button type="button" class="vnc-btn primary" style="width:100%; margin-top:15px; padding:12px;" onclick="window.VNC.confirmSetup('${node.next}')">Продолжить →</button>
          </div>
        </div>
      </div>
    `;
    updateMcMirrorPreview();
  }

  function renderChoiceNode(node) {
    document.getElementById('vncDialogWrap').style.display = 'none';
    const center = document.getElementById('vncOverlayCenter');
    center.style.display = 'flex';

    const timerHtml = node.timed
      ? `<div class="vnc-timer-wrap"><div class="vnc-timer-fill" id="vncTimerFill"></div></div><div class="vnc-timer-lbl" id="vncTimerLbl">Осталось: ${node.timed} сек.</div>`
      : '';

    center.innerHTML = `
      <div class="vnc-choice-box">
        ${timerHtml}
        <div class="vnc-choice-prompt">${escapeHtml(interpolateText(node.promptRu || 'Выбери ответ:'))}</div>
        <div class="vnc-choice-list">
          ${node.options.map((opt, idx) => `
            <button class="vnc-choice-btn" onclick="window.VNC.pickChoice(${idx})">
              <div class="vnc-choice-en">${wrapVnWords(interpolateText(opt.en))}</div>
              <div class="vnc-choice-ru">${escapeHtml(interpolateText(opt.ru))}</div>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    center.querySelectorAll('.vnc-choice-btn .vn-word').forEach(sp => {
      sp.addEventListener('click', e => e.stopPropagation());
    });

    if (node.timed) {
      const totalMs = node.timed * 1000;
      vnChoiceDeadline = Date.now() + totalMs;
      vnChoiceTimer = setInterval(() => {
        const left = Math.max(0, vnChoiceDeadline - Date.now());
        const pct = Math.max(0, (left / totalMs) * 100);
        const fill = document.getElementById('vncTimerFill');
        const lbl = document.getElementById('vncTimerLbl');
        if (fill) fill.style.width = pct + '%';
        if (lbl) lbl.textContent = `Осталось: ${Math.ceil(left / 1000)} сек.`;
        if (left <= 0) {
          clearInterval(vnChoiceTimer);
          vnChoiceTimer = null;
          showVnToast('Время вышло');
          window.VNC.pickChoice(node.defaultOption || 0);
        }
      }, 80);
    }
  }

  function renderEndingScreen(ep) {
    st.completed = true;
    writeSave();
    document.getElementById('vncDialogWrap').style.display = 'none';
    const center = document.getElementById('vncOverlayCenter');
    center.style.display = 'flex';

    const relLabels = [
      { k: 'clara', label: 'Клара Вэнс' },
      { k: 'lucas', label: 'Лукас Грант' },
      { k: 'sam', label: 'Сэм Винчестер' },
      { k: 'regina', label: 'Реджина Миллс' }
    ];

    const keyFlags = [];
    if (st.flags.sawMirrorLag) keyFlags.push('В доме № 4354 ты заметил(а) сбой времени в треснувшем зеркале.');
    if (st.flags.foundBrassKey) keyFlags.push('У тебя в кармане старинный латунный ключ с гравировкой XI:LIX.');
    if (st.flags.suspectedClara) keyFlags.push('Ты поймал(а) Клару Вэнс на спокойствии — Лукас стал доверять тебе больше.');
    else if (st.flags.politeToClara) keyFlags.push('Ты сохранил(а) вежливость с Кларой — она запомнила твои манеры.');
    else if (st.flags.boldWithClara) keyFlags.push('Ты сразу поставил(а) Клару на место.');

    if (st.flags.hasVervain) keyFlags.push('Ты забрал(а) свёрток с сушёной вербеной.');
    if (st.flags.showedLucasJournal) keyFlags.push('Ты показал(а) дневник Лукасу ещё на Вистерия Лейн.');
    if (st.flags.grabbedScrap) keyFlags.push('Ты поймал(а) обгоревший обрывок с печатью хранилища Часовой башни.');
    if (st.flags.companionWalk === 'sam') keyFlags.push('По дороге к башне ты сблизился(лась) с Сэмом и узнал(а) о его обещании Дину.');
    else if (st.flags.companionWalk === 'lucas') keyFlags.push('По дороге к башне Лукас рассказал тебе о серебряной шкатулке под розами Клары.');

    keyFlags.push(st.flags.trustedRegina
      ? 'Ты доверился(лась) ритуалу Реджины и увидел(а) видение о Мистик Фоллс.'
      : 'Ты отказался(лась) от ритуала Реджины — вы сохранили скрытность и укрепили союз с Сэмом.');

    center.innerHTML = `
      <div class="vnc-end-card">
        <div class="vnc-menu-kicker">ЭПИЗОД 1 ЗАВЕРШЁН</div>
        <h2 class="vnc-menu-title">One Minute to Midnight</h2>

        <div class="vnc-end-stats">
          <div class="vnc-end-stat"><b>${st.stats.intuition}</b><span>Интуиция</span></div>
          <div class="vnc-end-stat"><b>${st.stats.composure}</b><span>Хладнокровие</span></div>
          <div class="vnc-end-stat"><b>${st.stats.audacity}</b><span>Дерзость</span></div>
        </div>

        <div class="vnc-end-block">
          <div class="vnc-end-lbl">Отношения:</div>
          <div class="vnc-rel-chips">
            ${relLabels.map(r => `<span class="vnc-rel-chip">${r.label}: <b style="color:${(st.rels[r.k] || 0) >= 0 ? '#6be38c' : '#fca5a5'}">${(st.rels[r.k] || 0) > 0 ? '+' : ''}${st.rels[r.k] || 0}</b></span>`).join('')}
          </div>
        </div>

        <div class="vnc-end-block">
          <div class="vnc-end-lbl">Решения и предметы:</div>
          <ul class="vnc-flags-list">
            ${keyFlags.map(f => `<li>${escapeHtml(interpolateText(f))}</li>`).join('')}
          </ul>
        </div>

        <div class="vnc-end-block">
          <div class="vnc-end-lbl">Слова из серии:</div>
          <div class="vnc-vocab-preview">
            ${ep.vocab.map(v => `
              <div class="vnc-vocab-row" onclick="window.speakText('${v.en.replace(/'/g, "\\'")}')">
                <span><b style="color:#e8c775;">${escapeHtml(v.en)}</b> — ${escapeHtml(v.ru)}</span>
                <span style="opacity:0.75;">🔊</span>
              </div>
            `).join('')}
          </div>
          <button id="vncSaveDeckBtn" class="vnc-btn primary" style="width:100%; margin-top:10px;" onclick="window.VNC.exportEpisodeDeck('ep1')">
            + Сохранить в словарь (сборник «Midnight Never Comes — Эп. 1»)
          </button>
        </div>

        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:14px;">
          <button class="vnc-btn ghost" style="flex:1;" onclick="window.VNC.startNewEpisode('ep1')">Перепройти</button>
          <button class="vnc-btn ghost" style="flex:1;" onclick="window.VNC.close()">На главную</button>
        </div>
      </div>
    `;
  }

  function openHistoryLog() {
    const logModal = document.getElementById('vncLogModal');
    const logBody = document.getElementById('vncLogBody');
    if (!logModal || !logBody) return;
    if (!st.history.length) {
      logBody.innerHTML = '<div style="color:#9c8d7d; text-align:center; padding:20px;">История диалога пока пуста.</div>';
    } else {
      logBody.innerHTML = st.history.map(item => `
        <div class="vnc-log-item">
          ${item.sp ? `<div class="vnc-log-sp">${escapeHtml(item.sp)}</div>` : ''}
          <div class="vnc-log-en">${wrapVnWords(item.en)}</div>
          <div class="vnc-log-ru">${escapeHtml(item.ru)}</div>
        </div>
      `).join('');
    }
    logModal.classList.add('open');
  }

  // ==================== 8. ПУБЛИЧНОЕ API (window.VNC) ====================
  window.VNC = {
    open: function() {
      loadSave();
      const drawer = document.getElementById('eshDrawer');
      if (drawer && drawer.classList.contains('open') && window.ESHHub) window.ESHHub.toggleDrawer();
      const modal = document.getElementById('vnChroniclesModal');
      if (!modal) return;
      modal.classList.add('open');
      renderHubMenu();
      startVnBgm();
    },
    close: function() {
      clearTimers();
      stopVnBgm();
      const modal = document.getElementById('vnChroniclesModal');
      if (modal) modal.classList.remove('open');
      const logM = document.getElementById('vncLogModal');
      if (logM) logM.classList.remove('open');
      const pop = document.getElementById('eshWordPopup');
      if (pop) pop.classList.remove('show');
    },
    openMenu: function() {
      renderHubMenu();
    },
    startNewEpisode: function(epId) {
      const prevName = st.playerName || 'Alex';
      const prevGender = st.gender || 'm';
      st = defaultState();
      st.episodeId = epId || 'ep1';
      st.playerName = prevName;
      st.gender = prevGender;
      st.started = true;
      writeSave();
      startVnBgm();
      goToNode('p1_1');
    },
    resumeEpisode: function() {
      goToNode(st.nodeId || 'p1_1');
    },
    advance: advanceLine,
    setGender: function(g) {
      st.gender = (g === 'f') ? 'f' : 'm';
      const bm = document.getElementById('vncGenM');
      const bf = document.getElementById('vncGenF');
      if (bm) bm.className = 'vnc-btn ' + (st.gender === 'm' ? 'primary' : 'ghost');
      if (bf) bf.className = 'vnc-btn ' + (st.gender === 'f' ? 'primary' : 'ghost');
      updateMcMirrorPreview();
    },
    confirmSetup: function(nextNodeId) {
      const inp = document.getElementById('vncNameInput');
      const val = inp ? inp.value.trim().replace(/[^A-Za-zА-Яа-яЁё0-9 -]/g, '') : '';
      st.playerName = val || 'Alex';
      writeSave();
      playVnSfx('choice');
      goToNode(nextNodeId || 'act1_journal_1');
    },
    pickChoice: function(idx) {
      if (!currentNodeObj || !currentNodeObj.options || !currentNodeObj.options[idx]) return;
      const opt = currentNodeObj.options[idx];
      if (vnChoiceTimer) { clearInterval(vnChoiceTimer); vnChoiceTimer = null; }
      playVnSfx('choice');

      if (opt.stat) {
        Object.keys(opt.stat).forEach(k => { st.stats[k] = (st.stats[k] || 0) + opt.stat[k]; });
      }
      if (opt.rel) {
        Object.keys(opt.rel).forEach(k => { st.rels[k] = (st.rels[k] || 0) + opt.rel[k]; });
      }
      if (opt.setFlag) {
        Object.keys(opt.setFlag).forEach(k => { st.flags[k] = opt.setFlag[k]; });
      }
      if (opt.toast) showVnToast(interpolateText(opt.toast));
      writeSave();
      goToNode(opt.goto);
    },
    speakCurrent: function(e) {
      if (e) e.stopPropagation();
      if (currentNodeObj && currentNodeObj.en) {
        window.speakText(interpolateText(currentNodeObj.en));
      }
    },
    toggleLineRu: function(e) {
      if (e) e.stopPropagation();
      ruVisibleForLine = !ruVisibleForLine;
      const ruEl = document.getElementById('vncTextRu');
      const ruBtn = document.getElementById('vncRuToggleBtn');
      if (ruEl) ruEl.style.display = ruVisibleForLine ? 'block' : 'none';
      if (ruBtn) ruBtn.textContent = ruVisibleForLine ? 'Скрыть перевод' : 'Перевод';
    },
    toggleAutoRu: function() {
      vnAutoRu = !vnAutoRu;
      ruVisibleForLine = vnAutoRu;
      const btn = document.getElementById('vncAutoRuBtn');
      if (btn) btn.textContent = vnAutoRu ? 'Автоперевод: ВКЛ' : 'Автоперевод: ВЫКЛ';
      const ruEl = document.getElementById('vncTextRu');
      if (ruEl && currentNodeObj && currentNodeObj.ru) ruEl.style.display = ruVisibleForLine ? 'block' : 'none';
    },
    toggleSfx: function() {
      vnSfxOn = !vnSfxOn;
      const btn = document.getElementById('vncSfxBtn');
      if (btn) btn.textContent = vnSfxOn ? 'SFX: ВКЛ' : 'SFX: ВЫКЛ';
    },
    toggleBgm: function() {
      vnBgmOn = !vnBgmOn;
      const btn = document.getElementById('vncBgmBtn');
      if (btn) btn.textContent = vnBgmOn ? 'Музыка: ВКЛ' : 'Музыка: ВЫКЛ';
      if (vnBgmOn) startVnBgm();
      else stopVnBgm();
    },
    openLog: openHistoryLog,
    closeLog: function() {
      const m = document.getElementById('vncLogModal');
      if (m) m.classList.remove('open');
    },
    exportEpisodeDeck: function(epId) {
      const ep = EPISODES[epId] || EPISODE_1;
      const deckId = 'vn_' + ep.id;
      const deckName = 'Midnight Never Comes — Эп. ' + ep.number;
      let decks = [];
      try { decks = JSON.parse(localStorage.getItem(DECKS_KEY) || '[]'); if (!Array.isArray(decks)) decks = []; } catch (e) { decks = []; }
      let existing = decks.find(d => d.id === deckId);
      const mappedWords = ep.vocab.map((v, i) => ({
        id: 'dw_' + deckId + '_' + i,
        en: v.en,
        ru: v.ru,
        ex: v.ex
      }));
      if (existing) {
        existing.words = mappedWords;
      } else {
        decks.unshift({ id: deckId, name: deckName, createdAt: Date.now(), words: mappedWords });
      }
      try { localStorage.setItem(DECKS_KEY, JSON.stringify(decks)); } catch (e) {}
      if (typeof window.syncCustomWordsIntoDictionary === 'function') window.syncCustomWordsIntoDictionary();

      const btn = document.getElementById('vncSaveDeckBtn');
      if (btn) {
        btn.textContent = '✓ Сохранено в словарь';
        btn.disabled = true;
      }
      showVnToast('Сборник добавлен в Словарь, Тренажёр и Crimson Pursuit');
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    const dlg = document.getElementById('vncDialogBox');
    if (dlg) {
      dlg.addEventListener('click', e => {
        if (e.target.closest('button, .vn-word')) return;
        advanceLine();
      });
    }
    const stage = document.getElementById('vncStage');
    if (stage) {
      stage.addEventListener('click', e => {
        if (e.target.closest('button, .vn-word, #vncDialogWrap, #vncOverlayCenter, #vncLogModal')) return;
        advanceLine();
      });


    }
  });

  document.addEventListener('keydown', e => {
    const modal = document.getElementById('vnChroniclesModal');
    if (!modal || !modal.classList.contains('open')) return;
    if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (e.key === ' ' || e.key === 'Enter') {
      if (currentNodeObj && !['choice', 'setup_player', 'ending'].includes(currentNodeObj.type)) {
        e.preventDefault();
        advanceLine();
      }
    } else if (e.key === 'Escape') {
      const logM = document.getElementById('vncLogModal');
      if (logM && logM.classList.contains('open')) window.VNC.closeLog();
    }
  });
})();
