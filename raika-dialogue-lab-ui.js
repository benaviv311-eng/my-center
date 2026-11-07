(function () {
  'use strict';

  var CORE = window.RaikaDialogueLabCore;
  var state = { variant: 0, lastDialogue: null };
  var observer = null;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function toast(message) {
    if (typeof window.toast === 'function') window.toast(message);
  }

  function characters() {
    return Array.isArray(window.RAIKA_DATA && window.RAIKA_DATA.characters) ? window.RAIKA_DATA.characters : [];
  }

  function places() {
    return Array.isArray(window.RAIKA_DATA && window.RAIKA_DATA.world) ? window.RAIKA_DATA.world : [];
  }

  function charOptions(includeBlank) {
    var list = includeBlank ? '<option value="">ללא דמות שלישית</option>' : '';
    list += characters().map(function (c) {
      return '<option value="' + esc(c.id) + '">' + esc(c.title) + '</option>';
    }).join('');
    return list;
  }

  function placeOptions() {
    return places().map(function (p) {
      return '<option value="' + esc(p.id) + '">' + esc(p.title) + '</option>';
    }).join('');
  }

  function toneOptions(allowBlank) {
    var html = allowBlank ? '<option value="">ללא רגש נוסף</option>' : '';
    Object.keys(CORE.TONES).forEach(function (key) {
      html += '<option value="' + esc(key) + '">' + esc(CORE.TONES[key]) + '</option>';
    });
    return html;
  }

  function dynamicOptions() {
    return Object.keys(CORE.DYNAMICS).map(function (key) {
      return '<option value="' + esc(key) + '">' + esc(CORE.DYNAMICS[key]) + '</option>';
    }).join('');
  }

  function mountDialogueLab() {
    if (document.getElementById('raika-dialogue-lab')) return;
    var anchor = document.getElementById('writers-room') || document.getElementById('raika-feed');
    if (!anchor) return;

    var section = document.createElement('section');
    section.id = 'raika-dialogue-lab';
    section.className = 'section rdl-lab card';
    section.innerHTML = [
      '<div class="rdl-head"><div><span class="label raika">מעבדת יצירה</span><h2>🎭 מחולל דיאלוגים</h2><p class="meta">בחר דמויות, מקום, פעילות ודינמיקה. המנוע המקומי ייצור טיוטת שיחה — בלי API ובלי חיוב.</p></div><span class="rdl-free">ללא עלות נוספת</span></div>',
      '<div class="rdl-form-grid">',
      '<label>דמות ראשונה<select id="rdl-character-a" class="search">' + charOptions(false) + '</select></label>',
      '<label>דמות שנייה<select id="rdl-character-b" class="search">' + charOptions(false) + '</select></label>',
      '<label>דמות שלישית — אופציונלי<select id="rdl-character-c" class="search">' + charOptions(true) + '</select></label>',
      '<label>מקום<select id="rdl-location" class="search">' + placeOptions() + '</select></label>',
      '<label>פעילות<select id="rdl-activity" class="search">',
      '<option value="אימון משותף">אימון משותף</option><option value="תרגיל דיוק">תרגיל דיוק</option><option value="תרגול תנועה">תרגול תנועה</option><option value="סידור ציוד אחרי אימון">סידור ציוד אחרי אימון</option><option value="הפסקת תה">הפסקת תה</option><option value="עזרה במאפייה">עזרה במאפייה</option><option value="קנייה בשוק הכפר">קנייה בשוק הכפר</option><option value="שיחה בבית הספר">שיחה בבית הספר</option><option value="הליכה בכפר">הליכה בכפר</option><option value="הכנת ארוחה">הכנת ארוחה</option><option value="משימה משותפת">משימה משותפת</option><option value="המתנה לפני אירוע">המתנה לפני אירוע</option>',
      '</select></label>',
      '<label>דינמיקה בין הדמויות<select id="rdl-dynamic" class="search">' + dynamicOptions() + '</select></label>',
      '<label>אווירה מרכזית<select id="rdl-tone-primary" class="search">' + toneOptions(false) + '</select></label>',
      '<label>אווירה משנית — אופציונלי<select id="rdl-tone-secondary" class="search">' + toneOptions(true) + '</select></label>',
      '<label class="rdl-wide">מקום אחר, אם אינו ברשימה<input id="rdl-location-custom" class="search" placeholder="למשל: המאפייה של קומוגי"></label>',
      '<label class="rdl-wide">דמות נוספת שאינה במאגר, אם צריך<input id="rdl-character-custom" class="search" placeholder="למשל: קומוגי — תסומן כדמות שדורשת אימות"></label>',
      '<label class="rdl-wide">הנחיה נוספת<textarea id="rdl-note" class="search" rows="2" placeholder="למשל: יריבות עם כבוד הדדי, בלי השפלה אישית, דיאלוג קצר וטבעי..."></textarea></label>',
      '</div>',
      '<div class="rdl-actions"><button id="rdl-generate-dialogue" class="btn primary" type="button">✨ צור דיאלוג</button><span id="rdl-status" class="meta" aria-live="polite">הטיוטה תישאר הצעה בלבד עד לאישור שלך.</span></div>',
      '<div id="rdl-dialogue-output" class="rdl-output hidden"></div>',
      '</section>'
    ].join('');

    anchor.insertAdjacentElement('afterend', section);
    var byId = function (id) { return document.getElementById(id); };
    if (byId('rdl-character-a')) byId('rdl-character-a').value = characters().some(function (c) { return c.id === 'raika'; }) ? 'raika' : (characters()[0] && characters()[0].id || '');
    if (byId('rdl-character-b')) byId('rdl-character-b').value = characters().some(function (c) { return c.id === 'okane'; }) ? 'okane' : (characters()[1] && characters()[1].id || '');
    if (byId('rdl-location')) byId('rdl-location').value = places().some(function (p) { return p.id === 'inazuma-dojo'; }) ? 'inazuma-dojo' : (places()[0] && places()[0].id || '');
    if (byId('rdl-tone-primary')) byId('rdl-tone-primary').value = 'tense';
    if (byId('rdl-dynamic')) byId('rdl-dynamic').value = 'rivalry';

    byId('rdl-generate-dialogue').addEventListener('click', generateDialogue);
    section.addEventListener('click', handleLabClick);
  }

  function generateDialogue() {
    var a = characters().find(function (c) { return c.id === document.getElementById('rdl-character-a').value; });
    var b = characters().find(function (c) { return c.id === document.getElementById('rdl-character-b').value; });
    var cId = document.getElementById('rdl-character-c').value;
    var c = cId ? characters().find(function (item) { return item.id === cId; }) : null;
    var selected = [a, b, c].filter(Boolean);
    var customName = document.getElementById('rdl-character-custom').value.trim();
    var customCharacter = false;
    if (customName) {
      selected.push({ title: customName, missingProfile: true });
      customCharacter = true;
    }

    var locationSelect = document.getElementById('rdl-location');
    var locationOption = locationSelect.options[locationSelect.selectedIndex];
    var location = document.getElementById('rdl-location-custom').value.trim() || (locationOption && locationOption.text) || '';
    var locationVerified = !document.getElementById('rdl-location-custom').value.trim();
    var result;
    try {
      result = CORE.buildDialogue({
        characters: selected,
        location: location,
        locationVerified: locationVerified,
        activity: document.getElementById('rdl-activity').value,
        dynamic: document.getElementById('rdl-dynamic').value,
        primaryTone: document.getElementById('rdl-tone-primary').value,
        secondaryTone: document.getElementById('rdl-tone-secondary').value,
        note: document.getElementById('rdl-note').value,
        customCharacter: customCharacter,
        variant: state.variant++
      });
    } catch (error) {
      document.getElementById('rdl-status').textContent = error.message || 'בדוק את הבחירות ונסה שוב.';
      return;
    }

    state.lastDialogue = result;
    renderDialogueOutput(result);
    document.getElementById('rdl-status').textContent = 'הדיאלוג נוצר מקומית. אפשר לערוך, להעתיק או לשמור כטיוטה.';
  }

  function renderDialogueOutput(result) {
    var host = document.getElementById('rdl-dialogue-output');
    var warnings = result.warnings.length
      ? '<div class="rdl-warning"><b>הערות אימות:</b><ul>' + result.warnings.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul></div>'
      : '';
    host.innerHTML = '<div class="rdl-output-head"><div><b>' + esc(result.title) + '</b><span class="rdl-local-label">נוצר במנוע מקומי · לא נעשה שימוש ב־AI</span></div><span class="rdl-proposal">טיוטה · לא קאנון</span></div>' +
      warnings +
      '<textarea class="search rdl-output-text" data-rdl-dialogue-text rows="16">' + esc(result.text) + '</textarea>' +
      '<div class="card-actions"><button class="btn small" type="button" data-rdl-copy-dialogue>📋 העתק</button><button class="btn small" type="button" data-rdl-save-dialogue>💾 שמור כטיוטה</button></div>';
    host.classList.remove('hidden');
  }

  function tonePanelMarkup(kind) {
    return '<div class="rdl-tone-panel hidden" data-rdl-tone-panel data-rdl-kind="' + esc(kind) + '">' +
      '<div class="rdl-tone-fields">' +
      '<label>אווירה מרכזית<select class="search" data-rdl-primary>' + toneOptions(false) + '</select></label>' +
      '<label>אווירה משנית<select class="search" data-rdl-secondary>' + toneOptions(true) + '</select></label>' +
      '<label class="rdl-wide">דמויות בסצנה — אם חסרות<input class="search" data-rdl-participants placeholder="למשל: ראיקה, קומוגי"></label>' +
      '<label class="rdl-wide">כיוון נוסף<textarea class="search" data-rdl-tone-note rows="2" placeholder="למשל: קומי אבל לא ילדותי; לשמור על כבוד בין הדמויות"></textarea></label>' +
      '</div>' +
      '<button class="btn small" type="button" data-rdl-generate-tone>🎭 צור גרסה באווירה הזו</button>' +
      '<div class="rdl-tone-output hidden" data-rdl-tone-output></div>' +
      '</div>';
  }

  function attachToneControl(host, kind) {
    var actions = host.querySelector(kind === 'scene' ? '.rg-scene-actions' : '.raika-feed-actions');
    if (!actions) return;
    if (!actions.querySelector('[data-rdl-open-tone]')) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn small';
      button.setAttribute('data-rdl-open-tone', '1');
      button.textContent = '🎭 שנה אווירה';
      actions.appendChild(button);
    }
    if (!host.querySelector('[data-rdl-tone-panel]')) actions.insertAdjacentHTML('afterend', tonePanelMarkup(kind));
  }

  function scanToneHosts() {
    if (!CORE) return;
    document.querySelectorAll('.raika-feed-card').forEach(function (host) { attachToneControl(host, 'feed'); });
    document.querySelectorAll('.rg-scene-panel').forEach(function (host) { attachToneControl(host, 'scene'); });
  }

  function parseNames(value) {
    return String(value || '').split(/[,،\n]+|\s+ו(?=[א-ת])/).map(function (x) { return x.trim(); }).filter(Boolean);
  }

  function knownCharacterIds(names) {
    return characters().filter(function (character) {
      return names.some(function (name) { return name === character.title || name.indexOf(character.title) >= 0; });
    }).map(function (character) { return character.id; });
  }

  function feedSource(host, panel) {
    var id = host.getAttribute('data-rf-card') || '';
    var card = window.RaikaFeedUI && typeof window.RaikaFeedUI.getCard === 'function' ? window.RaikaFeedUI.getCard(id) : null;
    if (!card) {
      card = {
        title: host.querySelector('h4') && host.querySelector('h4').textContent,
        body: host.querySelector('p') && host.querySelector('p').textContent,
        characters: []
      };
    }
    var names = (card.characters || []).map(function (characterId) {
      var found = characters().find(function (character) { return character.id === characterId; });
      return found ? found.title : characterId;
    });
    var manualNames = panel.querySelector('[data-rdl-participants]').value.trim();
    if (manualNames) names = parseNames(manualNames);
    return {
      title: card.title || 'רעיון מחדר הכותבים',
      body: card.body || card.summary || '',
      characters: card.characters || [],
      characterNames: names,
      note: panel.querySelector('[data-rdl-tone-note]').value.trim()
    };
  }

  function sceneSource(host, panel) {
    var titleNode = host.querySelector('.rg-scene-head h3');
    var editor = host.querySelector('[data-rg-scene-editor]');
    var grid = host.querySelector('.rg-scene-grid');
    var body = editor ? editor.value : (grid ? grid.innerText : '');
    var participantsNode = grid && grid.children[1] ? grid.children[1].querySelector('p') : null;
    var participants = participantsNode ? participantsNode.textContent.trim() : '';
    var names = parseNames(panel.querySelector('[data-rdl-participants]').value.trim() || participants);
    if (!names.length) names = ['דמות ראשונה', 'דמות שנייה'];
    return {
      title: titleNode ? titleNode.textContent.trim() : 'סצנה מחדר הכותבים',
      body: body,
      participants: participants,
      characterNames: names,
      characters: knownCharacterIds(names),
      note: panel.querySelector('[data-rdl-tone-note]').value.trim()
    };
  }

  function renderToneOutput(panel, result, source, kind) {
    var output = panel.querySelector('[data-rdl-tone-output]');
    output.__rdlResult = result;
    output.__rdlSource = source;
    output.__rdlKind = kind;
    output.innerHTML = '<div class="rdl-output-head"><b>' + esc(result.title) + '</b><span class="rdl-proposal">גרסה נפרדת · לא קאנון</span></div>' +
      '<textarea class="search rdl-output-text" data-rdl-tone-text rows="14">' + esc(result.text) + '</textarea>' +
      '<div class="card-actions"><button class="btn small" type="button" data-rdl-copy-tone>📋 העתק</button><button class="btn small" type="button" data-rdl-save-tone>💾 שמור כטיוטה נפרדת</button></div>';
    output.classList.remove('hidden');
  }

  function generateTone(host, panel) {
    var kind = panel.getAttribute('data-rdl-kind');
    var source = kind === 'scene' ? sceneSource(host, panel) : feedSource(host, panel);
    var result;
    try {
      result = CORE.buildToneRemix(
        source,
        panel.querySelector('[data-rdl-primary]').value,
        panel.querySelector('[data-rdl-secondary]').value,
        state.variant++
      );
    } catch (error) {
      toast(error.message || 'לא הצלחתי ליצור גרסת אווירה.');
      return;
    }
    renderToneOutput(panel, result, source, kind);
  }

  async function saveItem(item, button) {
    if (!window.RaikaPrivate || !window.RaikaPrivate.authorized || !window.RaikaWorkspaceClient || typeof window.RaikaWorkspaceClient.save !== 'function') {
      toast('כדי לשמור טיוטה צריך להתחבר לחדר הכותבים.');
      return;
    }
    var oldText = button.textContent;
    button.disabled = true;
    button.textContent = 'שומר…';
    try {
      await window.RaikaWorkspaceClient.save(item);
      button.textContent = 'נשמר ✓';
      toast('הטיוטה נשמרה בנפרד מהקאנון.');
    } catch (error) {
      button.disabled = false;
      button.textContent = oldText;
      toast('השמירה נכשלה. הטקסט נשאר כאן כדי שתוכל להעתיק אותו.');
    }
  }

  function handleLabClick(event) {
    var copyDialogue = event.target.closest('[data-rdl-copy-dialogue]');
    if (copyDialogue) {
      var dialogueText = document.querySelector('[data-rdl-dialogue-text]');
      if (dialogueText) copyText(dialogueText.value);
      return;
    }
    var saveDialogue = event.target.closest('[data-rdl-save-dialogue]');
    if (saveDialogue && state.lastDialogue) {
      var dialogueTextarea = document.querySelector('[data-rdl-dialogue-text]');
      var item = {
        id: 'dialogue-lab-' + Date.now(),
        type: 'idea',
        status: 'idea',
        title: state.lastDialogue.title,
        summary: dialogueTextarea ? dialogueTextarea.value : state.lastDialogue.text,
        characters: state.lastDialogue.characters,
        tags: ['dialogue-lab', 'proposal'],
        saved: true
      };
      saveItem(item, saveDialogue);
    }
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('הועתק.'); }).catch(function () { fallbackCopy(text); });
    } else fallbackCopy(text);
  }

  function fallbackCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy'); toast('הועתק.'); }
    catch (error) { toast('לא הצלחתי להעתיק אוטומטית. אפשר לסמן ולהעתיק ידנית.'); }
    area.remove();
  }

  document.addEventListener('click', function (event) {
    var open = event.target.closest('[data-rdl-open-tone]');
    if (open) {
      var host = open.closest('.raika-feed-card, .rg-scene-panel');
      var panel = host && host.querySelector('[data-rdl-tone-panel]');
      if (panel) panel.classList.toggle('hidden');
      return;
    }

    var generate = event.target.closest('[data-rdl-generate-tone]');
    if (generate) {
      var tonePanel = generate.closest('[data-rdl-tone-panel]');
      var toneHost = tonePanel && tonePanel.closest('.raika-feed-card, .rg-scene-panel');
      if (toneHost && tonePanel) generateTone(toneHost, tonePanel);
      return;
    }

    var copyTone = event.target.closest('[data-rdl-copy-tone]');
    if (copyTone) {
      var copyPanel = copyTone.closest('[data-rdl-tone-panel]');
      var copyArea = copyPanel && copyPanel.querySelector('[data-rdl-tone-text]');
      if (copyArea) copyText(copyArea.value);
      return;
    }

    var saveTone = event.target.closest('[data-rdl-save-tone]');
    if (saveTone) {
      var savePanel = saveTone.closest('[data-rdl-tone-panel]');
      var output = savePanel && savePanel.querySelector('[data-rdl-tone-output]');
      if (!output || !output.__rdlResult) return;
      var toneArea = output.querySelector('[data-rdl-tone-text]');
      var result = output.__rdlResult;
      var source = output.__rdlSource || {};
      var kind = output.__rdlKind;
      var isScene = kind === 'scene';
      var item = {
        id: 'tone-remix-' + Date.now(),
        type: isScene ? 'scene' : 'idea',
        status: isScene ? 'developing' : 'idea',
        title: result.title,
        summary: toneArea ? toneArea.value : result.text,
        placement: '',
        characters: source.characters || [],
        tags: ['tone-remix', 'proposal', isScene ? 'scene' : 'idea'],
        saved: true
      };
      saveItem(item, saveTone);
    }
  });

  function init() {
    if (!CORE) return;
    mountDialogueLab();
    scanToneHosts();
    if (!observer && document.body && typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(scanToneHosts);
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.RaikaDialogueLabUI = { init: init, generateDialogue: generateDialogue, scanToneHosts: scanToneHosts };
})();
