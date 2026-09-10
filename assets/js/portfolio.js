(function(){
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isTouch = !window.matchMedia("(hover:hover) and (pointer:fine)").matches;

  /* ---------- preloader ---------- */
  var preloader = document.querySelector(".preloader");
  var counter = document.querySelector(".preloader__count");
  if (preloader && counter) {
    var n = 0;
    var tick = setInterval(function () {
      n += Math.ceil(Math.random() * 18);
      if (n >= 100) { n = 100; clearInterval(tick); finishPreload(); }
      counter.textContent = n + "%";
    }, 90);
    function finishPreload(){
      setTimeout(function(){
        preloader.classList.add("is-done");
        document.body.classList.add("is-loaded");
        setTimeout(function(){ preloader.remove(); }, 1000);
      }, 250);
    }
    // safety: never block the page for more than ~2.5s
    setTimeout(function(){ if (document.body.contains(preloader)) finishPreload(); }, 2500);
  } else {
    document.body.classList.add("is-loaded");
  }

  /* ---------- mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { nav.classList.remove("is-open"); });
    });
  }

  /* ---------- custom cursor ---------- */
  if (!isTouch && !reduceMotion) {
    var dot = document.querySelector(".cursor");
    var ring = document.querySelector(".cursor-ring");
    if (dot && ring) {
      var mx = 0, my = 0, rx = 0, ry = 0;
      window.addEventListener("mousemove", function (e) {
        mx = e.clientX; my = e.clientY;
        dot.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
      });
      (function loop(){
        rx += (mx - rx) * 0.15;
        ry += (my - ry) * 0.15;
        ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
        requestAnimationFrame(loop);
      })();
      document.querySelectorAll("a, button, [data-magnetic]").forEach(function (el) {
        el.addEventListener("mouseenter", function () { ring.classList.add("is-active"); });
        el.addEventListener("mouseleave", function () { ring.classList.remove("is-active"); });
      });
    }
  }

  /* ---------- magnetic buttons ---------- */
  if (!isTouch && !reduceMotion) {
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var relX = e.clientX - r.left - r.width / 2;
        var relY = e.clientY - r.top - r.height / 2;
        el.style.transform = "translate(" + relX * 0.35 + "px," + relY * 0.35 + "px)";
      });
      el.addEventListener("mouseleave", function () {
        el.style.transform = "translate(0,0)";
      });
    });
  }

  /* ---------- hero headline split-reveal ---------- */
  document.querySelectorAll(".hero h1 .line span").forEach(function (span, i) {
    span.style.transform = "translateY(110%)";
    span.style.transition = "transform .9s " + (0.55 + i * 0.12) + "s cubic-bezier(.16,.84,.24,1)";
  });
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      document.querySelectorAll(".hero h1 .line span").forEach(function (span) {
        span.style.transform = "translateY(0)";
      });
    });
  });

  /* ---------- scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, idx) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var delay = el.dataset.delay || 0;
          setTimeout(function () {
            el.style.transition = "opacity .8s cubic-bezier(.16,.84,.24,1), transform .8s cubic-bezier(.16,.84,.24,1)";
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
          }, Number(delay));
          io.unobserve(el);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.style.opacity = 1; el.style.transform = "none"; });
  }

  /* ---------- header contrast on scroll (mix-blend already handles most) ---------- */
  var header = document.querySelector(".site-header");
  var lastY = window.scrollY;
  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    if (header) header.style.transform = (y > lastY && y > 200) ? "translateY(-110%)" : "translateY(0)";
    lastY = y;
  }, { passive: true });

  /* ---------- footer year ---------- */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- live local time ---------- */
  var clockEl = document.querySelector("[data-clock]");
  if (clockEl) {
    var fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit"
    });
    var updateClock = function () { clockEl.textContent = "Jakarta — " + fmt.format(new Date()) + " WIB"; };
    updateClock();
    setInterval(updateClock, 15000);
  }

  /* ---------- live GitHub stats ---------- */
  var GH_USER = "Stevnatsan";

  function setStat(key, value) {
    var el = document.querySelector('[data-stat="' + key + '"]');
    if (el) el.textContent = value;
  }

  fetch("https://api.github.com/users/" + GH_USER)
    .then(function (r) { if (!r.ok) throw new Error("github " + r.status); return r.json(); })
    .then(function (d) {
      setStat("repos", d.public_repos);
      setStat("followers", d.followers);
      setStat("since", new Date(d.created_at).getFullYear());
    })
    .catch(function () { /* placeholders stay as em-dashes */ });

  /* ---------- contribution heatmap ---------- */
  var heatmap = document.getElementById("heatmap");
  var heatmapTotal = document.getElementById("heatmap-total");

  function level(count) {
    if (count === 0) return 0;
    if (count < 3) return 1;
    if (count < 6) return 2;
    if (count < 9) return 3;
    return 4;
  }

  function renderHeatmap(calendar) {
    heatmap.innerHTML = "";
    heatmap.classList.remove("heatmap--fallback");
    calendar.weeks.forEach(function (week) {
      week.contributionDays.forEach(function (day) {
        var cell = document.createElement("div");
        cell.className = "heatmap__day";
        cell.dataset.level = level(day.contributionCount);
        cell.title = day.date + " — " + day.contributionCount + " contributions";
        heatmap.appendChild(cell);
      });
    });
    if (heatmapTotal) {
      heatmapTotal.textContent = calendar.totalContributions.toLocaleString() + " contributions in the last year";
    }
  }

  // Falls back to a third-party activity graph when the serverless
  // function isn't reachable (e.g. opened as a plain static file).
  function renderHeatmapFallback() {
    heatmap.classList.add("heatmap--fallback");
    heatmap.innerHTML =
      '<img src="https://github-readme-activity-graph.vercel.app/graph?username=' + GH_USER +
      '&bg_color=00000000&color=14120f&line=d7ff3f&point=14120f&hide_border=true&area=true" ' +
      'alt="GitHub contribution activity graph" loading="lazy" />';
    if (heatmapTotal) heatmapTotal.textContent = "Contribution activity, last year";
  }

  if (heatmap) {
    fetch("/api/contributions")
      .then(function (r) { if (!r.ok) throw new Error("api " + r.status); return r.json(); })
      .then(function (data) {
        if (!data || !data.weeks) throw new Error("bad payload");
        renderHeatmap(data);
      })
      .catch(renderHeatmapFallback);
  }

})();
