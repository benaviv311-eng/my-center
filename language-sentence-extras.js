(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.LanguageSentenceExtras=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const rows=[
    ['home-now','אני בבית עכשיו.',
      ['أنا بالبيت هسا.','אַנַא בַּלְבֵּית הַסַּא.'],['Sono a casa adesso.',''],['Я дома сейчас.','Ya doma seychas.'],['Estoy en casa ahora.','']],
    ['where-going','לאן אתה הולך?',
      ['وين رايح؟','וֵין רַאיֵח?'],['Dove vai?',''],['Куда ты идёшь?','Kuda ty idyosh?'],['¿Adónde vas?','']],
    ['eat-something','אני רוצה לאכול משהו.',
      ['بدي آكل إشي.','בַּדִּי אַאכֹּל אִשִי.'],['Voglio mangiare qualcosa.',''],['Я хочу что-нибудь поесть.','Ya khochu chto-nibud poyest.'],['Quiero comer algo.','']],
    ['time-today','יש לך זמן היום?',
      ['عندك وقت اليوم؟','עִנְדַכּ וַקְת אִלְיוֹם?'],['Hai tempo oggi?',''],['У тебя есть время сегодня?','U tebya yest vremya segodnya?'],['¿Tienes tiempo hoy?','']],
    ['talk-tomorrow','נדבר מחר.',
      ['منحكي بكرة.','מְנִחְכִּי בֻּכְּרַה.'],['Parliamo domani.',''],['Поговорим завтра.','Pogovorim zavtra.'],['Hablamos mañana.','']],
    ['dont-understand','אני לא מבין.',
      ['مش فاهم.','מִש פַאהֶם.'],['Non capisco.',''],['Я не понимаю.','Ya ne ponimayu.'],['No entiendo.','']],
    ['again-please','תגיד את זה שוב, בבקשה.',
      ['احكيها كمان مرة، لو سمحت.','אִחְכִּיהַא כַּמַאן מַרַה, לַו סַמַחְת.'],['Dillo di nuovo, per favore.',''],['Скажи ещё раз, пожалуйста.','Skazhi yeshchyo raz, pozhaluysta.'],['Dilo otra vez, por favor.','']],
    ['speak-slowly','דבר יותר לאט.',
      ['احكي أبطأ شوي.','אִחְכִּי אַבְּטַא שְוַי.'],['Parla più lentamente.',''],['Говори помедленнее.','Govori pomedlenneye.'],['Habla más despacio.','']],
    ['how-much','כמה זה עולה?',
      ['قديش هاد؟','קַדֵּיש הַאד?'],['Quanto costa questo?',''],['Сколько это стоит?','Skolko eto stoit?'],['¿Cuánto cuesta esto?','']],
    ['need-help','אני צריך עזרה.',
      ['بدي مساعدة.','בַּדִּי מֻסַאעַדֶה.'],['Ho bisogno di aiuto.',''],['Мне нужна помощь.','Mne nuzhna pomoshch.'],['Necesito ayuda.','']],
    ['wait-here','חכה לי כאן.',
      ['استناني هون.','אִסְתַנַּאנִי הוֹן.'],['Aspettami qui.',''],['Подожди меня здесь.','Podozhdi menya zdes.'],['Espérame aquí.','']],
    ['coming-now','אני מגיע עכשיו.',
      ['جاي هسا.','ג׳ַאי הַסַּא.'],['Arrivo adesso.',''],['Я сейчас приду.','Ya seychas pridu.'],['Voy ahora.','']],
    ['hot-today','היום חם מאוד.',
      ['اليوم كتير حر.','אִלְיוֹם כְּתִיר חַר.'],['Oggi fa molto caldo.',''],['Сегодня очень жарко.','Segodnya ochen zharko.'],['Hoy hace mucho calor.','']],
    ['cold-outside','קר בחוץ.',
      ['برا برد.','בַּרַּא בַּרֶד.'],['Fuori fa freddo.',''],['На улице холодно.','Na ulitse kholodno.'],['Hace frío afuera.','']],
    ['like-place','אני אוהב את המקום הזה.',
      ['بحب هالمكان.','בַּחִבּ הַלְמַכַּאן.'],['Mi piace questo posto.',''],['Мне нравится это место.','Mne nravitsya eto mesto.'],['Me gusta este lugar.','']],
    ['tired-happy','אני עייף אבל שמח.',
      ['أنا تعبان بس مبسوط.','אַנַא תַעְבַּאן בַּס מַבְּסוּט.'],['Sono stanco ma felice.',''],['Я устал, но счастлив.','Ya ustal, no schastliv.'],['Estoy cansado pero feliz.','']],
    ['go-now','אנחנו צריכים ללכת עכשיו.',
      ['لازم نروح هسا.','לַאזֶם נְרוּח הַסַּא.'],['Dobbiamo andare adesso.',''],['Нам нужно идти сейчас.','Nam nuzhno idti seychas.'],['Tenemos que ir ahora.','']],
    ['train-eight','הרכבת מגיעה בשמונה.',
      ['القطار بوصل عالتمانية.','אֶלְקִטַאר בּוֹסַל עַת־תַמַאנְיֶה.'],['Il treno arriva alle otto.',''],['Поезд прибывает в восемь.','Poyezd pribyvayet v vosem.'],['El tren llega a las ocho.','']],
    ['phone-bag','הטלפון שלי בתיק.',
      ['تلفوني بالشنطة.','תֵלֵפוֹנִי בַּשַּנְטַה.'],['Il mio telefono è nella borsa.',''],['Мой телефон в сумке.','Moy telefon v sumke.'],['Mi teléfono está en la bolsa.','']],
    ['forgot-password','שכחתי את הסיסמה שלי.',
      ['نسيت كلمة السر.','נְסִית כִּלְמֶת אֶ־סִר.'],['Ho dimenticato la password.',''],['Я забыл пароль.','Ya zabyl parol.'],['Olvidé mi contraseña.','']],
    ['ready-start','אנחנו מוכנים להתחיל.',
      ['إحنا جاهزين نبلش.','אִחְנַא ג׳ַאהְזִין נְבַּלֵש.'],['Siamo pronti per iniziare.',''],['Мы готовы начать.','My gotovy nachat.'],['Estamos listos para empezar.','']],
    ['meeting-ten','הפגישה מתחילה בעוד עשר דקות.',
      ['الاجتماع ببلش كمان عشر دقايق.','אֶלְאִגְ׳תִמַאע בְּבַּלֵש כַּמַאן עַשַר דַקַאיֶק.'],['La riunione inizia tra dieci minuti.',''],['Встреча начинается через десять минут.','Vstrecha nachinayetsya cherez desyat minut.'],['La reunión empieza en diez minutos.','']],
    ['have-question','יש לי שאלה.',
      ['عندي سؤال.','עִנְדִי סֻאַאל.'],['Ho una domanda.',''],['У меня есть вопрос.','U menya yest vopros.'],['Tengo una pregunta.','']],
    ['what-think','מה אתה חושב?',
      ['شو رأيك؟','שוּ רַאְיַכּ?'],['Che ne pensi?',''],['Что ты думаешь?','Chto ty dumayesh?'],['¿Qué piensas?','']],
    ['find-station','אני מחפש את התחנה.',
      ['بدور عالمحطة.','בַּדַוֶר עַלְמַחַטַה.'],['Cerco la stazione.',''],['Я ищу станцию.','Ya ishchu stantsiyu.'],['Busco la estación.','']],
    ['can-help','אתה יכול לעזור לי?',
      ['فيك تساعدني؟','פִיכּ תְסַאעֶדְנִי?'],['Puoi aiutarmi?',''],['Ты можешь мне помочь?','Ty mozhesh mne pomoch?'],['¿Puedes ayudarme?','']],
    ['call-later','אני אתקשר אליך אחר כך.',
      ['برنلك بعدين.','בְּרִנְלַכּ בַּעְדֵין.'],['Ti chiamo dopo.',''],['Я позвоню тебе позже.','Ya pozvonyu tebe pozzhe.'],['Te llamo después.','']],
    ['food-good','האוכל טעים מאוד.',
      ['الأكل كتير طيب.','אֶלְאַכֶּל כְּתִיר טַיֶבּ.'],['Il cibo è molto buono.',''],['Еда очень вкусная.','Yeda ochen vkusnaya.'],['La comida está muy rica.','']]
  ];
  const langs=['ar','it','ru','es'];
  const out={ar:[],it:[],ru:[],es:[]};
  rows.forEach(row=>{
    const [id,he,...variants]=row;
    langs.forEach((lang,index)=>{
      const [target,pron]=variants[index];
      out[lang].push([id,target,pron||'',he,'משפט שימושי לשיחה יומיומית.']);
    });
  });
  return out;
});
