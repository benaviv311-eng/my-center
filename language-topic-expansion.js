(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{
    root.LanguageTopicExpansion=api;
    if(root.LanguageCore)api.applyTo(root.LanguageCore);
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const TOPIC_META={
    verbs:{name:'פעלים שימושיים',icon:'⚡',description:'ללכת, לבוא, לראות, לדבר, לאכול ולפעול ביום יום'},
    adjectives:{name:'תארים',icon:'✨',description:'גדול, קטן, מהיר, יפה ומילים שמתארות אנשים ודברים'},
    cinema:{name:'קולנוע וסרטים',icon:'🎬',description:'סרטים, שחקנים, במאים, סצנות וכרטיסים'},
    music:{name:'מוזיקה',icon:'🎵',description:'שירים, זמרים, כלי נגינה, הופעות וקצב'},
    school:{name:'לימודים ובית ספר',icon:'🎓',description:'מורה, תלמיד, שיעור, ספר, שאלה ולמידה'},
    work:{name:'עבודה',icon:'💼',description:'משרד, פגישה, משימה, מנהל ויום עבודה'},
    shopping:{name:'קניות',icon:'🛍️',description:'מחיר, כסף, מידה, לקנות ולמכור'},
    travel:{name:'טיולים ונסיעות',icon:'✈️',description:'עיר, מלון, שדה תעופה, דרכון וחופשה'},
    home:{name:'בית וחפצים',icon:'🏠',description:'חדרים, רהיטים וחפצים שימושיים בבית'},
    health:{name:'גוף ובריאות',icon:'🩺',description:'רופא, כאב, חלקי גוף והרגשה גופנית'},
    emotions:{name:'רגשות',icon:'❤️',description:'שמח, עצוב, כועס, מפחד, רגוע ומתגעגע'},
    weather:{name:'מזג אוויר',icon:'☀️',description:'שמש, גשם, רוח, חום, קור ומזג האוויר'},
    technology:{name:'טכנולוגיה',icon:'📱',description:'טלפון, מחשב, אינטרנט, הודעות, תמונות וסיסמאות'},
    colors:{name:'צבעים',icon:'🎨',description:'צבעים בסיסיים ושימוש בהם במשפטים'},
    numbers:{name:'מספרים',icon:'🔢',description:'מספרים בסיסיים, כמויות ומחירים'}
  };

  const DATA={
    verbs:{
      words:[
        {id:'go',he:'ללכת',ar:['يروح','יְרוּח'],it:['andare',''],ru:['идти','idti'],es:['ir','']},
        {id:'come',he:'לבוא',ar:['ييجي','יִיג׳י'],it:['venire',''],ru:['приходить','prikhodit'],es:['venir','']},
        {id:'see',he:'לראות',ar:['يشوف','יְשוּף'],it:['vedere',''],ru:['видеть','videt'],es:['ver','']},
        {id:'speak',he:'לדבר',ar:['يحكي','יִחְכִּי'],it:['parlare',''],ru:['говорить','govorit'],es:['hablar','']},
        {id:'eat',he:'לאכול',ar:['ياكل','יַאכֹּל'],it:['mangiare',''],ru:['есть','yest'],es:['comer','']},
        {id:'drink',he:'לשתות',ar:['يشرب','יִשְרַבּ'],it:['bere',''],ru:['пить','pit'],es:['beber','']},
        {id:'want',he:'לרצות',ar:['بدو','בִּדּו'],it:['volere',''],ru:['хотеть','khotet'],es:['querer','']},
        {id:'know',he:'לדעת',ar:['يعرف','יַעְרַף'],it:['sapere',''],ru:['знать','znat'],es:['saber','']}
      ],
      sentences:[
        {id:'wantgo',he:'אני רוצה ללכת הביתה.',situation:'כשאתה רוצה לחזור הביתה.',ar:['بدي أروح عالبيت.','בַּדִּי אַרוּח עַלְבֵּית.'],it:['Voglio andare a casa.',''],ru:['Я хочу идти домой.','Ya khochu idti domoy.'],es:['Quiero ir a casa.','']},
        {id:'comehere',he:'בוא לכאן, בבקשה.',situation:'קוראים למישהו להתקרב.',ar:['تعال هون، لو سمحت.','תַעַאל הוֹן, לַו סַמַחְת.'],it:['Vieni qui, per favore.',''],ru:['Иди сюда, пожалуйста.','Idi syuda, pozhaluysta.'],es:['Ven aquí, por favor.','']},
        {id:'seefriend',he:'אני רואה את החבר שלי.',situation:'מספרים את מי רואים.',ar:['بشوف صاحبي.','בְּשוּף סַאחְבִּי.'],it:['Vedo il mio amico.',''],ru:['Я вижу моего друга.','Ya vizhu moyego druga.'],es:['Veo a mi amigo.','']},
        {id:'speaklater',he:'אנחנו מדברים אחרי האימון.',situation:'קובעים לדבר מאוחר יותר.',ar:['منحكي بعد التمرين.','מְנִחְכִּי בַּעְד אֶ־תַמְרִין.'],it:['Parliamo dopo l’allenamento.',''],ru:['Мы говорим после тренировки.','My govorim posle trenirovki.'],es:['Hablamos después del entrenamiento.','']}
      ]
    },
    adjectives:{
      words:[
        {id:'big',he:'גדול',ar:['كبير','כְּבִּיר'],it:['grande',''],ru:['большой','bolshoy'],es:['grande','']},
        {id:'small',he:'קטן',ar:['صغير','זְעִ׳יר'],it:['piccolo',''],ru:['маленький','malenkiy'],es:['pequeño','']},
        {id:'good',he:'טוב',ar:['منيح','מְנִיח'],it:['buono',''],ru:['хороший','khoroshiy'],es:['bueno','']},
        {id:'bad',he:'רע',ar:['سيئ','סַיֶּא'],it:['cattivo',''],ru:['плохой','plokhoy'],es:['malo','']},
        {id:'fast',he:'מהיר',ar:['سريع','סַרִיע'],it:['veloce',''],ru:['быстрый','bystryy'],es:['rápido','']},
        {id:'slow',he:'איטי',ar:['بطيء','בַּטִי'],it:['lento',''],ru:['медленный','medlennyy'],es:['lento','']},
        {id:'beautiful',he:'יפה',ar:['حلو','חִלוּ'],it:['bello',''],ru:['красивый','krasivyy'],es:['bonito','']},
        {id:'interesting',he:'מעניין',ar:['ممتع','מֻמְתִע'],it:['interessante',''],ru:['интересный','interesnyy'],es:['interesante','']}
      ],
      sentences:[
        {id:'bighouse',he:'הבית גדול.',situation:'מתארים בית.',ar:['البيت كبير.','אֶל־בֵּית כְּבִּיר.'],it:['La casa è grande.',''],ru:['Дом большой.','Dom bolshoy.'],es:['La casa es grande.','']},
        {id:'smallbag',he:'התיק קטן.',situation:'מתארים תיק.',ar:['الشنطة صغيرة.','אֶ־שַנְטַה זְעִ׳ירַה.'],it:['La borsa è piccola.',''],ru:['Сумка маленькая.','Sumka malenkaya.'],es:['La bolsa es pequeña.','']},
        {id:'interestingmovie',he:'הסרט מעניין.',situation:'מדברים על סרט.',ar:['الفيلم ممتع.','אֶל־פִילֶם מֻמְתִע.'],it:['Il film è interessante.',''],ru:['Фильм интересный.','Film interesnyy.'],es:['La película es interesante.','']},
        {id:'fastcar',he:'המכונית מהירה.',situation:'מתארים מכונית.',ar:['السيارة سريعة.','אֶ־סַיַּארַה סַרִיעַה.'],it:['La macchina è veloce.',''],ru:['Машина быстрая.','Mashina bystraya.'],es:['El coche es rápido.','']}
      ]
    },
    cinema:{
      words:[
        {id:'movie',he:'סרט',ar:['فيلم','פִילֶם'],it:['film',''],ru:['фильм','film'],es:['película','']},
        {id:'cinema',he:'קולנוע',ar:['سينما','סִינֶמַא'],it:['cinema',''],ru:['кинотеатр','kinoteatr'],es:['cine','']},
        {id:'actor',he:'שחקן',ar:['ممثل','מֻמַתִּ׳ל'],it:['attore',''],ru:['актёр','aktyor'],es:['actor','']},
        {id:'director',he:'במאי',ar:['مخرج','מֻחְרִג׳'],it:['regista',''],ru:['режиссёр','rezhissyor'],es:['director','']},
        {id:'scene',he:'סצנה',ar:['مشهد','מַשְהַד'],it:['scena',''],ru:['сцена','stsena'],es:['escena','']},
        {id:'story',he:'עלילה / סיפור',ar:['قصة','קִסַּה'],it:['storia',''],ru:['сюжет','syuzhet'],es:['historia','']},
        {id:'ticket',he:'כרטיס',ar:['تذكرة','תַדְ׳כַּרַה'],it:['biglietto',''],ru:['билет','bilet'],es:['entrada','']},
        {id:'screen',he:'מסך',ar:['شاشة','שַאשַה'],it:['schermo',''],ru:['экран','ekran'],es:['pantalla','']}
      ],
      sentences:[
        {id:'seemovie',he:'אני רוצה לראות סרט הערב.',situation:'מתכננים ערב קולנוע.',ar:['بدي أشوف فيلم الليلة.','בַּדִּי אַשוּף פִילֶם אֶל־לֵילֶה.'],it:['Voglio vedere un film stasera.',''],ru:['Я хочу посмотреть фильм сегодня вечером.','Ya khochu posmotret film segodnya vecherom.'],es:['Quiero ver una película esta noche.','']},
        {id:'goodactor',he:'השחקן טוב מאוד.',situation:'מדברים על משחק בסרט.',ar:['الممثل منيح كتير.','אֶל־מֻמַתִּ׳ל מְנִיח כְּתִיר.'],it:['L’attore è molto bravo.',''],ru:['Актёр очень хороший.','Aktyor ochen khoroshiy.'],es:['El actor es muy bueno.','']},
        {id:'boughticket',he:'קניתי כרטיס.',situation:'אחרי רכישת כרטיס.',ar:['اشتريت تذكرة.','אִשְתַרֵית תַדְ׳כַּרַה.'],it:['Ho comprato un biglietto.',''],ru:['Я купил билет.','Ya kupil bilet.'],es:['Compré una entrada.','']},
        {id:'scenegood',he:'הסצנה הזאת מעניינת.',situation:'מדברים על סצנה.',ar:['هالمشهد ممتع.','הַל־מַשְהַד מֻמְתִע.'],it:['Questa scena è interessante.',''],ru:['Эта сцена интересная.','Eta stsena interesnaya.'],es:['Esta escena es interesante.','']}
      ]
    },
    music:{
      words:[
        {id:'music',he:'מוזיקה',ar:['موسيقى','מוּסִיקַא'],it:['musica',''],ru:['музыка','muzyka'],es:['música','']},
        {id:'song',he:'שיר',ar:['أغنية','אֻע׳נִיֶה'],it:['canzone',''],ru:['песня','pesnya'],es:['canción','']},
        {id:'singer',he:'זמר',ar:['مغني','מֻעַ׳נִּי'],it:['cantante',''],ru:['певец','pevets'],es:['cantante','']},
        {id:'guitar',he:'גיטרה',ar:['غيتار','ע׳ִיתַאר'],it:['chitarra',''],ru:['гитара','gitara'],es:['guitarra','']},
        {id:'rhythm',he:'קצב',ar:['إيقاع','אִיקַאע'],it:['ritmo',''],ru:['ритм','ritm'],es:['ritmo','']},
        {id:'listen',he:'להקשיב',ar:['يسمع','יִסְמַע'],it:['ascoltare',''],ru:['слушать','slushat'],es:['escuchar','']},
        {id:'playmusic',he:'לנגן',ar:['يعزف','יַעְזֶף'],it:['suonare',''],ru:['играть','igrat'],es:['tocar','']},
        {id:'concert',he:'הופעה',ar:['حفلة','חַפְלֶה'],it:['concerto',''],ru:['концерт','kontsert'],es:['concierto','']}
      ],
      sentences:[
        {id:'listenmusic',he:'אני מקשיב למוזיקה כל יום.',situation:'מדברים על הרגל קבוע.',ar:['بسمع موسيقى كل يوم.','בַּסְמַע מוּסִיקַא כֻּל יוֹם.'],it:['Ascolto musica ogni giorno.',''],ru:['Я слушаю музыку каждый день.','Ya slushayu muzyku kazhdyy den.'],es:['Escucho música todos los días.','']},
        {id:'playguitar',he:'הוא מנגן בגיטרה.',situation:'מתארים מוזיקאי.',ar:['هو بعزف غيتار.','הוּ בִּעְזֶף ע׳ִיתַאר.'],it:['Lui suona la chitarra.',''],ru:['Он играет на гитаре.','On igraet na gitare.'],es:['Él toca la guitarra.','']},
        {id:'beautifulsong',he:'השיר הזה יפה.',situation:'מדברים על שיר.',ar:['هاي الأغنية حلوة.','הַאי אֶל־אֻע׳נִיֶה חִלְוֶה.'],it:['Questa canzone è bella.',''],ru:['Эта песня красивая.','Eta pesnya krasivaya.'],es:['Esta canción es bonita.','']},
        {id:'concerttonight',he:'אנחנו הולכים להופעה הערב.',situation:'קובעים יציאה.',ar:['إحنا رايحين عحفلة الليلة.','אִחְנַא רַאיְחִין עַחַפְלֶה אֶל־לֵילֶה.'],it:['Andiamo a un concerto stasera.',''],ru:['Мы идём на концерт сегодня вечером.','My idyom na kontsert segodnya vecherom.'],es:['Vamos a un concierto esta noche.','']}
      ]
    },
    school:{
      words:[
        {id:'school',he:'בית ספר',ar:['مدرسة','מַדְרַסֶה'],it:['scuola',''],ru:['школа','shkola'],es:['escuela','']},
        {id:'teacher',he:'מורה',ar:['معلم','מֻעַלֶּם'],it:['insegnante',''],ru:['учитель','uchitel'],es:['profesor','']},
        {id:'student',he:'תלמיד',ar:['طالب','טַאלֶבּ'],it:['studente',''],ru:['ученик','uchenik'],es:['estudiante','']},
        {id:'class',he:'שיעור / כיתה',ar:['صف','סַף'],it:['lezione',''],ru:['урок','urok'],es:['clase','']},
        {id:'book',he:'ספר',ar:['كتاب','כִּתַאבּ'],it:['libro',''],ru:['книга','kniga'],es:['libro','']},
        {id:'question',he:'שאלה',ar:['سؤال','סֻאַאל'],it:['domanda',''],ru:['вопрос','vopros'],es:['pregunta','']},
        {id:'answer',he:'תשובה',ar:['جواب','ג׳ַוַאבּ'],it:['risposta',''],ru:['ответ','otvet'],es:['respuesta','']},
        {id:'learn',he:'ללמוד',ar:['يتعلم','יִתְעַלַּם'],it:['imparare',''],ru:['учиться','uchitsya'],es:['aprender','']}
      ],
      sentences:[
        {id:'teacherquestion',he:'המורה שואל שאלה.',situation:'בשיעור.',ar:['المعلم بسأل سؤال.','אֶל־מֻעַלֶּם בִּסְאַל סֻאַאל.'],it:['L’insegnante fa una domanda.',''],ru:['Учитель задаёт вопрос.','Uchitel zadayot vopros.'],es:['El profesor hace una pregunta.','']},
        {id:'studentbook',he:'התלמיד קורא ספר.',situation:'מתארים תלמיד.',ar:['الطالب بقرأ كتاب.','אֶ־טַאלֶבּ בִּקְרַא כִּתַאבּ.'],it:['Lo studente legge un libro.',''],ru:['Ученик читает книгу.','Uchenik chitayet knigu.'],es:['El estudiante lee un libro.','']},
        {id:'learnword',he:'אני לומד מילה חדשה.',situation:'בלימוד שפה.',ar:['بتعلم كلمة جديدة.','בִּתְעַלַּם כִּלְמֶה ג׳ְדִידֶה.'],it:['Imparo una parola nuova.',''],ru:['Я учу новое слово.','Ya uchu novoye slovo.'],es:['Aprendo una palabra nueva.','']},
        {id:'correctanswer',he:'התשובה נכונה.',situation:'בודקים תרגיל.',ar:['الجواب صح.','אֶל־ג׳ַוַאבּ סַח.'],it:['La risposta è corretta.',''],ru:['Ответ правильный.','Otvet pravilnyy.'],es:['La respuesta es correcta.','']}
      ]
    },
    work:{
      words:[
        {id:'work',he:'עבודה',ar:['شغل','שֻע׳ְל'],it:['lavoro',''],ru:['работа','rabota'],es:['trabajo','']},
        {id:'office',he:'משרד',ar:['مكتب','מַכְּתַבּ'],it:['ufficio',''],ru:['офис','ofis'],es:['oficina','']},
        {id:'meeting',he:'פגישה',ar:['اجتماع','אִג׳ְתִמַאע'],it:['riunione',''],ru:['встреча','vstrecha'],es:['reunión','']},
        {id:'manager',he:'מנהל',ar:['مدير','מֻדִיר'],it:['responsabile',''],ru:['менеджер','menedzher'],es:['gerente','']},
        {id:'colleague',he:'עמית לעבודה',ar:['زميل','זַמִיל'],it:['collega',''],ru:['коллега','kollega'],es:['colega','']},
        {id:'task',he:'משימה',ar:['مهمة','מֻהִמֶּה'],it:['compito',''],ru:['задача','zadacha'],es:['tarea','']},
        {id:'start',he:'להתחיל',ar:['يبدأ','יִבְּדַא'],it:['iniziare',''],ru:['начинать','nachinat'],es:['empezar','']},
        {id:'finish',he:'לסיים',ar:['يخلص','יִחַלֶּס'],it:['finire',''],ru:['заканчивать','zakanchivat'],es:['terminar','']}
      ],
      sentences:[
        {id:'worktoday',he:'יש לי עבודה היום.',situation:'מדברים על היום.',ar:['عندي شغل اليوم.','עִנְדִי שֻע׳ְל אִלְיוֹם.'],it:['Ho lavoro oggi.',''],ru:['У меня сегодня работа.','U menya segodnya rabota.'],es:['Tengo trabajo hoy.','']},
        {id:'meetingten',he:'הפגישה מתחילה בעשר.',situation:'קובעים שעה.',ar:['الاجتماع ببلش الساعة عشرة.','אֶל־אִג׳ְתִמַאע בִּבַּלֵּש אֶ־סַאעַה עַשַרַה.'],it:['La riunione inizia alle dieci.',''],ru:['Встреча начинается в десять.','Vstrecha nachinayetsya v desyat.'],es:['La reunión empieza a las diez.','']},
        {id:'colleagueoffice',he:'העמית שלי במשרד.',situation:'אומרים איפה מישהו.',ar:['زميلي بالمكتب.','זַמִילִי בַּלְמַכְּתַבּ.'],it:['Il mio collega è in ufficio.',''],ru:['Мой коллега в офисе.','Moy kollega v ofise.'],es:['Mi colega está en la oficina.','']},
        {id:'finishtask',he:'אני מסיים את המשימה היום.',situation:'מדברים על משימה.',ar:['بخلص المهمة اليوم.','בְּחַלֶּס אֶל־מֻהִמֶּה אִלְיוֹם.'],it:['Finisco il compito oggi.',''],ru:['Я заканчиваю задачу сегодня.','Ya zakanchivayu zadachu segodnya.'],es:['Termino la tarea hoy.','']}
      ]
    },
    shopping:{
      words:[
        {id:'shop',he:'חנות',ar:['محل','מַחַל'],it:['negozio',''],ru:['магазин','magazin'],es:['tienda','']},
        {id:'price',he:'מחיר',ar:['سعر','סִעֶר'],it:['prezzo',''],ru:['цена','tsena'],es:['precio','']},
        {id:'money',he:'כסף',ar:['مصاري','מַסַארִי'],it:['soldi',''],ru:['деньги','dengi'],es:['dinero','']},
        {id:'cheap',he:'זול',ar:['رخيص','רְחִיס'],it:['economico',''],ru:['дешёвый','deshyovyy'],es:['barato','']},
        {id:'expensive',he:'יקר',ar:['غالي','ע׳ַאלִי'],it:['caro',''],ru:['дорогой','dorogoy'],es:['caro','']},
        {id:'buy',he:'לקנות',ar:['يشتري','יִשְתַרִי'],it:['comprare',''],ru:['покупать','pokupat'],es:['comprar','']},
        {id:'sell',he:'למכור',ar:['يبيع','יִבִּיע'],it:['vendere',''],ru:['продавать','prodavat'],es:['vender','']},
        {id:'size',he:'מידה',ar:['مقاس','מִקַאס'],it:['taglia',''],ru:['размер','razmer'],es:['talla','']}
      ],
      sentences:[
        {id:'howmuch',he:'כמה זה עולה?',situation:'שואלים מחיר.',ar:['قديش هاد؟','קַדֵּיש הַאד?'],it:['Quanto costa?',''],ru:['Сколько это стоит?','Skolko eto stoit?'],es:['¿Cuánto cuesta?','']},
        {id:'tooexpensive',he:'זה יקר מדי.',situation:'מגיבים למחיר.',ar:['هاد غالي كتير.','הַאד ע׳ַאלִי כְּתִיר.'],it:['È troppo caro.',''],ru:['Это слишком дорого.','Eto slishkom dorogo.'],es:['Es demasiado caro.','']},
        {id:'buythis',he:'אני רוצה לקנות את זה.',situation:'בחנות.',ar:['بدي أشتري هاد.','בַּדִּי אַשְתַרִי הַאד.'],it:['Voglio comprare questo.',''],ru:['Я хочу купить это.','Ya khochu kupit eto.'],es:['Quiero comprar esto.','']},
        {id:'mysize',he:'יש לכם את המידה שלי?',situation:'מחפשים בגד.',ar:['عندكم مقاسي؟','עִנְדְכֹּם מִקַאסִי?'],it:['Avete la mia taglia?',''],ru:['У вас есть мой размер?','U vas yest moy razmer?'],es:['¿Tienen mi talla?','']}
      ]
    },
    travel:{
      words:[
        {id:'trip',he:'טיול / נסיעה',ar:['رحلة','רִחְלֶה'],it:['viaggio',''],ru:['поездка','poyezdka'],es:['viaje','']},
        {id:'country',he:'מדינה',ar:['بلد','בַּלַד'],it:['paese',''],ru:['страна','strana'],es:['país','']},
        {id:'city',he:'עיר',ar:['مدينة','מַדִינֶה'],it:['città',''],ru:['город','gorod'],es:['ciudad','']},
        {id:'hotel',he:'מלון',ar:['فندق','פֻנְדֻק'],it:['hotel',''],ru:['отель','otel'],es:['hotel','']},
        {id:'airport',he:'שדה תעופה',ar:['مطار','מַטַאר'],it:['aeroporto',''],ru:['аэропорт','aeroport'],es:['aeropuerto','']},
        {id:'passport',he:'דרכון',ar:['جواز سفر','ג׳ַוַאז סַפַר'],it:['passaporto',''],ru:['паспорт','pasport'],es:['pasaporte','']},
        {id:'suitcase',he:'מזוודה',ar:['شنطة سفر','שַנְטַת סַפַר'],it:['valigia',''],ru:['чемодан','chemodan'],es:['maleta','']},
        {id:'vacation',he:'חופשה',ar:['عطلة','עֻטְלֶה'],it:['vacanza',''],ru:['отпуск','otpusk'],es:['vacaciones','']}
      ],
      sentences:[
        {id:'newcity',he:'אני נוסע לעיר חדשה.',situation:'מספרים על טיול.',ar:['بسافر لمدينة جديدة.','בְּסַאפֶר לְמַדִינֶה ג׳ְדִידֶה.'],it:['Viaggio in una città nuova.',''],ru:['Я еду в новый город.','Ya yedu v novyy gorod.'],es:['Viajo a una ciudad nueva.','']},
        {id:'hotelairport',he:'המלון קרוב לשדה התעופה.',situation:'בודקים מיקום.',ar:['الفندق قريب من المطار.','אֶל־פֻנְדֻק קַרִיבּ מִן אֶל־מַטַאר.'],it:['L’hotel è vicino all’aeroporto.',''],ru:['Отель рядом с аэропортом.','Otel ryadom s aeroportom.'],es:['El hotel está cerca del aeropuerto.','']},
        {id:'wherepassport',he:'איפה הדרכון שלי?',situation:'מחפשים מסמך.',ar:['وين جواز سفري؟','וֵין ג׳ַוַאז סַפַרִי?'],it:['Dov’è il mio passaporto?',''],ru:['Где мой паспорт?','Gde moy pasport?'],es:['¿Dónde está mi pasaporte?','']},
        {id:'onvacation',he:'אנחנו בחופשה.',situation:'מספרים על הנסיעה.',ar:['إحنا بعطلة.','אִחְנַא בְּעֻטְלֶה.'],it:['Siamo in vacanza.',''],ru:['Мы в отпуске.','My v otpuske.'],es:['Estamos de vacaciones.','']}
      ]
    },
    home:{
      words:[
        {id:'room',he:'חדר',ar:['غرفة','עֻ׳רְפֶה'],it:['stanza',''],ru:['комната','komnata'],es:['habitación','']},
        {id:'kitchen',he:'מטבח',ar:['مطبخ','מַטְבַּח'],it:['cucina',''],ru:['кухня','kukhnya'],es:['cocina','']},
        {id:'table',he:'שולחן',ar:['طاولة','טַאוְלֶה'],it:['tavolo',''],ru:['стол','stol'],es:['mesa','']},
        {id:'chair',he:'כיסא',ar:['كرسي','כֻּרְסִי'],it:['sedia',''],ru:['стул','stul'],es:['silla','']},
        {id:'door',he:'דלת',ar:['باب','בַּאבּ'],it:['porta',''],ru:['дверь','dver'],es:['puerta','']},
        {id:'window',he:'חלון',ar:['شباك','שֻבַּאכּ'],it:['finestra',''],ru:['окно','okno'],es:['ventana','']},
        {id:'bed',he:'מיטה',ar:['تخت','תַחְת'],it:['letto',''],ru:['кровать','krovat'],es:['cama','']},
        {id:'key',he:'מפתח',ar:['مفتاح','מִפְתַאח'],it:['chiave',''],ru:['ключ','klyuch'],es:['llave','']}
      ],
      sentences:[
        {id:'keytable',he:'המפתח על השולחן.',situation:'מחפשים מפתח.',ar:['المفتاح عالطاولة.','אֶל־מִפְתַאח עַל־טַאוְלֶה.'],it:['La chiave è sul tavolo.',''],ru:['Ключ на столе.','Klyuch na stole.'],es:['La llave está sobre la mesa.','']},
        {id:'windowopen',he:'החלון פתוח.',situation:'מתארים את החדר.',ar:['الشباك مفتوح.','אֶ־שֻבַּאכּ מַפְתוּח.'],it:['La finestra è aperta.',''],ru:['Окно открыто.','Okno otkryto.'],es:['La ventana está abierta.','']},
        {id:'inkitchen',he:'אני במטבח.',situation:'אומרים איפה נמצאים.',ar:['أنا بالمطبخ.','אַנַא בַּלְמַטְבַּח.'],it:['Sono in cucina.',''],ru:['Я на кухне.','Ya na kukhne.'],es:['Estoy en la cocina.','']},
        {id:'bedroom',he:'המיטה בחדר.',situation:'מתארים את הבית.',ar:['التخت بالغرفة.','אֶ־תַחְת בַּלְעֻ׳רְפֶה.'],it:['Il letto è nella stanza.',''],ru:['Кровать в комнате.','Krovat v komnate.'],es:['La cama está en la habitación.','']}
      ]
    },
    health:{
      words:[
        {id:'doctor',he:'רופא',ar:['دكتور','דֻכְּתוֹר'],it:['medico',''],ru:['врач','vrach'],es:['médico','']},
        {id:'pain',he:'כאב',ar:['وجع','וַגַ׳ע'],it:['dolore',''],ru:['боль','bol'],es:['dolor','']},
        {id:'head',he:'ראש',ar:['راس','רַאס'],it:['testa',''],ru:['голова','golova'],es:['cabeza','']},
        {id:'hand',he:'יד',ar:['إيد','אִיד'],it:['mano',''],ru:['рука','ruka'],es:['mano','']},
        {id:'leg',he:'רגל',ar:['رجل','רִגֶ׳ל'],it:['gamba',''],ru:['нога','noga'],es:['pierna','']},
        {id:'tired',he:'עייף',ar:['تعبان','תַעְבַּאן'],it:['stanco',''],ru:['уставший','ustavshiy'],es:['cansado','']},
        {id:'sick',he:'חולה',ar:['مريض','מַרִיד'],it:['malato',''],ru:['больной','bolnoy'],es:['enfermo','']},
        {id:'healthy',he:'בריא',ar:['صحي','סִחִּי'],it:['sano',''],ru:['здоровый','zdorovyy'],es:['sano','']}
      ],
      sentences:[
        {id:'headhurts',he:'כואב לי הראש.',situation:'מתארים כאב.',ar:['راسي بوجعني.','רַאסִי בִּוַגַ׳עְנִי.'],it:['Mi fa male la testa.',''],ru:['У меня болит голова.','U menya bolit golova.'],es:['Me duele la cabeza.','']},
        {id:'tiredtoday',he:'אני עייף היום.',situation:'מספרים איך מרגישים.',ar:['أنا تعبان اليوم.','אַנַא תַעְבַּאן אִלְיוֹם.'],it:['Sono stanco oggi.',''],ru:['Я сегодня устал.','Ya segodnya ustal.'],es:['Estoy cansado hoy.','']},
        {id:'needdoctor',he:'אני צריך רופא.',situation:'מבקשים עזרה רפואית.',ar:['بدي دكتور.','בַּדִּי דֻכְּתוֹר.'],it:['Ho bisogno di un medico.',''],ru:['Мне нужен врач.','Mne nuzhen vrach.'],es:['Necesito un médico.','']},
        {id:'feelhealthy',he:'עכשיו אני מרגיש בריא.',situation:'אחרי שמרגישים טוב יותר.',ar:['هسا حاسس حالي منيح.','הַסַּא חַאסֶס חַאלִי מְנִיח.'],it:['Adesso mi sento bene.',''],ru:['Сейчас я чувствую себя хорошо.','Seychas ya chuvstvuyu sebya khorosho.'],es:['Ahora me siento bien.','']}
      ]
    },
    emotions:{
      words:[
        {id:'happy',he:'שמח',ar:['مبسوط','מַבְּסוּט'],it:['felice',''],ru:['счастливый','schastlivyy'],es:['feliz','']},
        {id:'sad',he:'עצוב',ar:['زعلان','זַעְלַאן'],it:['triste',''],ru:['грустный','grustnyy'],es:['triste','']},
        {id:'angry',he:'כועס',ar:['معصب','מְעַסַּבּ'],it:['arrabbiato',''],ru:['злой','zloy'],es:['enojado','']},
        {id:'afraid',he:'מפחד',ar:['خايف','חַ׳איֶף'],it:['spaventato',''],ru:['испуганный','ispugannyy'],es:['asustado','']},
        {id:'calm',he:'רגוע',ar:['هادي','הַאדִי'],it:['calmo',''],ru:['спокойный','spokoynyy'],es:['tranquilo','']},
        {id:'excited',he:'נרגש',ar:['متحمس','מְתַחַמֶּס'],it:['entusiasta',''],ru:['взволнованный','vzvolnovannyy'],es:['emocionado','']},
        {id:'love',he:'אהבה',ar:['حب','חֻבּ'],it:['amore',''],ru:['любовь','lyubov'],es:['amor','']},
        {id:'miss',he:'להתגעגע',ar:['مشتاق','מֻשְתַאק'],it:['sentire la mancanza',''],ru:['скучать','skuchat'],es:['extrañar','']}
      ],
      sentences:[
        {id:'happytoday',he:'אני שמח היום.',situation:'מספרים על מצב רוח.',ar:['أنا مبسوط اليوم.','אַנַא מַבְּסוּט אִלְיוֹם.'],it:['Sono felice oggi.',''],ru:['Я сегодня счастлив.','Ya segodnya schastliv.'],es:['Estoy feliz hoy.','']},
        {id:'whyangry',he:'למה אתה כועס?',situation:'שואלים על רגש.',ar:['ليش إنت معصب؟','לֵיש אִנְתַ מְעַסַּבּ?'],it:['Perché sei arrabbiato?',''],ru:['Почему ты злишься?','Pochemu ty zlishsya?'],es:['¿Por qué estás enojado?','']},
        {id:'littleafraid',he:'אני קצת מפחד.',situation:'משתפים חשש.',ar:['أنا خايف شوي.','אַנַא חַ׳איֶף שְוַי.'],it:['Ho un po’ paura.',''],ru:['Я немного боюсь.','Ya nemnogo boyus.'],es:['Tengo un poco de miedo.','']},
        {id:'missfamily',he:'אני מתגעגע למשפחה שלי.',situation:'רחוק מהבית.',ar:['مشتاق لعيلتي.','מֻשְתַאק לְעֵילְתִי.'],it:['Mi manca la mia famiglia.',''],ru:['Я скучаю по своей семье.','Ya skuchayu po svoyey semye.'],es:['Extraño a mi familia.','']}
      ]
    },
    weather:{
      words:[
        {id:'sun',he:'שמש',ar:['شمس','שַמְס'],it:['sole',''],ru:['солнце','solntse'],es:['sol','']},
        {id:'rain',he:'גשם',ar:['مطر','מַטַר'],it:['pioggia',''],ru:['дождь','dozhd'],es:['lluvia','']},
        {id:'wind',he:'רוח',ar:['هوا','הַוַא'],it:['vento',''],ru:['ветер','veter'],es:['viento','']},
        {id:'hot',he:'חם',ar:['حر','חַר'],it:['caldo',''],ru:['жарко','zharko'],es:['calor','']},
        {id:'cold',he:'קר',ar:['برد','בַּרֶד'],it:['freddo',''],ru:['холодно','kholodno'],es:['frío','']},
        {id:'cloud',he:'ענן',ar:['غيمة','עַ׳יְמֶה'],it:['nuvola',''],ru:['облако','oblako'],es:['nube','']},
        {id:'weather',he:'מזג אוויר',ar:['طقس','טַקְס'],it:['tempo',''],ru:['погода','pogoda'],es:['clima','']},
        {id:'storm',he:'סערה',ar:['عاصفة','עַאסְפֶה'],it:['tempesta',''],ru:['буря','burya'],es:['tormenta','']}
      ],
      sentences:[
        {id:'hottoday',he:'חם היום.',situation:'מדברים על מזג האוויר.',ar:['اليوم حر.','אִלְיוֹם חַר.'],it:['Oggi fa caldo.',''],ru:['Сегодня жарко.','Segodnya zharko.'],es:['Hoy hace calor.','']},
        {id:'raintomorrow',he:'מחר יהיה גשם.',situation:'תחזית פשוטה.',ar:['بكرة في مطر.','בֻּכְּרַה פִי מַטַר.'],it:['Domani piove.',''],ru:['Завтра будет дождь.','Zavtra budet dozhd.'],es:['Mañana va a llover.','']},
        {id:'strongwind',he:'הרוח חזקה.',situation:'מתארים תנאים בחוץ.',ar:['الهوا قوي.','אֶל־הַוַא קַוִי.'],it:['Il vento è forte.',''],ru:['Ветер сильный.','Veter silnyy.'],es:['El viento es fuerte.','']},
        {id:'niceweather',he:'מזג האוויר יפה.',situation:'יום נעים.',ar:['الطقس حلو.','אֶ־טַקְס חִלוּ.'],it:['Il tempo è bello.',''],ru:['Погода хорошая.','Pogoda khoroshaya.'],es:['Hace buen tiempo.','']}
      ]
    },
    technology:{
      words:[
        {id:'phone',he:'טלפון',ar:['تلفون','תֵלֵפוֹן'],it:['telefono',''],ru:['телефон','telefon'],es:['teléfono','']},
        {id:'computer',he:'מחשב',ar:['كمبيوتر','כּוֹמְפְּיוּטֶר'],it:['computer',''],ru:['компьютер','kompyuter'],es:['computadora','']},
        {id:'internet',he:'אינטרנט',ar:['إنترنت','אִינְתֶרְנֵת'],it:['internet',''],ru:['интернет','internet'],es:['internet','']},
        {id:'message',he:'הודעה',ar:['رسالة','רִסַאלֶה'],it:['messaggio',''],ru:['сообщение','soobshcheniye'],es:['mensaje','']},
        {id:'photo',he:'תמונה',ar:['صورة','סוּרַה'],it:['foto',''],ru:['фото','foto'],es:['foto','']},
        {id:'video',he:'וידאו',ar:['فيديو','פִידְיוֹ'],it:['video',''],ru:['видео','video'],es:['video','']},
        {id:'charger',he:'מטען',ar:['شاحن','שַאחֶן'],it:['caricatore',''],ru:['зарядка','zaryadka'],es:['cargador','']},
        {id:'password',he:'סיסמה',ar:['كلمة سر','כִּלְמֶת סִר'],it:['password',''],ru:['пароль','parol'],es:['contraseña','']}
      ],
      sentences:[
        {id:'wherephone',he:'איפה הטלפון שלי?',situation:'מחפשים טלפון.',ar:['وين تلفوني؟','וֵין תֵלֵפוֹנִי?'],it:['Dov’è il mio telefono?',''],ru:['Где мой телефон?','Gde moy telefon?'],es:['¿Dónde está mi teléfono?','']},
        {id:'sendmessage',he:'שלח לי הודעה.',situation:'מבקשים הודעה.',ar:['ابعثلي رسالة.','אִבְּעַתְ׳לִי רִסַאלֶה.'],it:['Mandami un messaggio.',''],ru:['Отправь мне сообщение.','Otprav mne soobshcheniye.'],es:['Mándame un mensaje.','']},
        {id:'slowinternet',he:'האינטרנט איטי.',situation:'בעיה בחיבור.',ar:['الإنترنت بطيء.','אֶל־אִינְתֶרְנֵת בַּטִי.'],it:['Internet è lento.',''],ru:['Интернет медленный.','Internet medlennyy.'],es:['El internet está lento.','']},
        {id:'needcharger',he:'אני צריך מטען.',situation:'הסוללה נגמרת.',ar:['بدي شاحن.','בַּדִּי שַאחֶן.'],it:['Mi serve un caricatore.',''],ru:['Мне нужна зарядка.','Mne nuzhna zaryadka.'],es:['Necesito un cargador.','']}
      ]
    },
    colors:{
      words:[
        {id:'red',he:'אדום',ar:['أحمر','אַחְמַר'],it:['rosso',''],ru:['красный','krasnyy'],es:['rojo','']},
        {id:'blue',he:'כחול',ar:['أزرق','אַזְרַק'],it:['blu',''],ru:['синий','siniy'],es:['azul','']},
        {id:'green',he:'ירוק',ar:['أخضر','אַחְדַר'],it:['verde',''],ru:['зелёный','zelyonyy'],es:['verde','']},
        {id:'yellow',he:'צהוב',ar:['أصفر','אַסְפַר'],it:['giallo',''],ru:['жёлтый','zholtyy'],es:['amarillo','']},
        {id:'black',he:'שחור',ar:['أسود','אַסְוַד'],it:['nero',''],ru:['чёрный','chyornyy'],es:['negro','']},
        {id:'white',he:'לבן',ar:['أبيض','אַבְיַד'],it:['bianco',''],ru:['белый','belyy'],es:['blanco','']},
        {id:'orange',he:'כתום',ar:['برتقالي','בֻּרְתֻקַאלִי'],it:['arancione',''],ru:['оранжевый','oranzhevyy'],es:['naranja','']},
        {id:'purple',he:'סגול',ar:['بنفسجي','בַּנַפְסַג׳ִי'],it:['viola',''],ru:['фиолетовый','fioletovyy'],es:['morado','']}
      ],
      sentences:[
        {id:'redcar',he:'המכונית אדומה.',situation:'מתארים צבע.',ar:['السيارة حمرا.','אֶ־סַיַּארַה חַמְרַא.'],it:['La macchina è rossa.',''],ru:['Машина красная.','Mashina krasnaya.'],es:['El coche es rojo.','']},
        {id:'bluesky',he:'השמיים כחולים.',situation:'מתארים את השמיים.',ar:['السما زرقا.','אֶ־סַמַא זַרְקַא.'],it:['Il cielo è blu.',''],ru:['Небо синее.','Nebo sineye.'],es:['El cielo es azul.','']},
        {id:'blackshirt',he:'החולצה שחורה.',situation:'מתארים בגד.',ar:['القميص أسود.','אֶל־קַמִיס אַסְוַד.'],it:['La maglietta è nera.',''],ru:['Футболка чёрная.','Futbolka chyornaya.'],es:['La camiseta es negra.','']},
        {id:'likegreen',he:'אני אוהב את הצבע הירוק.',situation:'מדברים על צבע מועדף.',ar:['بحب اللون الأخضر.','בַּחִבּ אֶל־לַוְן אֶל־אַחְדַר.'],it:['Mi piace il verde.',''],ru:['Мне нравится зелёный цвет.','Mne nravitsya zelyonyy tsvet.'],es:['Me gusta el color verde.','']}
      ]
    },
    numbers:{
      words:[
        {id:'one',he:'אחד',ar:['واحد','וַאחֶד'],it:['uno',''],ru:['один','odin'],es:['uno','']},
        {id:'two',he:'שתיים',ar:['اثنين','אִתְנֵין'],it:['due',''],ru:['два','dva'],es:['dos','']},
        {id:'three',he:'שלוש',ar:['ثلاثة','תַלַאתֶה'],it:['tre',''],ru:['три','tri'],es:['tres','']},
        {id:'four',he:'ארבע',ar:['أربعة','אַרְבַּעַה'],it:['quattro',''],ru:['четыре','chetyre'],es:['cuatro','']},
        {id:'five',he:'חמש',ar:['خمسة','חַמְסֶה'],it:['cinque',''],ru:['пять','pyat'],es:['cinco','']},
        {id:'ten',he:'עשר',ar:['عشرة','עַשַרַה'],it:['dieci',''],ru:['десять','desyat'],es:['diez','']},
        {id:'hundred',he:'מאה',ar:['مية','מִיֶּה'],it:['cento',''],ru:['сто','sto'],es:['cien','']},
        {id:'number',he:'מספר',ar:['رقم','רַקַם'],it:['numero',''],ru:['номер','nomer'],es:['número','']}
      ],
      sentences:[
        {id:'oneticket',he:'יש לי כרטיס אחד.',situation:'סופרים כרטיסים.',ar:['عندي تذكرة وحدة.','עִנְדִי תַדְ׳כַּרַה וַחְדֶה.'],it:['Ho un biglietto.',''],ru:['У меня один билет.','U menya odin bilet.'],es:['Tengo una entrada.','']},
        {id:'threepeople',he:'אנחנו שלושה אנשים.',situation:'מציינים כמות אנשים.',ar:['إحنا ثلاثة أشخاص.','אִחְנַא תַלַאתֶה אַשְחַ׳אס.'],it:['Siamo tre persone.',''],ru:['Нас три человека.','Nas tri cheloveka.'],es:['Somos tres personas.','']},
        {id:'teneuro',he:'זה עולה עשרה אירו.',situation:'מדברים על מחיר.',ar:['سعره عشرة يورو.','סִעְרוֹ עַשַרַה יוּרוֹ.'],it:['Costa dieci euro.',''],ru:['Это стоит десять евро.','Eto stoit desyat yevro.'],es:['Cuesta diez euros.','']},
        {id:'yournumber',he:'מה המספר שלך?',situation:'מבקשים מספר.',ar:['شو رقمك؟','שוּ רַקַמַכּ?'],it:['Qual è il tuo numero?',''],ru:['Какой у тебя номер?','Kakoy u tebya nomer?'],es:['¿Cuál es tu número?','']}
      ]
    }
  };

  const LANGS=['ar','it','ru','es'];
  const COURSES={ar:{},it:{},ru:{},es:{}};
  Object.entries(DATA).forEach(([topic,data])=>{
    LANGS.forEach(lang=>{
      COURSES[lang][topic]={
        words:data.words.map(w=>[w.id,w[lang][0],w[lang][1]||'',w.he]),
        sentences:data.sentences.map(s=>[s.id,s[lang][0],s[lang][1]||'',s.he,s.situation||''])
      };
    });
  });

  function applyTo(core){
    if(!core)return core;
    Object.assign(core.TOPIC_META,TOPIC_META);
    LANGS.forEach(lang=>{
      core.COURSES[lang] ||= {};
      Object.assign(core.COURSES[lang],COURSES[lang]);
    });
    return core;
  }

  return {TOPIC_META,COURSES,applyTo};
});
