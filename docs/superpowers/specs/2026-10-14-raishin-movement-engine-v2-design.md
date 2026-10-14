# מורשת ריישין — Movement Engine v2

## סטטוס
Design approved in chat on 2026-10-14. This document formalizes the approved architecture before implementation planning.

## מטרת השינוי
לבנות מחדש את שכבת התנועה של **מורשת ריישין** כך שהמשחק יתנהג כמו משחק Action-Adventure / Action-RPG דו־ממדי־וחצי (2.5D / pseudo-3D), ולא כמו תמונה שטוחה שעליה מזיזים ספרייטים לפי פיקסלים של המסך.

היעד המרכזי: ראיקה תנוע בחופשיות על מישור רצפה לוגי, כולל למעלה/למטה/ימינה/שמאלה/אלכסונים, כאשר המיקום החזותי, הגודל, העומק, הצל וההתנגשויות נגזרים מאותה נקודת קרקע עקבית. תנועת UP חייבת להרגיש כמו תנועה אמיתית לעומק, ללא ריחוף, טיפוס על קירות או החלקה חזותית.

## סוג המשחק שננעל
**Raishin Legacy = Phaser 4.2.1 + 2.5D Perspective Ground Plane + Ground-Anchored Sprites + Directional Animation State Machine + Y-Depth Sorting.**

המשחק אינו:
- side-scroller,
- top-down שטוח,
- משחק 3D מלא.

הוא כן:
- עולם דו־ממדי עם תחושת עומק,
- רצפה פרספקטיבית,
- ספרייטים דו־ממדיים,
- תנועה חופשית על מישור לוגי,
- שינוי scale לפי עומק,
- depth ordering לפי מיקום על הרצפה,
- collisions ואינטראקציות לפי footprint על הקרקע.

## הבעיה בארכיטקטורה הנוכחית
המנוע הנוכחי מערבב בין שלושה מושגים שאמורים להיות נפרדים:
1. world coordinates,
2. screen coordinates,
3. sprite pixels.

כיום חלק מהתנועה מוגדר ישירות על טרפז בקואורדינטות מסך, גודל ראיקה נגזר מ־Y של המסך, וקוד ה־grounding סורק alpha של ספרייטים בזמן ריצה כדי לנסות לאתר את כף הרגל. בנוסף קיימים תיקוני offset, mirroring ו־contact point נפרדים לכיוונים שונים.

התוצאה היא רגישות גבוהה לכל שינוי ספרייט ותופעות כמו:
- ריחוף,
- החלקה,
- חיבור לא עקבי בין כף הרגל לצל,
- תנועה לעומק שלא מרגישה כתנועה במרחב,
- כניסה חזותית לקירות/מדפים,
- תיקונים נקודתיים שונים לכל כיוון.

Movement Engine v2 מבטל את התלות הזו ומפריד בין העולם, ההקרנה למסך והאנימציה.

## עקרון היסוד
כל דמות בעולם מקבלת **Ground Point** לוגי.

הזרימה המחייבת:

`World Position -> Perspective Projection -> Screen Ground Point -> Sprite Pivot`

ולא:

`Sprite Pixels -> Guess Foot Position -> Correct Screen Position`

ה־Ground Point הוא מקור האמת היחיד למיקום ראיקה על הרצפה.

## מערכת הקואורדינטות
### World Space
הדוג'ו יקבל מישור לוגי עצמאי, לדוגמה `1000 x 600` יחידות עולם. המידות המדויקות ייקבעו בזמן calibration מול הרקע המאושר.

`player.worldX` ו־`player.worldY` מייצגים מיקום על הרצפה בלבד.

### Screen Space
`WorldPlane` מקרין כל נקודת עולם למיקום מסך לפי הפרספקטיבה של הדוג'ו.

ההקרנה תחזיר לפחות:
- `screenX`
- `screenY`
- `depthScale`

### Sprite Space
לכל frame יש pivot/anchor קבוע שנקבע מראש. אין סריקת alpha בזמן gameplay.

הספרייט מצויר כך שה־pivot שלו יושב בדיוק על `screen ground point`.

## Ground Point ו־Pivot
ראיקה תעוגן לפי נקודת הקרקע מתחת לכפות הרגליים.

דרישות:
- לכל סט אנימציה יהיו metadata של pivot לכל frame או pivot משותף אם הסט מאפשר זאת.
- metadata יישמר כנתונים סטטיים, לא יחושב בכל frame בזמן ריצה.
- אין `getImageData()` לצורך grounding בזמן gameplay.
- אין זיהוי כף רגל לפי alpha בזמן runtime.
- הצל מחובר ישירות ל־Ground Point, לא לספרייט.

משמעות: גם אם בעתיד ראיקה תקפוץ, הצל יישאר על הרצפה והספרייט יוכל לעלות מעליו.

