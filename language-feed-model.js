(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.LanguageFeedModel=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const LANGUAGE_CODES=['ar','it','ru','es'];
  const LANGUAGES={
    ar:{name:'ערבית',code:'AR',native:'العربية',primary:'תעתיק עברי',secondary:'כתב ערבי'},
    it:{name:'איטלקית',code:'IT',native:'Italiano',primary:'איטלקית',secondary:''},
    ru:{name:'רוסית',code:'RU',native:'Русский',primary:'תעתיק לטיני',secondary:'קירילית'},
    es:{name:'ספרדית',code:'ES',native:'Español',primary:'ספרדית',secondary:''}
  };

  const BANK={
    ar:{
      words:[
        ['hello','مرحبا','מַרְחַבַּא','שלום'],['coffee','قهوة','קַהְוֶה','קפה'],['friend','صاحب','סַאחֶבּ','חבר'],['today','اليوم','אִלְיוֹם','היום'],['ball','طابة','טַאבֶּה','כדור'],['home','بيت','בֵּית','בית'],['hungry','جعان','ג׳ַעַאן','רעב'],['thanks','شكرا','שֻכְּרַן','תודה']
      ],
      sentences:[
        ['howare','كيفك؟','כִּיפַכּ?','מה שלומך?'],['coffeeplease','بدي قهوة، لو سمحت.','בַּדִּי קַהְוֶה, לַו סַמַחְת.','אני רוצה קפה, בבקשה.'],['training','عندي تمرين اليوم.','עִנְדִי תַמְרִין אִלְיוֹם.','יש לי אימון היום.'],['home','بروح عالبيت.','בְּרוּח עַלְבֵּית.','אני הולך הביתה.'],['tomorrow','بشوفك بكرة.','בְּשוּפַכּ בֻּכְּרַה.','אראה אותך מחר.']
      ],
      jokes:[
        {title:'קפה של בוקר',lines:[['شو بدك؟','שוּ בַּדַּכּ?','מה אתה רוצה?'],['قهوة... وبعدين منحكي.','קַהְוֶה... וּבַּעְדֵין מְנִחְכִּי.','קפה... ואחר כך נדבר.']]},
        {title:'האימון מתחיל',lines:[['جاهز للتمرين؟','ג׳ַאהֶז לַלְתַמְרִין?','מוכן לאימון?'],['جاهز... بس رجلي مش جاهزة.','ג׳ַאהֶז... בַּס רִגְ׳לִי מִש ג׳ַאהְזֶה.','מוכן... אבל הרגל שלי עוד לא.']]}
      ],
      stories:[
        {title:'בוקר קטן בכפר',lines:[['اليوم بكير.','אִלְיוֹם בַּכִּיר.','היום מוקדם.'],['أنا بروح عالقهوة.','אַנַא בְּרוּח עַלְקַהְוֶה.','אני הולך לקפה.'],['بشوف صاحبي هون.','בְּשוּף סַאחְבִּי הוֹן.','אני רואה כאן את החבר שלי.']],question:'איפה הוא פוגש את החבר?',answer:'בקפה'},
        {title:'לפני משחק',lines:[['عندي تمرين اليوم.','עִנְדִי תַמְרִין אִלְיוֹם.','יש לי אימון היום.'],['فريقنا قوي.','פַרִיקְנַא קַוִי.','הקבוצה שלנו חזקה.'],['بدنا فوز.','בִּדְנַא פוֹז.','אנחנו רוצים ניצחון.']],question:'מה הקבוצה רוצה?',answer:'ניצחון'}
      ],
      dialogues:[
        {title:'בבית קפה',lines:[['مرحبا! شو بدك؟','מַרְחַבַּא! שוּ בַּדַּכּ?','שלום! מה אתה רוצה?'],['بدي قهوة، لو سمحت.','בַּדִּי קַהְוֶה, לַו סַמַחְת.','אני רוצה קפה, בבקשה.'],['أكيد.','אַכִּיד.','בטח.']]}
      ],
      culture:[
        {title:'מילה קטנה, שימוש גדול',body:'„יַאלְלַא” משמשת הרבה מעבר ל־„קדימה” — אפשר לזרז, לעודד, לסיים שיחה או פשוט להניע את הרגע.',phrase:['يلا','יַאלְלַא','קדימה / יאללה']},
        {title:'כבוד בשיחה',body:'„לו סַמַחְת” היא דרך שימושית לרכך בקשה ולהישמע מנומס.',phrase:['لو سمحت','לַו סַמַחְת','בבקשה / סליחה']}
      ]
    },
    it:{
      words:[['hello','ciao','','שלום / ביי'],['coffee','caffè','','קפה'],['friend','amico','','חבר'],['today','oggi','','היום'],['ball','palla','','כדור'],['home','casa','','בית'],['hungry','affamato','','רעב'],['thanks','grazie','','תודה']],
      sentences:[['howare','Come stai?','','מה שלומך?'],['coffeeplease','Vorrei un caffè, per favore.','','אני רוצה קפה, בבקשה.'],['training','Ho allenamento oggi.','','יש לי אימון היום.'],['home','Vado a casa.','','אני הולך הביתה.'],['tomorrow','Ci vediamo domani.','','נתראה מחר.']],
      jokes:[
        {title:'איטלקי בלי קפה?',lines:[['Senza caffè?','','בלי קפה?'],['Non parlo ancora italiano.','','אני עוד לא מדבר איטלקית.']]},
        {title:'אחרי האימון',lines:[['Sei stanco?','','אתה עייף?'],['No, sto solo parlando più lentamente.','','לא, אני פשוט מדבר יותר לאט.']]}
      ],
      stories:[
        {title:'בוקר ברומא',lines:[['Oggi è presto.','','היום מוקדם.'],['Vado al bar.','','אני הולך לבית קפה.'],['Vedo un amico.','','אני רואה חבר.']],question:'את מי הוא רואה?',answer:'חבר'},
        {title:'יום משחק',lines:[['Ho allenamento oggi.','','יש לי אימון היום.'],['La squadra è forte.','','הקבוצה חזקה.'],['Vogliamo vincere.','','אנחנו רוצים לנצח.']],question:'מה הם רוצים?',answer:'לנצח'}
      ],
      dialogues:[{title:'בבית קפה',lines:[['Ciao! Cosa vuoi?','','היי! מה אתה רוצה?'],['Vorrei un caffè, per favore.','','אני רוצה קפה, בבקשה.'],['Subito.','','מיד.']]}],
      culture:[
        {title:'Ciao עושה שתי עבודות',body:'אותה מילה משמשת גם ל„שלום” וגם ל„ביי” בשיחה לא רשמית.',phrase:['ciao','','שלום / ביי']},
        {title:'Bar זה לא תמיד בר',body:'באיטליה bar הוא לעיתים קרובות המקום לקפה מהיר, קורנטו ושיחה קצרה.',phrase:['un caffè','','קפה אחד']}
      ]
    },
    ru:{
      words:[['hello','привет','privet','שלום'],['coffee','кофе','kofe','קפה'],['friend','друг','drug','חבר'],['today','сегодня','segodnya','היום'],['ball','мяч','myach','כדור'],['home','дом','dom','בית'],['hungry','голодный','golodnyy','רעב'],['thanks','спасибо','spasibo','תודה']],
      sentences:[['howare','Как дела?','Kak dela?','מה שלומך?'],['coffeeplease','Кофе, пожалуйста.','Kofe, pozhaluysta.','קפה, בבקשה.'],['training','У меня сегодня тренировка.','U menya segodnya trenirovka.','יש לי אימון היום.'],['home','Я иду домой.','Ya idu domoy.','אני הולך הביתה.'],['tomorrow','Увидимся завтра.','Uvidimsya zavtra.','נתראה מחר.']],
      jokes:[
        {title:'לפני הקפה',lines:[['Как дела?','Kak dela?','מה שלומך?'],['Сначала кофе.','Snachala kofe.','קודם קפה.']]},
        {title:'אחרי אימון',lines:[['Ты устал?','Ty ustal?','אתה עייף?'],['Я просто медленно думаю.','Ya prosto medlenno dumayu.','אני פשוט חושב לאט.']]}
      ],
      stories:[
        {title:'בוקר בעיר',lines:[['Сегодня рано.','Segodnya rano.','היום מוקדם.'],['Я иду за кофе.','Ya idu za kofe.','אני הולך להביא קפה.'],['Там мой друг.','Tam moy drug.','שם החבר שלי.']],question:'מי נמצא שם?',answer:'החבר שלו'},
        {title:'לפני משחק',lines:[['Сегодня тренировка.','Segodnya trenirovka.','היום יש אימון.'],['Команда сильная.','Komanda silnaya.','הקבוצה חזקה.'],['Мы хотим победить.','My khotim pobedit.','אנחנו רוצים לנצח.']],question:'מה הם רוצים לעשות?',answer:'לנצח'}
      ],
      dialogues:[{title:'בבית קפה',lines:[['Привет! Что будешь?','Privet! Chto budesh?','היי! מה תיקח?'],['Кофе, пожалуйста.','Kofe, pozhaluysta.','קפה, בבקשה.'],['Хорошо.','Khorosho.','בסדר.']]}],
      culture:[
        {title:'Привет הוא חברי',body:'Privet מתאים בעיקר לשיחה לא רשמית. במצב רשמי יותר משתמשים ב־zdravstvuyte.',phrase:['привет','privet','שלום']},
        {title:'Спасибо שימושית תמיד',body:'Spasibo היא אחת המילים הראשונות שכדאי להפוך לאוטומטיות.',phrase:['спасибо','spasibo','תודה']}
      ]
    },
    es:{
      words:[['hello','hola','','שלום'],['coffee','café','','קפה'],['friend','amigo','','חבר'],['today','hoy','','היום'],['ball','pelota','','כדור'],['home','casa','','בית'],['hungry','hambriento','','רעב'],['thanks','gracias','','תודה']],
      sentences:[['howare','¿Cómo estás?','','מה שלומך?'],['coffeeplease','Quiero un café, por favor.','','אני רוצה קפה, בבקשה.'],['training','Tengo entrenamiento hoy.','','יש לי אימון היום.'],['home','Voy a casa.','','אני הולך הביתה.'],['tomorrow','Nos vemos mañana.','','נתראה מחר.']],
      jokes:[
        {title:'לפני הקפה',lines:[['¿Cómo estás?','','מה שלומך?'],['Pregúntame después del café.','','תשאל אותי אחרי הקפה.']]},
        {title:'אחרי המשחק',lines:[['¿Estás cansado?','','אתה עייף?'],['No, camino en cámara lenta.','','לא, אני הולך בהילוך איטי.']]}
      ],
      stories:[
        {title:'בוקר קטן',lines:[['Hoy es temprano.','','היום מוקדם.'],['Voy por un café.','','אני הולך להביא קפה.'],['Veo a un amigo.','','אני רואה חבר.']],question:'את מי הוא רואה?',answer:'חבר'},
        {title:'לפני משחק',lines:[['Tengo entrenamiento hoy.','','יש לי אימון היום.'],['El equipo es fuerte.','','הקבוצה חזקה.'],['Queremos ganar.','','אנחנו רוצים לנצח.']],question:'מה הם רוצים?',answer:'לנצח'}
      ],
      dialogues:[{title:'בבית קפה',lines:[['¡Hola! ¿Qué quieres?','','היי! מה אתה רוצה?'],['Quiero un café, por favor.','','אני רוצה קפה, בבקשה.'],['Claro.','','בטח.']]}],
      culture:[
        {title:'Hola לכל שעה',body:'Hola מתאימה כברכת שלום כללית; אפשר לצרף buenos días או buenas tardes לפי השעה.',phrase:['hola','','שלום']},
        {title:'Por favor',body:'הביטוי הקטן הזה עושה כמעט כל בקשה טבעית ומנומסת יותר.',phrase:['por favor','','בבקשה']}
      ]
    }
  };

  const TYPE_ORDER=['word','sentence','joke','story','dialogue','challenge','culture','word','sentence','story','challenge','culture'];
  const GAME_TYPES=['flashcards','memory','matching','sentence-builder','recall','speed','four-languages'];

  function hash(text){let h=2166136261;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function pick(list,n){return list[n%list.length];}
  function wordObject(lang,row){return {lang,id:row[0],target:row[1],pron:row[2]||'',he:row[3]};}
  function sentenceObject(lang,row){return {lang,id:row[0],target:row[1],pron:row[2]||'',he:row[3]};}
  function getDisplay(item){
    const primary=(item.lang==='ar'||item.lang==='ru')?(item.pron||item.target):item.target;
    const secondary=(item.lang==='ar'||item.lang==='ru')?item.target:'';
    return {primary,secondary,translation:item.he||''};
  }
  function makeChallenge(lang,index,seed){
    const rows=BANK[lang].words;
    const correct=wordObject(lang,pick(rows,index+seed));
    const alternatives=[];
    for(let i=1;i<rows.length&&alternatives.length<3;i++){
      const candidate=wordObject(lang,pick(rows,index+seed+i));
      if(candidate.id!==correct.id)alternatives.push(candidate);
    }
    const options=[correct,...alternatives].sort((a,b)=>hash(seed+a.id)-hash(seed+b.id));
    return {correct,options,prompt:'מה פירוש המילה?'};
  }
  function buildCard(lang,type,index,seed){
    const data=BANK[lang];
    const variant=hash(seed+':'+lang+':'+type+':'+index);
    const base={lang,type,id:[seed,lang,type,index,variant%97].join('-')};
    if(type==='word')return {...base,item:wordObject(lang,pick(data.words,variant))};
    if(type==='sentence')return {...base,item:sentenceObject(lang,pick(data.sentences,variant))};
    if(type==='joke')return {...base,...pick(data.jokes,variant)};
    if(type==='story')return {...base,...pick(data.stories,variant)};
    if(type==='dialogue')return {...base,...pick(data.dialogues,variant)};
    if(type==='culture')return {...base,...pick(data.culture,variant)};
    if(type==='challenge')return {...base,...makeChallenge(lang,index,variant)};
    return {...base,item:wordObject(lang,pick(data.words,variant))};
  }
  function buildFeed({filter='all',seed='feed',count=12}={}){
    const safeCount=Math.max(1,Math.min(60,Number(count)||12));
    const only=LANGUAGE_CODES.includes(filter)?filter:null;
    const langShift=hash(seed)%LANGUAGE_CODES.length;
    const typeShift=hash(seed+':types')%TYPE_ORDER.length;
    const cards=[];
    for(let i=0;i<safeCount;i++){
      const lang=only||LANGUAGE_CODES[(i+langShift)%LANGUAGE_CODES.length];
      const type=TYPE_ORDER[(i+typeShift)%TYPE_ORDER.length];
      cards.push(buildCard(lang,type,i,seed));
    }
    return cards;
  }

  function shuffle(list,seed){
    return list.slice().map((value,index)=>({value,key:hash(`${seed}:${index}:${value.id||value}`)})).sort((a,b)=>a.key-b.key).map(x=>x.value);
  }
  function wordItemsFor(filter,seed,count=6){
    const only=LANGUAGE_CODES.includes(filter)?filter:null;
    if(only)return shuffle(BANK[only].words.map(row=>wordObject(only,row)),seed).slice(0,count);
    const all=[];
    LANGUAGE_CODES.forEach(lang=>BANK[lang].words.forEach(row=>all.push(wordObject(lang,row))));
    return shuffle(all,seed).slice(0,count);
  }
  function buildMiniGame({type='flashcards',filter='all',seed='game'}={}){
    const safeType=GAME_TYPES.includes(type)?type:'flashcards';
    const only=LANGUAGE_CODES.includes(filter)?filter:null;
    const chosenLang=only||LANGUAGE_CODES[hash(seed)%LANGUAGE_CODES.length];
    const id=`game:${safeType}:${filter}:${hash(seed)}`;

    if(safeType==='four-languages'){
      const concepts=['hello','coffee','friend','today','ball','home','hungry','thanks'];
      const concept=pick(concepts,hash(seed+':concept'));
      const items=LANGUAGE_CODES.map(lang=>wordObject(lang,BANK[lang].words.find(row=>row[0]===concept)||BANK[lang].words[0]));
      return {id,type:safeType,lang:'all',concept,items,prompt:items[0].he};
    }

    if(safeType==='sentence-builder'){
      const row=pick(BANK[chosenLang].sentences,hash(seed+':sentence'));
      const sentence=sentenceObject(chosenLang,row);
      const display=getDisplay(sentence);
      const answer=display.primary.split(/\s+/).filter(Boolean);
      return {id,type:safeType,lang:chosenLang,sentence,answer,words:shuffle(answer,seed+':words')};
    }

    const items=wordItemsFor(only||'all',seed+':items',safeType==='memory'?4:6);
    return {id,type:safeType,lang:only||'all',items,prompt:safeType==='recall'?'זכור את המילים ואז בדוק את עצמך':''};
  }

  return {LANGUAGE_CODES,LANGUAGES,BANK,TYPE_ORDER,GAME_TYPES,getDisplay,buildFeed,buildMiniGame};
});
