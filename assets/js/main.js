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
      if (!email || !name || !note) { status.textContent = 'Please fill in all fields.'; return; }

      var btn = form.querySelector('.chat-send');
      btn.disabled = true;
      status.textContent = 'Sending…';

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
          status.textContent = 'Sent ✓ I’ll get back to you soon.';
          form.reset();
          setTimeout(closeChat, 1600);
        } else { throw new Error(d.description || 'error'); }
      }).catch(function () {
        status.textContent = 'Could not send — write me at alekseydesgn@gmail.com';
      }).finally(function () { btn.disabled = false; });
    });
  }

  /* --- Photos overlay (About page) -------------------------- */
  var photosOverlay = document.getElementById('photosOverlay');
  var photosOpen = document.getElementById('photosOpen');
  if (photosOverlay && photosOpen) {
    var photosClose = document.getElementById('photosClose');
    var openPhotos = function () {
      photosOverlay.classList.add('is-open');
      photosOverlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };
    var closePhotos = function () {
      photosOverlay.classList.remove('is-open');
      photosOverlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };
    photosOpen.addEventListener('click', openPhotos);
    photosClose.addEventListener('click', closePhotos);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && photosOverlay.classList.contains('is-open')) closePhotos();
    });
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
