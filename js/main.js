(function () {
  const mileKeys = ["energy", "mobility", "safety", "data"];
  const cards = Array.from(document.querySelectorAll("[data-component='mile-card']"));
  const quickItems = Array.from(document.querySelectorAll("[data-mile-target]"));
  const pauseButton = document.querySelector(".js-pause");
  const stage = document.querySelector(".map-stage");
  const movingObjects = Array.from(document.querySelectorAll("[data-follow-path]"));
  const topButton = document.querySelector(".top-button");
  let activeMile = "energy";
  let slideIndex = 0;
  let paused = false;
  let slideTimer = null;

  function setActiveMile(key, shouldScroll) {
    activeMile = key;
    slideIndex = 0;

    cards.forEach((card) => {
      const isActive = card.dataset.mile === key;
      card.classList.toggle("is-active", isActive);
      setCardSlide(card, 0);
    });

    quickItems.forEach((item) => {
      const isTarget = item.dataset.mileTarget === key;
      item.classList.toggle("is-active", isTarget);
      const icon = item.querySelector("[data-icon-on]");
      if (icon) {
        icon.src = isTarget ? icon.dataset.iconOn : icon.dataset.iconOff;
      }
    });

    if (shouldScroll) {
      if (key === "energy") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const target = document.getElementById(key);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function setCardSlide(card, index) {
    const slides = Array.from(card.querySelectorAll(".mile-slide"));
    const dots = Array.from(card.querySelectorAll(".mile-card__pager span"));

    slides.forEach((slide, slidePosition) => {
      slide.classList.toggle("is-active", slidePosition === index);
    });

    dots.forEach((dot, dotPosition) => {
      dot.classList.toggle("is-on", dotPosition === index);
    });
  }

  function tickSlide() {
    if (paused) return;
    slideIndex = (slideIndex + 1) % 2;
    cards.forEach((card) => {
      if (card.dataset.mile === activeMile) {
        setCardSlide(card, slideIndex);
      }
    });
  }

  function resetTimer() {
    if (slideTimer) window.clearInterval(slideTimer);
    slideTimer = window.setInterval(tickSlide, 4800);
  }

  function initModalCarousel(modal) {
    const slides = Array.from(modal.querySelectorAll(".m-slide"));
    const dots = Array.from(modal.querySelectorAll(".m-dot"));
    const playBtn = modal.querySelector(".m-playbtn");
    const ring = modal.querySelector(".m-ring-fg");
    const ringLength = 72.26;
    const interval = Number(modal.dataset.interval || 8000);
    let index = 0;
    let playing = true;
    let rafId = 0;
    let startTs = 0;
    let elapsedAtPause = 0;

    if (!slides.length || !dots.length || !playBtn || !ring) return;

    function go(next) {
      if (next === index) return;
      const current = slides[index];
      const target = slides[next];

      current.classList.remove("active");
      current.classList.add("exit-left");
      target.classList.remove("exit-left");

      target.querySelectorAll(".bar").forEach((bar) => {
        bar.style.animation = "none";
        void bar.offsetWidth;
        bar.style.animation = "";
      });

      window.requestAnimationFrame(() => target.classList.add("active"));
      window.setTimeout(() => current.classList.remove("exit-left"), 600);

      dots[index]?.classList.remove("active");
      dots[next]?.classList.add("active");
      index = next;
      restartProgress();
    }

    function frame(ts) {
      if (!playing) return;
      if (!startTs) startTs = ts - elapsedAtPause;

      const elapsed = ts - startTs;
      const pct = Math.min(elapsed / interval, 1);
      ring.style.strokeDashoffset = (ringLength * (1 - pct)).toFixed(2);

      if (pct >= 1) {
        elapsedAtPause = 0;
        startTs = 0;
        go((index + 1) % slides.length);
        return;
      }

      rafId = window.requestAnimationFrame(frame);
    }

    function restartProgress() {
      window.cancelAnimationFrame(rafId);
      elapsedAtPause = 0;
      startTs = 0;
      ring.style.strokeDashoffset = ringLength;
      if (playing) rafId = window.requestAnimationFrame(frame);
    }

    function setPlaying(nextPlaying) {
      playing = nextPlaying;
      if (playing) {
        playBtn.classList.remove("paused");
        playBtn.setAttribute("aria-label", "일시정지");
        startTs = 0;
        rafId = window.requestAnimationFrame(frame);
      } else {
        playBtn.classList.add("paused");
        playBtn.setAttribute("aria-label", "재생");
        window.cancelAnimationFrame(rafId);
        const currentOffset = Number.parseFloat(ring.style.strokeDashoffset || ringLength);
        elapsedAtPause = (1 - currentOffset / ringLength) * interval;
      }
    }

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const next = Number(dot.dataset.i || 0);
        go(next);
      });
    });

    playBtn.addEventListener("click", () => setPlaying(!playing));
    restartProgress();
  }

  quickItems.forEach((item) => {
    item.addEventListener("click", () => {
      const key = item.dataset.mileTarget;
      if (!mileKeys.includes(key)) return;
      setActiveMile(key, true);
      resetTimer();
    });
  });

  cards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      const key = card.dataset.mile;
      if (!mileKeys.includes(key)) return;
      setActiveMile(key, false);
    });
  });

  if (pauseButton) {
    pauseButton.addEventListener("click", () => {
      paused = !paused;
      pauseButton.textContent = paused ? "▶" : "Ⅱ";
      pauseButton.setAttribute("aria-label", paused ? "슬라이드 다시 재생" : "슬라이드 일시 정지");
    });
  }

  if (topButton) {
    topButton.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function initPathFollowers() {
    if (!stage || movingObjects.length === 0) return;

    const followers = movingObjects
      .map((element) => {
        const pathId = element.dataset.followPath;
        const path = pathId ? document.getElementById(pathId) : null;
        if (!path || typeof path.getTotalLength !== "function") return null;

        return {
          element,
          path,
          length: path.getTotalLength(),
          duration: Number(element.dataset.duration || 16000),
          angleOffset: Number(element.dataset.angleOffset || 0),
          progressOffset: Number(element.dataset.progressOffset || 0),
        };
      })
      .filter(Boolean);

    if (followers.length === 0) return;

    const viewBoxWidth = 1920;
    const viewBoxHeight = 3139;
    const sampleGap = 8;

    function placeFollowers(time) {
      const rect = stage.getBoundingClientRect();
      const scaleX = rect.width / viewBoxWidth;
      const scaleY = rect.height / viewBoxHeight;

      followers.forEach((follower) => {
        const rawProgress = ((time % follower.duration) / follower.duration + follower.progressOffset) % 1;
        const currentDistance = follower.length * rawProgress;
        const nextDistance = (currentDistance + sampleGap) % follower.length;
        const current = follower.path.getPointAtLength(currentDistance);
        const next = follower.path.getPointAtLength(nextDistance);
        const dx = (next.x - current.x) * scaleX;
        const dy = (next.y - current.y) * scaleY;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI + follower.angleOffset;
        const x = current.x * scaleX;
        const y = current.y * scaleY;

        follower.element.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${angle}deg)`;
      });

      window.requestAnimationFrame(placeFollowers);
    }

    window.requestAnimationFrame(placeFollowers);
  }

  setActiveMile(activeMile, false);
  resetTimer();
  initPathFollowers();
  document.querySelectorAll(".modal-layer .modal").forEach(initModalCarousel);
})();
