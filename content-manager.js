(function(){
  const title=document.querySelector('.page-title');

  if(title && !document.getElementById('bank-manager-login')){
    title.classList.add('hub-topbar');

    const controls=document.createElement('div');
    controls.className='hub-manager-box';
    controls.innerHTML=`
      <span id="manager-status" class="manager-status">🔒 צפייה בלבד</span>
      <button id="bank-manager-login" class="btn small" type="button">🔐 מצב ניהול</button>
      <button id="bank-add-item" class="btn small" type="button" hidden>➕ הוסף פריט</button>
    `;

    title.appendChild(controls);
  }

  if(!document.getElementById('bank-manager-access')){
    const access=document.createElement('div');
    access.id='bank-manager-access';
    access.className='editor-overlay hidden';
    access.setAttribute('aria-hidden','true');

    access.innerHTML=`
      <div class="editor-panel manager-access-panel" role="dialog" aria-modal="true" aria-labelledby="manager-access-title">
        <div class="editor-head">
          <h2 id="manager-access-title">כניסה למצב עריכה</h2>
          <button id="manager-access-close" class="editor-close" type="button">×</button>
        </div>

        <p class="meta">הכנס את קוד העריכה הפרטי. אחרי כניסה מוצלחת הוא יישמר רק במכשיר הזה.</p>

        <div class="editor-field full">
          <label for="manager-key">קוד עריכה</label>
          <input id="manager-key" type="password" autocomplete="current-password" inputmode="text" placeholder="קוד עריכה פרטי">
        </div>

        <div id="manager-access-error" class="manager-access-error" hidden></div>

        <div class="editor-actions">
          <button id="manager-access-cancel" class="btn" type="button">ביטול</button>
          <button id="manager-access-submit" class="btn" type="button">🔓 כניסה לעריכה</button>
        </div>
      </div>
    `;

    document.body.appendChild(access);
  }

  if(!document.getElementById('bank-editor')){
    const overlay=document.createElement('div');
    overlay.id='bank-editor';
    overlay.className='editor-overlay hidden';
    overlay.setAttribute('aria-hidden','true');

    overlay.innerHTML=`
      <div class="editor-panel" role="dialog" aria-modal="true" aria-labelledby="editor-title-text">
        <div class="editor-head">
          <h2 id="editor-title-text">הוספת פריט</h2>
          <button id="editor-close" class="editor-close" type="button">×</button>
        </div>

        <div class="editor-grid">
          <div class="editor-field">
            <label for="editor-type">סוג</label>
            <select id="editor-type">
              <option value="verse">פסוק</option>
              <option value="quote">ציטוט</option>
              <option value="book">ספר</option>
              <option value="idea">רעיון</option>
              <option value="scene">סצנה</option>
              <option value="character">דמות</option>
              <option value="exercise">תרגיל</option>
              <option value="language">שפה</option>
              <option value="music">מוזיקה</option>
            </select>
          </div>

          <div class="editor-field">
            <label for="editor-title">כותרת / הפסוק</label>
            <input id="editor-title" type="text" maxlength="200">
          </div>

          <div class="editor-field full" data-editor-for="verse">
            <label for="editor-reference">מקור</label>
            <input id="editor-reference" type="text" placeholder="לדוגמה: משלי כ״ד, ט״ז">
          </div>

          <div class="editor-field full" data-editor-for="verse">
            <label for="editor-literary">פירוש ספרותי</label>
            <textarea id="editor-literary" rows="3"></textarea>
          </div>

          <div class="editor-field full" data-editor-for="verse">
            <label for="editor-human">מבט אנושי</label>
            <textarea id="editor-human" rows="3"></textarea>
          </div>

          <div class="editor-field full" data-editor-for="verse">
            <label for="editor-raika">החיבור לעולם ראיקה</label>
            <textarea id="editor-raika" rows="3"></textarea>
          </div>

          <div class="editor-field full" data-editor-for="verse">
            <label for="editor-quote">משפט שהדמות הייתה אומרת</label>
            <textarea id="editor-quote" rows="2"></textarea>
          </div>

          <div class="editor-field full" data-editor-for="quote,book,idea,scene,character,exercise,language,music">
            <label for="editor-generic">תוכן מרכזי / תקציר</label>
            <textarea id="editor-generic" rows="7"></textarea>
          </div>
        </div>

        <div class="editor-actions">
          <button id="editor-cancel" class="btn" type="button">ביטול</button>
          <button id="editor-save" class="btn" type="button">💾 שמור</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
  }
})();