## Perspective Projection
הדוג'ו יוצג כרצפה פרספקטיבית.

`WorldPlane` אחראי להמרה בין מישור לוגי לרצפה הנראית על המסך.

הקרנה ראשונה יכולה להתבסס על quadrilateral / trapezoid calibration של רצפת הדוג'ו המאושרת. כל פינה לוגית של המישור תמופה לפינה חזותית מתאימה ברקע.

המערכת חייבת לתמוך ב:
- תנועה רציפה קדימה/אחורה,
- scale רציף לפי עומק,
- projection עקבי גם באלכסון,
- reverse mapping בסיסי אם נדרש לכלי debug/calibration.

## PlayerController
אחראי רק על מצב השחקן בעולם.

תחומי אחריות:
- WASD / arrows,
- normalization של diagonal input,
- acceleration/deceleration,
- max speed,
- position update ב־World Space,
- collision resolution,
- current facing direction,
- current movement state.

הוא אינו יודע דבר על גודל הספרייט או על פיקסלים של הרקע.

## PlayerAnimator
אחראי רק על בחירת האנימציה והפריים.

מצבים ראשונים:
- idle-up
- idle-down
- idle-left
- idle-right
- walk-up
- walk-down
- walk-left
- walk-right

בהמשך:
- run/jog,
- turn,
- stop,
- jump,
- dodge,
- interact,
- attack,
- Raihatsu actions.

אנימציית walk מתקדמת לפי **מרחק אמיתי שנעבר בעולם**, לא רק לפי זמן. כך קצב הצעדים נשאר מסונכרן עם מהירות התנועה.

## PlayerView
אחראי על התצוגה של ראיקה.

קלט:
- projected ground point,
- depthScale,
- current animation frame,
- frame pivot metadata.

פלט:
- sprite screen position,
- sprite scale,
- render depth,
- shadow position/scale.

אין ב־PlayerView החלטות gameplay.

## Y-Depth Sorting
כל אובייקט דינמי מקבל render depth לפי נקודת הקרקע שלו.

ברירת מחדל:
`depth = projectedGroundY`

כך:
- ראיקה מאחורי שק -> מצוירת מאחוריו,
- ראיקה לפני שק -> מצוירת לפניו,
- אותו עיקרון יחול בעתיד על NPCs, אויבים ואביזרים.

אובייקטים קבועים יוכלו לקבל depth bands או ground anchor משלהם.

## Collision System
התנגשות מבוססת footprint על הרצפה, לא על גבולות הספרייט.

ראיקה:
- גוף קטן באזור כפות הרגליים,
- circle/ellipse או capsule פשוט,
- ללא קשר לאוזניים, שיער, ידיים או גוף עליון.

אובייקטים:
- שק אימון,
- עמודים,
- מדפי נשק,
- קירות/גבול אחורי,
- יציאה לחצר,
- אזורי חסימה נוספים לפי הצורך.

ה־CollisionMap יוגדר ב־World Space.

## Camera
המצלמה תשתמש במצלמת Phaser.

דרישות:
- follow חלק,
- dead zone,
- smoothing,
- bounds של הדוג'ו,
- לא להזיז את העולם ידנית בכמה שכבות offset עצמאיות.

במיילסטון הראשון ניתן להשאיר תנועה מינימלית של המצלמה עד שה־WorldPlane יציב.

## Interaction System
אינטראקציות יוגדרו ב־World Space.

דוגמאות קיימות:
- Training Bag
- Weapons Wall
- Training Center
- Courtyard Exit
- Seika Point

בדיקת קרבה תהיה לפי world distance / interaction footprint. ה־prompt יוקרן למסך דרך WorldPlane.

## HUD
ה־HUD המאושר נשמר.

כולל:
- Health,
- Raihatsu / Energy,
- Objective,
- minimap,
- Jump,
- Dodge,
- Interact.

ה־HUD נשאר שכבת DOM/UI נפרדת ואינו משתתף במערכת הקואורדינטות של העולם.

## Visual Lock
כללי ראיקה הקיימים נשארים מחייבים:
- בדיוק שתי אוזני ארנבת,
- אפס אוזניים אנושיות,
- cream/white fur,
- green eyes,
- pale/white-blonde hair,
- side ponytail + dark green ribbon,
- cream training outfit + dark green trim/sash,
- brown forearm wraps,
- bare rabbit feet,
- no tail,
- אין שינוי בזהות או בפרופורציות ללא אישור.

Movement Engine v2 אינו מאשר יצירת נכס חזותי חדש. כל יצירת/עריכת תמונה ממשיכה לדרוש אישור מפורש לפני יצירה.

