(function () {
  var header = document.querySelector('.site-header');

  /* --- header: hide on scroll down, show on scroll up (all pages);
         turns white/black after crossing the hero frame (home only) --- */
  if (header) {
    var pill = header.querySelector('.pill');
    var hero = document.querySelector('.hero__panel');
    var lastY = window.scrollY;

    var update = function () {
      var y = window.scrollY;

      if (y > lastY && y > 140) {
        header.classList.add('site-header--hidden');
      } else if (y < lastY) {
        header.classList.remove('site-header--hidden');
      }
      lastY = y;

      if (hero && pill) {
        var pillBottom = header.offsetTop + pill.offsetHeight;
        var heroBottom = hero.getBoundingClientRect().bottom;
        header.classList.toggle('site-header--light', heroBottom <= pillBottom);
      }
    };

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* --- Site language switch -------------------------------- */
  var languageToggle = document.getElementById('languageToggle');
  var translatedNodes = document.querySelectorAll('[data-ru][data-en]');
  if (languageToggle) {
    var setLanguage = function (language) {
      translatedNodes.forEach(function (node) {
        var value = node.getAttribute('data-' + language);
        if (node.getAttribute('data-html') === 'true') {
          node.innerHTML = value;
        } else {
          node.textContent = value;
        }
      });

      document.documentElement.lang = language;
      var localeCode = languageToggle.querySelector('.locale-code');
      if (localeCode) localeCode.textContent = language === 'ru' ? 'EN' : 'RU';
      else languageToggle.textContent = language === 'ru' ? 'EN' : 'RU';
      languageToggle.setAttribute('aria-label', language === 'ru' ? 'Переключить на английский' : 'Switch to Russian');
      var localizedTitle = document.documentElement.getAttribute('data-title-' + language);
      if (localizedTitle) document.title = localizedTitle;

      var description = document.querySelector('meta[name="description"]');
      var localizedDescription = document.documentElement.getAttribute('data-description-' + language);
      if (description && localizedDescription) description.setAttribute('content', localizedDescription);
      document.querySelectorAll('[data-placeholder-ru][data-placeholder-en]').forEach(function (node) {
        node.placeholder = node.getAttribute('data-placeholder-' + language);
      });
      document.querySelectorAll('[data-aria-ru][data-aria-en]').forEach(function (node) {
        node.setAttribute('aria-label', node.getAttribute('data-aria-' + language));
      });
      document.querySelectorAll('.photos-grid__item').forEach(function (node, index) {
        node.setAttribute('aria-label', (language === 'ru' ? 'Открыть фото ' : 'Open photo ') + (index + 1));
      });

      try { localStorage.setItem('portfolio-language', language); } catch (e) { /* private mode */ }
      document.dispatchEvent(new CustomEvent('portfolio:language', { detail: { language: language } }));
    };

    var savedLanguage = null;
    try { savedLanguage = localStorage.getItem('portfolio-language') || localStorage.getItem('force-case-language'); } catch (e) { /* private mode */ }
    setLanguage(savedLanguage === 'en' ? 'en' : 'ru');
    languageToggle.addEventListener('click', function () {
      setLanguage(document.documentElement.lang === 'ru' ? 'en' : 'ru');
    });
  }

  /* --- Chat overlay → Telegram ----------------------------- */
  var TG_TOKEN = '8866080289:AAHEmRFxCWt7eFkYnB7yw8bSCuRG4_sTM20';
  var TG_CHAT_ID = '6793196451';

  var overlay = document.getElementById('chatOverlay');
  var openBtn = document.getElementById('chatOpen');
  if (overlay && openBtn) {
    var closeBtn = document.getElementById('chatClose');
    var form = document.getElementById('chatForm');
    var status = document.getElementById('chatStatus');

    var openChat = function (e) {
      e.preventDefault();
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };
    var closeChat = function () {
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };
    openBtn.addEventListener('click', openChat);
    closeBtn.addEventListener('click', closeChat);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeChat(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeChat();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = form.email.value.trim();
      var name = form.name.value.trim();
      var note = form.note.value.trim();
      status.hidden = false;
      var isRussian = document.documentElement.lang === 'ru';
      if (!email || !name || !note) { status.textContent = isRussian ? 'Заполни все поля.' : 'Please fill in all fields.'; return; }

      var btn = form.querySelector('.chat-send');
      btn.disabled = true;
      status.textContent = isRussian ? 'Отправляю…' : 'Sending…';

      var text = '📩 New message from the portfolio\n\n' +
                 'Name: ' + name + '\n' +
                 'E-mail: ' + email + '\n' +
                 'Note: ' + note;

      fetch('https://api.telegram.org/bot' + TG_TOKEN + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TG_CHAT_ID, text: text })
      }).then(function (r) { return r.json(); }).then(function (d) {
        if (d.ok) {
          status.textContent = isRussian ? 'Отправлено. Скоро отвечу.' : 'Sent. I’ll get back to you soon.';
          form.reset();
          setTimeout(closeChat, 1600);
        } else { throw new Error(d.description || 'error'); }
      }).catch(function () {
        status.textContent = isRussian ? 'Не удалось отправить. Напиши на alekseydesgn@gmail.com' : 'Could not send — write me at alekseydesgn@gmail.com';
      }).finally(function () { btn.disabled = false; });
    });
  }

  /* --- Photos overlay (About page) -------------------------- */
  var photosOverlay = document.getElementById('photosOverlay');
  var photosOpen = document.getElementById('photosOpen');
  if (photosOverlay && photosOpen) {
    var photosClose = document.getElementById('photosClose');
    var photosViewer = document.getElementById('photosViewer');
    var photosCurrent = document.getElementById('photosCurrent');
    var photoItems = Array.from(document.querySelectorAll('.photos-grid__item'));
    var photosThumbs = document.getElementById('photosThumbs');
    var photoCursor = document.getElementById('photoCursor');
    var thumbButtons = [];
    var currentPhoto = 0;
    if (photosThumbs) {
      photoItems.forEach(function (item, index) {
        var thumb = document.createElement('button');
        thumb.type = 'button';
        thumb.className = 'photos-viewer__thumb';
        thumb.setAttribute('aria-label', (document.documentElement.lang === 'ru' ? 'Показать фото ' : 'Show photo ') + (index + 1));
        thumb.innerHTML = '<img src="' + item.querySelector('img').getAttribute('src') + '" alt="">';
        thumb.addEventListener('click', function () { showPhoto(index); });
        photosThumbs.appendChild(thumb);
        thumbButtons.push(thumb);
      });
    }
    var showPhoto = function (index) {
      currentPhoto = (index + photoItems.length) % photoItems.length;
      photosCurrent.src = photoItems[currentPhoto].querySelector('img').src;
      photosCurrent.alt = (document.documentElement.lang === 'ru' ? 'Фотография ' : 'Photo ') + (currentPhoto + 1);
      thumbButtons.forEach(function (thumb, thumbIndex) { thumb.classList.toggle('is-active', thumbIndex === currentPhoto); });
      if (thumbButtons[currentPhoto]) thumbButtons[currentPhoto].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      photosViewer.hidden = false;
      photosOverlay.querySelector('.photos-overlay__inner').classList.add('is-viewing');
      document.getElementById('photosBack').hidden = false;
      document.getElementById('photosBack').focus();
    };
    var showPhotoGrid = function () {
      photosViewer.hidden = true;
      photosOverlay.querySelector('.photos-overlay__inner').classList.remove('is-viewing');
      document.getElementById('photosBack').hidden = true;
      photoItems[currentPhoto].focus();
    };
    var openPhotos = function () {
      photosOverlay.classList.add('is-open');
      photosOverlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      photosClose.focus();
    };
    var closePhotos = function () {
      photosOverlay.classList.remove('is-open');
      photosOverlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      photosViewer.hidden = true;
      photosOverlay.querySelector('.photos-overlay__inner').classList.remove('is-viewing');
      document.getElementById('photosBack').hidden = true;
      photosOpen.focus();
    };
    photosOpen.addEventListener('click', openPhotos);
    photosClose.addEventListener('click', closePhotos);
    photoItems.forEach(function (item, index) { item.addEventListener('click', function () { showPhoto(index); }); });
    document.getElementById('photosBack').addEventListener('click', showPhotoGrid);
    document.getElementById('photosPrev').addEventListener('click', function () { showPhoto(currentPhoto - 1); });
    document.getElementById('photosNext').addEventListener('click', function () { showPhoto(currentPhoto + 1); });
    photosOverlay.addEventListener('click', function (e) { if (e.target === photosOverlay) closePhotos(); });
    if (photoCursor && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
      var cursorX = 0, cursorY = 0, targetX = 0, targetY = 0;
      var cursorFrame = 0;
      var moveCursor = function () {
        cursorX += (targetX - cursorX) * .16;
        cursorY += (targetY - cursorY) * .16;
        photoCursor.style.left = cursorX + 'px';
        photoCursor.style.top = cursorY + 'px';
        if (Math.abs(targetX - cursorX) + Math.abs(targetY - cursorY) > .2) cursorFrame = requestAnimationFrame(moveCursor);
        else cursorFrame = 0;
      };
      photoItems.forEach(function (item) {
        item.addEventListener('mouseenter', function (e) {
          cursorX = targetX = e.clientX;
          cursorY = targetY = e.clientY;
          photoCursor.style.left = cursorX + 'px';
          photoCursor.style.top = cursorY + 'px';
          photoCursor.classList.add('is-visible');
        });
        item.addEventListener('mouseleave', function () { photoCursor.classList.remove('is-visible'); });
        item.addEventListener('mousemove', function (e) {
          targetX = e.clientX;
          targetY = e.clientY;
          if (!cursorFrame) cursorFrame = requestAnimationFrame(moveCursor);
        });
      });
    }
    document.addEventListener('keydown', function (e) {
      if (!photosOverlay.classList.contains('is-open')) return;
      if (e.key === 'Escape') { if (!photosViewer.hidden) showPhotoGrid(); else closePhotos(); }
      if (!photosViewer.hidden && e.key === 'ArrowLeft') showPhoto(currentPhoto - 1);
      if (!photosViewer.hidden && e.key === 'ArrowRight') showPhoto(currentPhoto + 1);
    });
  }

  var booksOverlay = document.getElementById('booksOverlay');
  var booksOpen = document.getElementById('booksOpen');
  if (booksOverlay && booksOpen) {
    var booksTrack = document.getElementById('booksTrack');
    var books = Array.from(booksTrack.querySelectorAll('.book'));
    var bookVelocity = 0;
    var bookFrame = 0;
    var bookTarget = function (book) {
      return booksTrack.scrollLeft + book.getBoundingClientRect().left - booksTrack.getBoundingClientRect().left;
    };
    var nearestBook = function () {
      return books.reduce(function (best, book) {
        return Math.abs(bookTarget(book) - booksTrack.scrollLeft) < Math.abs(bookTarget(best) - booksTrack.scrollLeft) ? book : best;
      }, books[0]);
    };
    var settleBooks = function () {
      booksTrack.classList.remove('is-gliding');
      if (books.length) booksTrack.scrollTo({ left: bookTarget(nearestBook()), behavior: 'smooth' });
    };
    var glideBooks = function () {
      booksTrack.scrollLeft += bookVelocity;
      bookVelocity *= .84;
      if (Math.abs(bookVelocity) > .35) bookFrame = requestAnimationFrame(glideBooks);
      else { bookFrame = 0; settleBooks(); }
    };
    booksTrack.addEventListener('wheel', function (e) {
      if (booksTrack.scrollWidth <= booksTrack.clientWidth) return;
      e.preventDefault();
      booksTrack.classList.add('is-gliding');
      bookVelocity = Math.max(-24, Math.min(24, bookVelocity + (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * .2));
      if (!bookFrame) bookFrame = requestAnimationFrame(glideBooks);
    }, { passive: false });
    var stepBooks = function (direction) {
      if (!books.length) return;
      cancelAnimationFrame(bookFrame);
      bookFrame = 0;
      bookVelocity = 0;
      booksTrack.classList.remove('is-gliding');
      var current = books.indexOf(nearestBook());
      var next = books[Math.max(0, Math.min(books.length - 1, current + direction))];
      booksTrack.scrollTo({ left: bookTarget(next), behavior: 'smooth' });
    };
    var closeBooks = function () {
      cancelAnimationFrame(bookFrame);
      bookFrame = 0;
      bookVelocity = 0;
      booksTrack.classList.remove('is-gliding');
      booksOverlay.classList.remove('is-open');
      booksOverlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      booksOpen.focus();
    };
    booksOpen.addEventListener('click', function () {
      booksOverlay.classList.add('is-open');
      booksOverlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      document.getElementById('booksClose').focus();
    });
    document.getElementById('booksClose').addEventListener('click', closeBooks);
    booksOverlay.addEventListener('click', function (e) { if (e.target === booksOverlay) closeBooks(); });
    document.getElementById('booksPrev').addEventListener('click', function () { stepBooks(-1); });
    document.getElementById('booksNext').addEventListener('click', function () { stepBooks(1); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && booksOverlay.classList.contains('is-open')) closeBooks(); });
  }

  /* --- Dentalogica: "coming soon" badge follows the cursor
         (appears to the top-left of it) ------------------------- */
  var soonWork = document.querySelector('.work--soon');
  var badge = document.querySelector('.soon-badge');
  if (soonWork && badge) {
    var move = function (e) {
      badge.style.left = (e.clientX - badge.offsetWidth - 14) + 'px';
      badge.style.top = (e.clientY - badge.offsetHeight - 14) + 'px';
    };
    soonWork.addEventListener('mouseenter', function (e) { move(e); badge.classList.add('is-on'); });
    soonWork.addEventListener('mousemove', move);
    soonWork.addEventListener('mouseleave', function () { badge.classList.remove('is-on'); });
  }
})();
