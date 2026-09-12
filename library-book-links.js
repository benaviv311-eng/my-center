(function(){
'use strict';

document.addEventListener('click', event => {
  const open = event.target.closest('.library-open-book');
  if(!open) return;

  const id = open.dataset.bookId;
  if(!id) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  window.location.href = 'book.html?book=' + encodeURIComponent(id);
}, true);
})();
