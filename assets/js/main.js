(function () {
  var header = document.querySelector('.site-header');
  var pill = document.querySelector('.pill--home');
  var hero = document.querySelector('.hero__panel');

  /* --- header: hide on scroll down, show on scroll up;
         turns white after crossing the hero frame ------------- */
  if (header && pill && hero) {
    var lastY = window.scrollY;

    var update = function () {
      var y = window.scrollY;

      // hide going down, show going up
      if (y > lastY && y > 140) {
        header.classList.add('site-header--hidden');
      } else if (y < lastY) {
        header.classList.remove('site-header--hidden');
      }
      lastY = y;

      // light style only after the pill has crossed the hero frame edge
      var pillBottom = header.offsetTop + pill.offsetHeight;
      var heroBottom = hero.getBoundingClientRect().bottom;
      header.classList.toggle('site-header--light', heroBottom <= pillBottom);
    };

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* --- Dentalogica: “coming soon” badge follows the cursor
         (appears to the top-left of it) ---------------------- */
  var soonWork = document.querySelector('.work--soon');
  var badge = document.querySelector('.soon-badge');
  if (soonWork && badge) {
    var move = function (e) {
      badge.style.left = (e.clientX - badge.offsetWidth - 14) + 'px';
      badge.style.top = (e.clientY - badge.offsetHeight - 14) + 'px';
    };
    soonWork.addEventListener('mouseenter', function (e) {
      move(e);
      badge.classList.add('is-on');
    });
    soonWork.addEventListener('mousemove', move);
    soonWork.addEventListener('mouseleave', function () {
      badge.classList.remove('is-on');
    });
  }
})();
