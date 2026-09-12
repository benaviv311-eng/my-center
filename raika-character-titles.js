(function(){
  const data = window.RAIKA_DATA;
  if(!data?.characters) return;
  const updates = {
    raika: {
      title: "ראיקה — איקזוצ'י נו שוגושה",
      role: "גיבורה · מגינת הברק"
    },
    hikari: {
      title: "היקארי — האקוראי",
      role: "אם ולוחמת עבר · הברק הלבן",
      summary: "אמה של ראיקה, לוחמת דגולה בעבר. הכינוי האקוראי — הברק הלבן — קשור למורשת הקרבית שלה. בחיי המשפחה היא מביאה חמלה, הומור וחום."
    },
    raiko: {
      title: "רייקו — שונסוקו",
      role: "אח צעיר · המהיר"
    },
    raigo: {
      title: "רייגו — גוריקי",
      role: "אח צעיר · החזק"
    },
    kaminari: {
      title: "קאמינארי — האשירה",
      role: "אביו של ראי · העמוד",
      summary: "אביו של ראי, שנפל כשבנו היה בן שמונה. כינויו האשירה — העמוד. מותו עומד בבסיס מסלול חייו של ראי והקשר שלו למורשת."
    }
  };
  for(const character of data.characters){
    const update = updates[character.id];
    if(update) Object.assign(character, update);
  }
})();
