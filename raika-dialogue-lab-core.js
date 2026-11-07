(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.RaikaDialogueLabCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const TONES = Object.freeze({
    comedic: 'קומי',
    tense: 'מותח',
    emotional: 'מרגש',
    dramatic: 'דרמטי',
    sarcastic: 'עוקצני',
    warm: 'חם',
    mysterious: 'מסתורי',
    awkward: 'מביך',
    epic: 'אפי',
    restrained: 'מאופק'
  });

  const DYNAMICS = Object.freeze({
    rivalry: 'מתח בין יריבות',
    teasing: 'עקיצות ידידותיות',
    disagreement: 'חילוקי דעות',
    awkwardness: 'מבוכה',
    cooperation: 'שיתוף פעולה כפוי',
    respect: 'כבוד הדדי',
    misunderstanding: 'אי־הבנה',
    mentor: 'מנטור ותלמיד',
    family: 'מתח משפחתי'
  });

  const TONE_GUIDANCE = Object.freeze({
    comedic: 'ההומור נובע מהאופי ומהתגובה של הדמויות, לא מהפיכתן לטיפשות.',
    tense: 'משפטים קצרים, שתיקות, מבטים ותחושה שמשהו עומד להישבר.',
    emotional: 'הרגש עולה דרך פעולה, היסוס ומשפט אחד כן — בלי נאומים.',
    dramatic: 'לתת למשמעות של הרגע מקום; כל משפט צריך לשנות משהו ביחסים.',
    sarcastic: 'עקיצות מדויקות שמסתירות רגש או תחרות, בלי השפלה אישית.',
    warm: 'קרבה, הומור עדין ומחווה קטנה שמספרת יותר ממילים.',
    mysterious: 'מידע חלקי, רמזים, שתיקות ושאלה שנשארת פתוחה.',
    awkward: 'היסוסים, תיקונים באמצע משפט וניסיון להסתיר מבוכה.',
    epic: 'תחושת חשיבות ואתגר, בלי להפוך רגע קטן לנאום גדול.',
    restrained: 'מעט מילים, הרבה תת־טקסט ותגובות מאופקות.'
  });

  const TONE_EXCHANGES = Object.freeze({
    comedic: [
      ['רגע, זה היה החלק שבו אני אמורה להתרשם?', 'לא. זה היה החלק שבו את אמורה לנסות שוב.'],
      ['אני מתחילה לחשוב שהייתה לך תוכנית.', 'הייתה. ואז הגעת.'],
      ['את תמיד הופכת דבר פשוט למסובך?', 'רק כשאת בסביבה.']
    ],
    tense: [
      ['אל תזוזי. עוד צעד אחד ואנחנו מאבדות את היתרון.', 'את תמיד מדברת כאילו את היחידה שרואה את התמונה.'],
      ['תסתכלי עליי. לא על מה שאת חושבת שיקרה.', 'אני מסתכלת. זאת בדיוק הבעיה.'],
      ['משהו כאן לא מסתדר.', 'אז אל תעמידי פנים שלא שמת לב.']
    ],
    emotional: [
      ['לא רציתי שתראי כמה זה חשוב לי.', 'אז למה כל כך התאמצת שאשים לב?'],
      ['חשבתי שתביני לבד.', 'אני לא תמיד יודעת מה את צריכה שאבין.'],
      ['לא ביקשתי שתפתרי את זה.', 'אז מה את מבקשת?', 'רק שלא תלכי.']
    ],
    dramatic: [
      ['חשבתי שהפעם תבחרי אחרת.', 'גם אני. ואז ראיתי מה עומד לקרות.'],
      ['יש דברים שאי אפשר להחזיר למקום.', 'אבל אפשר לבחור מה עושים איתם עכשיו.'],
      ['את יודעת מה המחיר.', 'כן. אני פשוט לא מוכנה לתת לו לבחור במקומי.']
    ],
    sarcastic: [
      ['מרשים. כמעט הצלחת להקשיב עד הסוף.', 'אל תתרגלי. זה היה רגע חד־פעמי.'],
      ['אני רואה שהתוכנית שלך מבוססת על תקווה.', 'ולמרבה ההפתעה, גם עלייך.'],
      ['זאת הייתה אמורה להיות תשובה?', 'זאת הייתה אמורה להיות שאלה טובה.']
    ],
    warm: [
      ['את לא חייבת לעשות את זה לבד.', 'אני יודעת. פשוט שכחתי שמותר לי לבקש.'],
      ['שמרתי לך מקום.', 'לא אמרתי שאני באה.', 'לא היית צריכה.'],
      ['את יכולה לנוח. אני אמשיך מכאן.', 'רק אם תבטיחי לקרוא לי כשאת צריכה עזרה.']
    ],
    mysterious: [
      ['את שמעת את זה?', 'כן. אבל זה לא מה שמדאיג אותי.'],
      ['מי עוד יודע שאנחנו כאן?', 'זאת השאלה הלא נכונה.'],
      ['משהו חסר בסיפור הזה.', 'אולי מישהו דאג שנפספס אותו.']
    ],
    awkward: [
      ['אני לא התכוונתי שזה יישמע ככה.', 'אז איך התכוונת שזה יישמע?'],
      ['אפשר פשוט לשכוח שאמרתי את זה?', 'אפשר. אבל אני לא מבטיחה.'],
      ['למה את מסתכלת עליי ככה?', 'אני מנסה להבין אם את רצינית.']
    ],
    epic: [
      ['האתגר הזה גדול יותר ממה שחשבנו.', 'אז נצטרך להיות גדולות יותר ממנו.'],
      ['אין דרך קלה מכאן.', 'לא ביקשתי דרך קלה.'],
      ['ברגע הזה נחליט מי אנחנו.', 'אז כדאי שנבחר נכון.']
    ],
    restrained: [
      ['את יכולה ללכת. אני מסתדרת.', 'אני יודעת. אני נשארת בכל זאת.'],
      ['לא אמרתי שאני מסכימה.', 'לא ביקשתי שתסכימי. רק שתחשבי.'],
      ['הבנתי.', 'לא. שמעת. זה לא אותו דבר.']
    ]
  });

  const DYNAMIC_EXCHANGES = Object.freeze({
    rivalry: [
      ['אל תצפי שאוותר לך רק כי את בטוחה בעצמך.', 'יופי. לא באתי לבקש הנחה.', 'אז תפסיקי לבדוק אם אני מסתכלת.', 'קשה להתעלם ממישהי שמנסה כל כך להרשים.'],
      ['את מוכנה להתחיל, או שאת מחכה שאאבד סבלנות?', 'אני בודקת אם יש לך בכלל סבלנות.', 'תתרכזי בתרגיל.', 'אני מרוכזת. את זאת שמסתכלת לכיווני.']
    ],
    teasing: [
      ['את יודעת, כמעט עשית את זה נכון.', 'כמעט? זאת המחמאה הכי טובה שלך?', 'אל תדאגי, אני עוד אתאמן על מחמאות.', 'תתחילי בלתרגל את החלק הראשון.'],
      ['את תמיד חייבת את המילה האחרונה?', 'לא. רק כשהמילה שלך לא מדויקת.', 'אז תתקני אותי.', 'בשמחה. אבל תקשיבי הפעם.']
    ],
    disagreement: [
      ['זאת לא הדרך היחידה לעשות את זה.', 'אבל זאת הדרך שאני בוחרת.', 'ואם היא לא תעבוד?', 'אז לפחות נדע למה.'],
      ['את רואה רק את מה שמולך.', 'ואת מניחה שאני לא רואה מעבר.', 'אני אומרת שכדאי לבדוק שוב.', 'ואני אומרת שכדאי להחליט.']
    ],
    awkwardness: [
      ['רציתי להגיד משהו, אבל עכשיו זה נשמע מוזר.', 'עכשיו? זה התחיל מוזר לפני שתי דקות.', 'יופי. אז לפחות אני עקבית.', 'בזה אין לי ספק.'],
      ['את יכולה להפסיק להסתכל עליי?', 'אני לא מסתכלת.', 'אז למה את עונה לי?', 'כי את מדברת בקול רם.']
    ],
    cooperation: [
      ['אנחנו לא חייבות להסכים כדי לסיים את זה.', 'נכון. אבל כדאי שנפסיק להפריע אחת לשנייה.', 'את מתחילה?', 'רק אם את מפסיקה להתחרות בכל משפט.'],
      ['אני אקח את הצד הזה.', 'חשבתי שכבר החלטת לקחת את כל הצדדים.', 'רק את אלה שאת משאירה פתוחים.', 'אז הפעם נשאיר אחד לשתינו.']
    ],
    respect: [
      ['לא ציפיתי שתבחיני בזה.', 'אני מבחינה ביותר ממה שאת חושבת.', 'אז למה לא אמרת?', 'כי רציתי לראות אם תגלי בעצמך.'],
      ['זה היה מהלך טוב.', 'זאת הייתה מחמאה?', 'אל תגרמי לי לחזור בי.', 'לא ביקשתי שתאמרי את זה פעמיים.']
    ],
    misunderstanding: [
      ['אז בגלל זה התרחקת?', 'לא התרחקתי. ניסיתי לתת לך מקום.', 'זה לא הרגיש ככה.', 'אז כנראה שלא הסברתי את עצמי.'],
      ['חשבתי שכבר החלטת.', 'חשבתי שאת לא רוצה שאחליט בשבילך.', 'אני רוצה שתשאלי.', 'אז אני שואלת עכשיו.']
    ],
    mentor: [
      ['אני יודעת את הכלל. אני לא מבינה למה הוא חשוב.', 'אז אל תשנני אותו. תבדקי מה קורה כשאת מתעלמת ממנו.', 'ואם אטעה?', 'אז תהיה לך תשובה אמיתית.'],
      ['את מתקנת אותי לפני שסיימתי.', 'כי אני כבר רואה לאן את הולכת.', 'אולי הפעם תני לי להגיע לשם לבד.', 'בסדר. אני מקשיבה.']
    ],
    family: [
      ['את שוב מנסה לעשות הכול לבד.', 'ואת שוב מתערבת.', 'מישהו צריך לדאוג לך.', 'אני יודעת. בגלל זה אני מתווכחת איתך.'],
      ['השארתי לך את החלק האחרון.', 'למה?', 'כי ידעתי שתגיעי רעבה.', 'זאת לא סיבה להודות לך.']
    ]
  });

  function clean(value) {
    return String(value == null ? '' : value).trim();
  }

  function nameOf(character) {
    if (typeof character === 'string') return clean(character);
    return clean(character && (character.title || character.name || character.label || character.id));
  }

  function isIncomplete(character) {
    if (!character || typeof character !== 'object') return true;
    if (character.missingProfile === true) return true;
    const profileFields = ['traits', 'wants', 'fears', 'beliefs'];
    return !profileFields.some(function (field) {
      return Array.isArray(character[field]) && character[field].length > 0;
    });
  }

  function toneNames(primaryTone, secondaryTone) {
    const primary = TONES[primaryTone];
    const secondary = secondaryTone && secondaryTone !== primaryTone ? TONES[secondaryTone] : '';
    if (!primary) throw new Error('יש לבחור רגש מרכזי.');
    if (secondaryTone && secondaryTone !== primaryTone && !secondary) throw new Error('הרגש המשני אינו מוכר.');
    return secondary ? [primary, secondary] : [primary];
  }

  function choose(list, variant) {
    return list[Math.abs(Number(variant) || 0) % list.length];
  }

  function buildDialogue(input) {
    const options = input || {};
    const characters = (Array.isArray(options.characters) ? options.characters : []).filter(function (item) {
      return nameOf(item);
    });
    if (characters.length < 2) throw new Error('יש לבחור לפחות שתי דמויות.');
    if (characters.length > 3) throw new Error('אפשר לבחור עד שלוש דמויות.');
    const location = clean(options.location);
    const activity = clean(options.activity);
    const dynamic = clean(options.dynamic);
    if (!location) throw new Error('יש לבחור מיקום.');
    if (!activity) throw new Error('יש לבחור פעילות.');
    if (!DYNAMICS[dynamic]) throw new Error('יש לבחור דינמיקה.');
    const tones = toneNames(clean(options.primaryTone), clean(options.secondaryTone));
    const names = characters.map(nameOf);
    const [a, b, c] = names;
    const variant = Math.max(0, Number(options.variant) || 0);
    const dynamicExchange = choose(DYNAMIC_EXCHANGES[dynamic], variant);
    const primaryExchange = choose(TONE_EXCHANGES[options.primaryTone], variant);
    const secondaryExchange = options.secondaryTone && options.secondaryTone !== options.primaryTone
      ? choose(TONE_EXCHANGES[options.secondaryTone], variant + 1)
      : null;

    const dialogue = [
      { kind: 'stage', text: 'הפעולה נמשכת, אבל תשומת הלב עוברת לרגע אל מה שלא נאמר.' },
      { speaker: a, text: dynamicExchange[0] },
      { speaker: b, text: dynamicExchange[1] },
      { speaker: a, text: dynamicExchange[2] },
      { speaker: b, text: dynamicExchange[3] },
      { kind: 'stage', text: TONE_GUIDANCE[options.primaryTone] },
      { speaker: a, text: primaryExchange[0] },
      { speaker: b, text: primaryExchange[1] }
    ];

    if (secondaryExchange) {
      dialogue.push(
        { kind: 'stage', text: 'הגוון המשני נכנס לשיחה ומחדד את התגובה.' },
        { speaker: a, text: secondaryExchange[0] },
        { speaker: b, text: secondaryExchange[1] }
      );
    }

    if (c) {
      dialogue.push(
        { kind: 'stage', text: 'הדמות השלישית קוטעת את המתח לפני שהוא נפתר.' },
        { speaker: c, text: 'רק רציתי להזכיר לכן שיש כאן עוד מישהו שמנסה להבין מה קורה.' }
      );
    } else {
      dialogue.push(
        { speaker: a, text: 'אז בואי נבדוק את זה במקום להמשיך להתווכח.' },
        { speaker: b, text: 'בסדר. אבל אל תצפי שאעשה לך חיים קלים.' }
      );
    }

    const unverifiedCharacters = characters.filter(isIncomplete).map(nameOf);
    const warnings = unverifiedCharacters.map(function (name) {
      return 'כרטיס הדמות של ' + name + ' חלקי; הדיאלוג אינו מייחס לה עובדות, יכולות או עבר שאינם מופיעים במאגר.';
    });
    if (options.locationVerified === false) warnings.push('המיקום הוזן ידנית ואינו מאומת מול רשימת המקומות הקאנונית.');
    if (options.customCharacter) warnings.push('דמות נוספת הוזנה ידנית ואינה מאומתת מול מאגר הדמויות.');

    const toneLabel = tones.join(' + ');
    const title = names.join(' × ') + ' — ' + activity;
    const dialogueText = dialogue.map(function (line) {
      return line.kind === 'stage' ? '(' + line.text + ')' : line.speaker + ': ״' + line.text + '״';
    }).join('\n');
    const note = clean(options.note);
    const text = [
      title,
      'מיקום: ' + location,
      'פעילות: ' + activity,
      'דינמיקה מבוקשת: ' + DYNAMICS[dynamic],
      'אווירה: ' + toneLabel,
      '',
      'דיאלוג מוצע:',
      dialogueText,
      note ? '\nהערת כיוון: ' + note : '',
      '',
      'הערת קאנון: זהו תרגיל כתיבה והצעה בלבד. הדינמיקה והאירוע אינם הופכים לעובדה קאנונית בלי אישור מפורש.'
    ].filter(Boolean).join('\n');

    return {
      title: title,
      text: text,
      dialogue: dialogue,
      characters: characters.map(function (item) { return item && item.id ? item.id : nameOf(item); }),
      tones: tones,
      dynamic: dynamic,
      status: 'idea',
      type: 'idea',
      isCanon: false,
      unverifiedCharacters: unverifiedCharacters,
      warnings: warnings
    };
  }

  function sourceCharacterNames(source) {
    if (Array.isArray(source.characterNames) && source.characterNames.length) return source.characterNames.map(clean).filter(Boolean);
    if (typeof source.participants === 'string' && source.participants.trim()) {
      return source.participants.split(/\s+ו(?=[א-ת])/).map(clean).filter(Boolean);
    }
    if (Array.isArray(source.characters)) return source.characters.map(nameOf).filter(Boolean);
    return [];
  }

  function buildToneRemix(source, primaryTone, secondaryTone, variant) {
    const item = source && typeof source === 'object' ? source : {};
    const sourceTitle = clean(item.title || item.name);
    const sourceText = clean(item.body || item.summary || item.originalText || item.draftText || item.text || item.opening);
    if (!sourceTitle && !sourceText) throw new Error('יש לבחור סצנה או רעיון קיים לשינוי האווירה.');
    const tones = toneNames(clean(primaryTone), clean(secondaryTone));
    const names = sourceCharacterNames(item);
    const a = names[0] || 'דמות ראשונה';
    const b = names[1] || 'דמות שנייה';
    const index = Math.max(0, Number(variant) || 0);
    const primary = choose(TONE_EXCHANGES[primaryTone], index);
    const secondary = secondaryTone && secondaryTone !== primaryTone
      ? choose(TONE_EXCHANGES[secondaryTone], index + 1)
      : null;
    const isBakery = /מאפייה|אופה|קומוגי|קמח|לחם/.test(sourceTitle + ' ' + sourceText);
    const bakeryLines = [
      [a, 'רק רציתי לעזור. איך הצלחנו להפוך משימה פשוטה לאירוע?'],
      [b, 'אני נתתי לך משימה פשוטה. לא הבטחתי שהיא תישאר פשוטה.'],
      [a, 'אני חושבת שהקמח התחיל את זה.'],
      [b, 'מעניין. הקמח טוען שאת התחלת.']
    ];
    const chosenLines = isBakery && tones.includes('קומי')
      ? bakeryLines
      : [
          [a, primary[0]],
          [b, primary[1]],
          [a, secondary ? secondary[0] : 'אז מה את מציעה שנעשה עכשיו?'],
          [b, secondary ? secondary[1] : 'נתחיל שוב, הפעם בלי להניח שאנחנו יודעות הכול.']
        ];
    const guidance = tones.map(function (label) {
      const key = Object.keys(TONES).find(function (toneKey) { return TONES[toneKey] === label; });
      return TONE_GUIDANCE[key];
    }).filter(Boolean).join(' ');
    const dialogueText = chosenLines.map(function (line) {
      return line[0] + ': ״' + line[1] + '״';
    }).join('\n');
    const title = (sourceTitle || 'סצנה קיימת') + ' — גרסה ' + tones.join(' + ');
    const text = [
      title,
      '',
      'הסצנה המקורית:',
      sourceText || sourceTitle,
      '',
      'אותה סיטואציה נשמרת: הדמויות, הפעולה המרכזית והעובדות המקוריות אינן משתנות. משתנים רק הטון, הקצב, בחירת המילים והתגובות.',
      '',
      'הנחיית משחק:',
      guidance,
      '',
      'דיאלוג מוצע:',
      dialogueText,
      '',
      'כיוון לסיום:',
      tones.includes('קומי') ? 'לסיים בתגובה קטנה או בהיפוך מצחיק שנובע מהסיטואציה, בלי למחוק את מה שקרה.' :
        tones.includes('מותח') ? 'לסיים בפרט קטן שמעלה שאלה או משאיר את הדמויות דרוכות.' :
        tones.includes('מרגש') ? 'לסיים במחווה או במשפט קצר שמראה מה השתנה בין הדמויות.' :
        'לסיים בבחירה או בתגובה שממחישה את האווירה החדשה.',
      '',
      'הערת קאנון: זו גרסת טיוטה נפרדת. המקור לא שונה, והגרסה אינה קאנון עד לאישור מפורש.'
    ].join('\n');

    return {
      title: title,
      text: text,
      dialogue: chosenLines.map(function (line) { return { speaker: line[0], text: line[1] }; }),
      tones: tones,
      status: 'idea',
      type: 'idea',
      isCanon: false,
      sourceTitle: sourceTitle
    };
  }

  return {
    TONES: TONES,
    DYNAMICS: DYNAMICS,
    TONE_GUIDANCE: TONE_GUIDANCE,
    buildDialogue: buildDialogue,
    buildToneRemix: buildToneRemix,
    isIncompleteCharacter: isIncomplete
  };
});