## מבנה קוד מוצע
```text
raishin-legacy/
  index.html
  styles.css
  game.js                 # bootstrap only
  src/
    scenes/
      DojoScene.js
    world/
      WorldPlane.js
      CollisionMap.js
    player/
      PlayerController.js
      PlayerAnimator.js
      PlayerView.js
      raika-animation-data.js
    systems/
      InteractionSystem.js
      CameraController.js
    ui/
      HudBridge.js
  assets/
    gameplay/
    player/
    dojo/
```

שמות הקבצים יכולים להשתנות מעט בזמן התכנון, אך ההפרדה בין responsibilities היא חלק מהאפיון.

## אסטרטגיית מעבר מהקוד הישן
החלפת המנוע תהיה הדרגתית ולא "שכתוב עיוור".

### שלב A — Prototype מבודד
לבנות `Movement Engine v2` בסצנת דוג'ו מבודדת, תוך שימוש ברקע ובנכסי ראיקה הקיימים.

Success criteria:
- LEFT / RIGHT / UP / DOWN עובדים על אותו Ground Point model.
- UP נראה כתנועה לעומק ולא כריחוף.
- אין runtime alpha scanning.

### שלב B — Collisions + Depth
להוסיף footprints, depth sorting וצל.

Success criteria:
- ראיקה לא יכולה לטפס על הקיר או מדפי הנשק.
- מעבר לפני/מאחורי אובייקטים נראה נכון.

### שלב C — Camera + Interactions
להעביר camera ו־interaction zones למודל החדש.

### שלב D — Replace old engine
רק אחרי שה־prototype עובר QA חזותי ותנועתי, להפוך אותו ל־default של `raishin-legacy/` ולהסיר את שכבות grounding הישנות.

## קוד ישן שיוסר לאחר המעבר
לאחר אישור Movement Engine v2, יש להסיר/להפסיק להשתמש ב:
- runtime alpha foot scanning,
- `findDenseFootContact`,
- `buildUpGroundingMetrics`,
- `buildLeftGroundingMetrics`,
- direction-specific grounding hacks,
- manual foot contact offset arrays,
- lower-body mirroring hacks שנועדו לתקן walk cycle,
- תלות ב־screen polygon כמקור האמת של מיקום העולם.

אין להסיר אותם לפני שה־v2 prototype מוכח ועובר QA.

## בדיקות
### Unit tests
- WorldPlane projection deterministic.
- world -> screen projection monotonic in depth.
- depthScale decreases as player moves deeper.
- diagonal movement normalized.
- collision footprint remains inside legal world.
- distance-driven frame progression stable.
- pivot metadata places frame anchor at projected Ground Point.
- Y-depth ordering deterministic.

### Integration tests
- holding UP changes worldY and projected screenY/scale together.
- UP cannot enter rear wall region.
- shadow remains on Ground Point during all walk frames.
- LEFT/RIGHT/UP/DOWN use one common rendering contract.
- interaction prompts remain aligned with projected interaction anchors.

### Visual QA
Manual QA remains mandatory because tests cannot prove visual grounding quality.

Checklist:
- no floating,
- no visible foot sliding beyond expected walk cycle limits,
- no climbing scenery,
- no sprite snapping between directions,
- no identity drift,
- no human ears,
- perspective scale feels continuous,
- shadow stays beneath the player,
- diagonal motion feels natural.

## Performance constraints
- no per-frame `getImageData`,
- no per-frame creation of temporary canvases,
- no repeated asset decoding,
- projection and collision math must remain lightweight,
- target desktop gameplay at smooth browser frame rate; mobile optimization can follow after desktop movement is locked.

## Non-goals for this milestone
לא נכנסים עדיין ל:
- combat system,
- enemy AI,
- inventory,
- skill tree,
- save system,
- quests,
- dialogue system,
- new visual asset generation,
- full courtyard scene.

המיילסטון הזה עוסק רק בתשתית תנועה נכונה שעליה כל אלה ייבנו בהמשך.

## Definition of Done
Movement Engine v2 נחשב מוכן רק כאשר:
1. ראיקה נעה בארבעה כיוונים ובאלכסון על World Space אחד.
2. UP/DOWN מייצרים תחושת עומק רציפה באמצעות projection + scale, לא באמצעות תיקוני sprite.
3. כל הספרייטים מעוגנים ל־Ground Point דרך pivot metadata קבוע.
4. הצל מחובר ל־Ground Point.
5. collisions עובדים ב־World Space.
6. depth sorting עובד לפי מיקום על הרצפה.
7. אין runtime alpha scanning לצורך grounding.
8. כל בדיקות ה־Movement Engine עוברות.
9. QA ידני מאשר שאין ריחוף/טיפוס על קירות/החלקה חריגה.
10. רק לאחר מכן מחליפים את המנוע הישן במשחק החי.
