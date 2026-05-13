/**
 * Building Hover + Click — Simple image overlay approach
 * No Lottie manipulation. Just shows/hides a pre-designed hover PNG.
 */
(function () {
  'use strict';

  var BUILDINGS = {
    energy: {
      name: '에너지 마일',
      subtitle: '신재생에너지 생산 · 가상거래 현황',
      color: '#0C8AE5',
      particleColor: '#37EEFE',
      icon: '⚡',
      hoverImgId: 'hover-img-energy',
    },
    mobility: {
      name: '모빌리티 마일',
      subtitle: '친환경 이동 서비스 통합 운영 현황',
      color: '#06A85B',
      particleColor: '#37EEFE',
      icon: '🚗',
      hoverImgId: 'hover-img-mobility',
    },
    safety: {
      name: '세이프티 마일',
      subtitle: 'AIoT 침수·홍수 통합관제 현황',
      color: '#EC8913',
      particleColor: '#37EEFE',
      icon: '🛡️',
      hoverImgId: 'hover-img-safety',
    },
    data: {
      name: '데이터 마일',
      subtitle: '탄소 거래·데이터 통합 플랫폼 현황',
      color: '#636CCC',
      particleColor: '#37EEFE',
      icon: '📊',
      hoverImgId: 'hover-img-data',
    },
  };

  /* ── Accent color map for modals ── */
  var ACCENT_MAP = {
    energy:   { accent: '#0C8AE5', gradient: 'linear-gradient(135deg,#0C8AE5cc,#0C8AE5)' },
    mobility: { accent: '#06A85B', gradient: 'linear-gradient(135deg,#06A85Bcc,#06A85B)' },
    safety:   { accent: '#EC8913', gradient: 'linear-gradient(135deg,#EC8913cc,#EC8913)' },
    data:     { accent: '#636CCC', gradient: 'linear-gradient(135deg,#636CCCcc,#636CCC)' },
  };

  /* ── BSS Station Data (Mobility only) ── */
  var BSS_DATA = [
    { name: '광명역 BSS',    addr: '광명시 일직로 72',  status: 'active',  avail: 8,  total: 12, swaps: 42 },
    { name: '철산역 BSS',    addr: '광명시 철산로 10',  status: 'active',  avail: 6,  total: 10, swaps: 36 },
    { name: '하안동 BSS',    addr: '광명시 하안로 60',  status: 'active',  avail: 5,  total: 8,  swaps: 28 },
    { name: '소하동 BSS',    addr: '광명시 소하로 48',  status: 'maint',   avail: 3,  total: 10, swaps: 18 },
    { name: '광명사거리 BSS', addr: '광명시 광명로 76',  status: 'active',  avail: 7,  total: 10, swaps: 31 },
    { name: '옥길동 BSS',    addr: '광명시 옥길로 15',  status: 'active',  avail: 9,  total: 12, swaps: 25 },
  ];

  /* ── DOM ─────────────────────────── */
  var overlay = document.getElementById('building-modal-overlay');
  if (!overlay) return;
  var modal     = overlay.querySelector('.bldg-modal');
  var modalBody = overlay.querySelector('.bldg-modal__body');
  var modalTitle = overlay.querySelector('.bldg-modal__title');
  var modalSub  = overlay.querySelector('.bldg-modal__subtitle');
  var modalIcon = overlay.querySelector('.bldg-modal__icon');
  var closeBtn  = overlay.querySelector('.bldg-modal__close');
  var backdrop  = overlay.querySelector('.bldg-modal-backdrop');

  /* ── Pulse state ────────────────── */
  var pulseId = null;
  var currentImg = null;

  function startPulse(img) {
    currentImg = img;
    currentImg.style.opacity = '1';
    var start = performance.now();
    function tick(now) {
      var t = (now - start) / 1000;
      var v = 0.6 + 0.4 * Math.sin(t * 2.5);
      currentImg.style.opacity = v.toFixed(2);
      pulseId = requestAnimationFrame(tick);
    }
    pulseId = requestAnimationFrame(tick);
  }

  function stopPulse() {
    if (pulseId) { cancelAnimationFrame(pulseId); pulseId = null; }
    if (currentImg) { currentImg.style.opacity = '0'; currentImg = null; }
  }

  /* ── Particles ──────────────────── */
  var pTimer = null;

  function spawnParticles(zone, color) {
    var stage = document.querySelector('.map-stage');
    if (!stage) return;
    var r = zone.getBoundingClientRect();
    var sr = stage.getBoundingClientRect();
    var cx = r.left - sr.left + r.width / 2;
    var topY = r.top - sr.top;

    for (var i = 0; i < 3; i++) {
      var d = document.createElement('div');
      var sz = 2 + Math.random() * 4;
      var ox = (Math.random() - 0.5) * r.width * 0.6;
      d.style.cssText =
        'position:absolute;z-index:6;pointer-events:none;border-radius:50%;' +
        'left:' + (cx + ox) + 'px;top:' + (topY + Math.random() * r.height * 0.5) + 'px;' +
        'width:' + sz + 'px;height:' + sz + 'px;background:' + color + ';opacity:0;' +
        'box-shadow:0 0 ' + sz*3 + 'px ' + color + ';';
      stage.appendChild(d);
      var dur = 1400 + Math.random() * 800;
      var rise = 50 + Math.random() * 50;
      d.animate([
        { opacity: 0, transform: 'translateY(0) scale(0.5)' },
        { opacity: 0.7, transform: 'translateY(-' + rise*0.4 + 'px) scale(1)' },
        { opacity: 0, transform: 'translateY(-' + rise + 'px) scale(0.2)' },
      ], { duration: dur, easing: 'ease-out', fill: 'forwards' });
      setTimeout(function(el){ el.remove(); }, dur + 50, d);
    }
  }

  /* ── Hover + Click on each building zone ── */
  document.querySelectorAll('.bldg-zone').forEach(function (zone) {
    var key = zone.dataset.building;
    var info = BUILDINGS[key];
    if (!info) return;

    var hoverImg = document.getElementById(info.hoverImgId);

    zone.addEventListener('mouseenter', function () {
      if (overlay.classList.contains('is-open')) return;
      if (hoverImg) startPulse(hoverImg);
      spawnParticles(zone, info.particleColor);
      pTimer = setInterval(function(){ spawnParticles(zone, info.particleColor); }, 1100);
    });

    zone.addEventListener('mouseleave', function () {
      stopPulse();
      if (pTimer) { clearInterval(pTimer); pTimer = null; }
    });

    zone.addEventListener('click', function () {
      // Stop effects before opening modal
      stopPulse();
      if (pTimer) { clearInterval(pTimer); pTimer = null; }
      openModal(key, info);
    });
  });

  /* ── BSS Section Builder ───────── */
  function buildBssSection() {
    var totalAvail = 0, totalCap = 0;
    BSS_DATA.forEach(function(s) { totalAvail += s.avail; totalCap += s.total; });
    var pct = Math.round(totalAvail / totalCap * 100);

    var html = '<div class="bss-section">';
    html += '<div class="bss-header">';
    html += '<div class="bss-header__icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="6" y="3" width="12" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/><line x1="10" y1="7" x2="14" y2="7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><rect x="9" y="10" width="6" height="4" rx="1" fill="currentColor" opacity=".3"/><circle cx="12" cy="17" r="1.2" fill="currentColor"/></svg></div>';
    html += '<div class="bss-header__title">BSS 배터리 교환 스테이션 현황</div>';
    html += '</div>';

    // Summary bar
    html += '<div class="bss-summary">';
    html += '<div class="bss-summary__meta"><span class="bss-summary__count">총 <strong>' + BSS_DATA.length + '</strong>개소</span>';
    html += '<span class="bss-summary__avail">가용 배터리 <strong>' + totalAvail + '</strong> / ' + totalCap + '</span></div>';
    html += '<div class="bss-progress"><div class="bss-progress__bar" style="width:' + pct + '%"></div></div>';
    html += '<div class="bss-progress__pct">' + pct + '%</div>';
    html += '</div>';

    // Station list
    html += '<div class="bss-list">';
    BSS_DATA.forEach(function(s) {
      var statusCls = s.status === 'active' ? 'bss-status--active' : 'bss-status--maint';
      var statusTxt = s.status === 'active' ? '운영중' : '점검중';
      var batteryPct = Math.round(s.avail / s.total * 100);

      html += '<div class="bss-item">';
      html += '<div class="bss-item__status ' + statusCls + '"></div>';
      html += '<div class="bss-item__info">';
      html += '<div class="bss-item__name">' + s.name + '</div>';
      html += '<div class="bss-item__addr">' + s.addr + '</div>';
      html += '</div>';
      html += '<div class="bss-item__battery">';
      html += '<div class="bss-battery-bar"><div class="bss-battery-fill" style="width:' + batteryPct + '%"></div></div>';
      html += '<span class="bss-battery-label">' + s.avail + '/' + s.total + '</span>';
      html += '</div>';
      html += '<div class="bss-item__swaps"><strong>' + s.swaps + '</strong><span>회/일</span></div>';
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';

    return html;
  }

  /* ── Modal ────────────────────────── */
  function openModal(key, info) {
    var accentInfo = ACCENT_MAP[key] || ACCENT_MAP.energy;

    try {
      var src = document.querySelector('[data-mile="' + key + '"]');
      if (src && modalBody) {
        var body = src.querySelector('.m-body');
        if (body) {
          modalBody.innerHTML = body.innerHTML;
          modalBody.querySelectorAll('.m-slide').forEach(function (s, i) {
            s.classList.add('active');
            s.classList.remove('exit-left');
            s.style.cssText = 'position:relative;opacity:1;visibility:visible;transform:none;pointer-events:auto;';
            if (i > 0) s.style.cssText += 'margin-top:20px;padding-top:20px;border-top:1px solid #eee;';
          });
        }

        // Append BSS section for mobility
        if (key === 'mobility') {
          var bssHtml = buildBssSection();
          var bssContainer = document.createElement('div');
          bssContainer.style.cssText = 'margin-top:20px;padding-top:20px;border-top:1px solid #eee;';
          bssContainer.innerHTML = bssHtml;
          modalBody.appendChild(bssContainer);
        }
      }
      if (modalTitle) modalTitle.textContent = info.name;
      if (modalSub) modalSub.textContent = info.subtitle;
      if (modalIcon) {
        modalIcon.textContent = info.icon;
        modalIcon.style.background = accentInfo.gradient;
      }
      if (modal) modal.style.setProperty('--modal-accent', accentInfo.accent);
    } catch (e) {
      console.warn('[BI] Modal error:', e);
    }
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    stopPulse();
    if (pTimer) { clearInterval(pTimer); pTimer = null; }
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeModal();
  });

})();
