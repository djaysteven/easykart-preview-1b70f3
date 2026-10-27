(function () {
  const header = document.getElementById("header");
  const menuBtn = document.getElementById("menuBtn");
  const mobileNav = document.getElementById("mobileNav");
  const form = document.getElementById("bookForm");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const menuScrim = document.getElementById("menuScrim");
  const menuClose = document.getElementById("menuClose");
  let menuClosingTimer = null;
  let menuScrollY = 0;

  function setMenu(open) {
    if (!mobileNav || !menuBtn) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (menuClosingTimer) {
      clearTimeout(menuClosingTimer);
      menuClosingTimer = null;
    }
    const d = (typeof i18nDicts !== "undefined" && i18nDicts[currentLang]) || {};
    if (open) {
      mobileNav.hidden = false;
      if (menuScrim) menuScrim.hidden = false;
      menuScrollY = window.scrollY || window.pageYOffset || 0;
      document.documentElement.classList.add("menu-open");
      document.body.classList.add("menu-open");
      document.body.style.top = "-" + menuScrollY + "px";
      if (reduce) {
        mobileNav.classList.add("open");
        if (menuScrim) menuScrim.classList.add("open");
      } else {
        void mobileNav.offsetWidth;
        requestAnimationFrame(() => {
          mobileNav.classList.add("open");
          if (menuScrim) menuScrim.classList.add("open");
        });
      }
      menuBtn.setAttribute("aria-expanded", "true");
      menuBtn.setAttribute("aria-label", d["aria.menuClose"] || "Close menu");
      const focusEl = menuClose || mobileNav.querySelector("a, button");
      if (focusEl) setTimeout(() => focusEl.focus(), reduce ? 0 : 50);
      /* Keep hero video playing under sheet/scrim */
      if (typeof tryPlayHero === "function") tryPlayHero();
    } else {
      mobileNav.classList.remove("open");
      if (menuScrim) menuScrim.classList.remove("open");
      document.documentElement.classList.remove("menu-open");
      document.body.classList.remove("menu-open");
      document.body.style.top = "";
      window.scrollTo(0, menuScrollY);
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.setAttribute("aria-label", d["aria.menuOpen"] || "Open menu");
      const hide = () => {
        mobileNav.hidden = true;
        if (menuScrim) menuScrim.hidden = true;
        menuClosingTimer = null;
      };
      if (reduce) hide();
      else menuClosingTimer = setTimeout(hide, 340);
      menuBtn.focus();
      tryPlayHero();
    }
  }

  if (menuBtn) menuBtn.addEventListener("click", () => setMenu(!mobileNav.classList.contains("open")));
  if (menuClose) menuClose.addEventListener("click", () => setMenu(false));
  if (menuScrim) menuScrim.addEventListener("click", () => setMenu(false));
  if (mobileNav) {
    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });
  }

  function menuFocusables() {
    if (!mobileNav) return [];
    return Array.from(
      mobileNav.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter((el) => {
      if (el.hasAttribute("disabled") || el.getAttribute("aria-hidden") === "true") return false;
      const style = window.getComputedStyle(el);
      return style.visibility !== "hidden" && style.display !== "none";
    });
  }

  document.addEventListener("keydown", (e) => {
    if (!mobileNav || !mobileNav.classList.contains("open")) return;
    if (e.key === "Escape") { setMenu(false); return; }
    if (e.key !== "Tab") return;
    const list = menuFocusables();
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      i18nAlert("form.alert", "Thanks! This is a front-end demo — inquiry submit is demo-only. Please use official EasyKart booking or call the track.");
    });
  }

  if (!reduceMotion) {
    const els = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
      els.forEach((el) => io.observe(el));
    } else els.forEach((el) => el.classList.add("in"));
  } else {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
  }

  /* Hero video: muted autoplay loop — never pause for menu/theme; prefer mobile mp4 */
  const heroVideo = document.getElementById("heroVideo");
  const heroWrap = heroVideo && heroVideo.closest(".hero-video-wrap");
  const HERO_MOBILE = "videos/hero-easykart-thailand-mobile.mp4";
  const HERO_DESKTOP = "videos/hero-easykart-thailand.mp4";
  const POSTER_MOBILE = "images/web-hero-poster-mobile.webp";
  const POSTER_DESKTOP = "images/web-hero-poster.webp";

  function heroWantMobile() {
    return window.matchMedia("(max-width: 767.98px)").matches;
  }

  function ensureHeroSource() {
    if (!heroVideo) return;
    const wantMobile = heroWantMobile();
    const next = wantMobile ? HERO_MOBILE : HERO_DESKTOP;
    const poster = wantMobile ? POSTER_MOBILE : POSTER_DESKTOP;
    if (heroVideo.dataset.heroSrc === next) return;
    heroVideo.dataset.heroSrc = next;
    heroVideo.setAttribute("poster", poster);
    const posterImg = heroWrap && heroWrap.querySelector(".hero-poster");
    if (posterImg) posterImg.setAttribute("src", poster);
    while (heroVideo.firstChild) heroVideo.removeChild(heroVideo.firstChild);
    const source = document.createElement("source");
    source.src = next;
    source.type = "video/mp4";
    heroVideo.appendChild(source);
    try { heroVideo.load(); } catch (_) {}
  }

  function tryPlayHero() {
    if (!heroVideo) return;
    heroVideo.muted = true;
    heroVideo.defaultMuted = true;
    heroVideo.playsInline = true;
    heroVideo.setAttribute("muted", "");
    heroVideo.setAttribute("playsinline", "");
    heroVideo.setAttribute("webkit-playsinline", "");
    heroVideo.setAttribute("autoplay", "");
    heroVideo.setAttribute("loop", "");
    heroVideo.loop = true;
    const p = heroVideo.play();
    if (p && typeof p.then === "function") {
      p.then(function () {
        if (heroWrap) heroWrap.classList.add("is-playing");
      }).catch(function () {});
    }
  }

  if (heroVideo) {
    ensureHeroSource();
    heroVideo.addEventListener("loadeddata", tryPlayHero);
    heroVideo.addEventListener("canplay", tryPlayHero);
    heroVideo.addEventListener("playing", function () {
      if (heroWrap) heroWrap.classList.add("is-playing");
    });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) tryPlayHero();
    });
    window.addEventListener("pageshow", tryPlayHero);
    try {
      window.matchMedia("(max-width: 767.98px)").addEventListener("change", function () {
        ensureHeroSource();
        tryPlayHero();
      });
    } catch (_) {}
    tryPlayHero();
  }

  const LANG_KEY = "pattaya-demo-lang";
  const i18nDicts = {
    en: {"meta.title": "EasyKart Pattaya | Go-Karting at Bali Hai Pier & Thepprasit", "meta.description": "EasyKart Pattaya — outdoor go-karting at Bali Hai Pier & Thepprasit. Kid, Regular, Fast & 2-Seater karts. Daily 10:00–01:00.", "aria.home": "EasyKart Pattaya home", "aria.primaryNav": "Primary", "aria.menuOpen": "Open menu", "aria.menuClose": "Close menu", "aria.menuDialog": "Menu", "aria.langSwitch": "Language", "menu.close": "Close", "theme.appearance": "Appearance", "theme.dark": "Dark", "theme.light": "Light", "theme.darkAnnounce": "Dark theme", "theme.lightAnnounce": "Light theme", "nav.tracks": "Tracks", "nav.karts": "Karts & Prices", "nav.experience": "Experience", "nav.gallery": "Gallery", "nav.faq": "FAQ", "nav.contact": "Contact", "nav.compare": "Compare live vs UX upgrade", "nav.book": "Book a race", "nav.bookLong": "Book your race", "hero.eyebrow": "Pattaya · Bali Hai Pier & Thepprasit", "hero.title": "Pattaya’s #1<br /><em>Go-Kart Experience</em>", "hero.lead": "High-speed outdoor racing for families, groups and adrenaline lovers — beginner circuits and technical racing tracks, professional timing, and night racing under full lights.", "hero.ctaBook": "Book a race", "hero.ctaTracks": "Choose your track", "hero.ctaOfficial": "Official booking", "float.hoursStrong": "Daily 10:00–01:00", "float.hoursSpan": "Two outdoor tracks · walk-in or book online", "float.speedStrong": "Up to 70 km/h", "float.speedSpan": "Fast Kart 270cc · live digital timing", "trust.sinceStrong": "Since 2004", "trust.sinceSpan": "Thailand’s EasyKart", "trust.raceStrong": "8 min", "trust.raceSpan": "per race session", "trust.everyStrong": "Every 10 min", "trust.everySpan": "races start", "tracks.label": "Choose your track", "tracks.title": "Two outdoor circuits in Pattaya", "tracks.lead": "Whether you want ocean-side adrenaline by Walking Street or a technical challenge on Thepprasit Road — both locations run daily into the early morning.", "bali.title": "Bali Hai Pier", "bali.chip1": "Beginner 350m", "bali.chip2": "Racing 800m", "bali.chip3": "Near Walking Street", "bali.body": "High-speed racing by the ocean, steps from Bali Hai Pier and Walking Street. Two distinct tracks for tourists, families, groups and adrenaline lovers — plus panoramic terrace, night lighting, pool table and foosball.", "bali.cta": "Location & hours", "thep.title": "Thepprasit Road", "thep.chip1": "Beginner 350m", "thep.chip2": "Racing 900m", "thep.chip3": "Central Pattaya", "thep.body": "The newest racing circuit on Thepprasit Road — built for competitive lap times, precise corners and a more technical drive. Same kart lineup, lounge atmosphere and professional timing.", "thep.cta": "Location & hours", "why.label": "Why EasyKart Pattaya", "why.title": "Safe, timed, built for every level", "why.lead": "Professional timing systems, modern karts and high-performance machines — one of the top things to do in Pattaya for families, groups and adrenaline lovers.", "why.1t": "Bali Hai Pier", "why.1b": "Near Walking Street — fun and accessible for tourists, families and groups.", "why.2t": "Thepprasit Road", "why.2b": "Newest circuit for precision, competitive laps and a greater driving challenge.", "why.3t": "Professional timing", "why.3b": "Real-time digital lap times — compare performance instantly on screen.", "why.4t": "For everyone", "why.4b": "From kids and families to experienced drivers — karts and formats for every level.", "karts.label": "Go-kart models", "karts.title": "Pick your machine", "karts.lead": "Published package prices from EasyKart. Race = 8 minutes. 3+ races include a free collector T-shirt (while stocks last). Sport shoes mandatory; rentals 50 THB.", "kart.kid.h": "Kid Kart — Junior Star", "kart.kid.track": "Beginner track", "kart.kid.age": "Age 7–13", "kart.kid.height": "125+ cm", "kart.kid.p": "Safe introduction to racing — low-speed tuning and easy handling on the dedicated kid-friendly circuit.", "kart.kid.price": "1 race", "kart.reg.h": "Regular Kart — All-Rounder", "kart.reg.track": "Beginner track", "kart.reg.age": "Age 12+", "kart.reg.height": "135+ cm", "kart.reg.p": "Perfect for adult beginners and teens — comfortable handling and total control for a stress-free first race.", "kart.reg.price": "1 race · 3 races + free T-shirt", "kart.fast.h": "Fast Kart — Adrenaline", "kart.fast.track": "Racing track", "kart.fast.age": "Age 15+", "kart.fast.height": "150+ cm", "kart.fast.p": "Built for thrill-seekers — sharp handling and instant acceleration on the long outdoor circuit.", "kart.fast.price": "2 races · 3 races + free T-shirt", "kart.two.h": "2-Seater — Family Thrill", "kart.two.driver": "Driver 20+", "kart.two.kid": "Passenger 110+ cm", "kart.two.p": "Share the speed with your kid or partner — dual steering wheels; the adult controls the pace.", "kart.two.price": "1 race", "karts.flexStrong": "Fast check-in & open-time tickets.", "karts.flex": "Book online for faster arrival check-in, or walk in at the counter. Races start every 10 minutes — use tickets anytime during opening hours.", "karts.cta": "Book now", "safety.label": "Safety first", "safety.title": "Professional standards & equipment", "safety.1": "<strong>Full-face helmets</strong> in all sizes for every driver", "safety.2": "<strong>Closed-toe shoes</strong> mandatory — rentals 50 THB with new socks", "safety.3": "<strong>Racing suits</strong> available free of charge", "safety.4": "<strong>Remote-controlled safety</strong> — marshals can slow or stop any kart instantly", "safety.5": "<strong>Mandatory briefing</strong> before each session — rules, controls, track etiquette", "lounge.label": "More than a track", "lounge.title": "Timing, terrace & night racing", "lounge.1": "<strong>Live digital timing</strong> — compare laps and chase the monthly champions board", "lounge.2": "<strong>Food & drinks</strong> — snacks, pizzas and refreshments with full track view", "lounge.3": "<strong>Leisure area</strong> — pool table and foosball between heats", "lounge.4": "<strong>Night racing</strong> under powerful track lighting after sunset", "lounge.5": "<strong>Podium celebrations</strong> for heat winners", "groups.label": "Groups & events", "groups.title": "Team building, parties & private Grand Prix", "groups.lead": "Staff parties, corporate MICE, bachelor/bachelorette parties and birthdays — tailor a racing experience for small groups or large company outings. Who will break the track record?", "groups.1t": "Personalized help", "groups.1b": "Staff help you choose karts and packages by age, experience and group size.", "groups.2t": "Racing tips", "groups.2b": "Track guidance on lines, braking points and technique for faster laps.", "groups.3t": "Marshals on watch", "groups.3b": "Professional supervision every race — reckless driving not permitted.", "gallery.label": "Gallery", "gallery.title": "Real tracks. Real nights. Real speed.", "gallery.lead": "Photos from EasyKart’s live Pattaya pages — Bali Hai Pier and Thepprasit. Retouched for clarity only; no stock or AI places.", "gal.1": "Karting for all · Bali Hai", "gal.2": "Family experience", "gal.3": "Adrenaline lovers", "gal.4": "Night lighting", "gal.5": "Pro track layout", "gal.6": "Live timing", "gal.7": "Thepprasit fast track", "gal.8": "Night view · Thepprasit", "gal.9": "2-seater family", "gal.10": "Two tracks · kids & adults", "gal.11": "Championship energy", "gal.12": "Lap timing pro", "faq.label": "Racing FAQ", "faq.title": "Everything before you race", "faq.lead": "Key answers from EasyKart Thailand’s FAQ — prices, bookings, kids, safety and formats. Full FAQ lives on easykart.net.", "faq.q1": "Do I need to book in advance?", "faq.a1": "At EasyKart Pattaya (Bali Hai Pier and Thepprasit) you can walk in during opening hours. Online booking gives faster check-in. Races start every 10 minutes with open-time tickets.", "faq.q2": "How long is each race?", "faq.a2": "Each race lasts 8 minutes — about 10 to 15 laps depending on your speed. Multi-race packages are available for a longer session.", "faq.q3": "What are the standard prices?", "faq.a3": "Kid Kart from 499 THB (1 race). Regular and 2-Seater from 699 THB (1 race). Fast Kart package from 1,499 THB (2 races). Confirm current packages on the booking page.", "faq.q4": "What should I wear?", "faq.a4": "Sport / closed-toe shoes are mandatory. Shoe rental is 50 THB per pair (all sizes, includes new socks). Helmets included; racing suits free if you want the full look.", "faq.q5": "Opening hours?", "faq.a5": "Both Pattaya tracks: daily 10:00 – 01:00 (after midnight). Outdoor locations with panoramic viewing areas.", "faq.q6": "Where else is EasyKart?", "faq.a6": "EasyKart operates since 2004 across Thailand: Bangkok (RCA Plaza), Pattaya Bali Hai Pier, Pattaya Thepprasit, and Koh Samui (Chaweng Lake).", "contact.label": "Visit & contact", "contact.title": "Find us in Pattaya", "contact.lead": "Pick the track closest to where you’re staying — both open late every day.", "contact.bali.h": "EasyKart Pattaya (Bali Hai Pier)", "contact.thep.h": "EasyKart Pattaya (Thepprasit)", "contact.address": "Address", "contact.phone": "Phone", "contact.hours": "Hours", "contact.map": "Map", "contact.hoursVal": "Daily 10:00 – 01:00", "contact.bali.addr": "361/83 Moo 10, Nongprue, Bang Lamung, Chon Buri 20150, Thailand", "contact.thep.addr": "Thepprasit Road, Pattaya City, Chon Buri 20150, Thailand", "contact.openMap": "View on Google Maps", "book.label": "Book your race", "book.title": "Fast check-in starts here", "book.lead": "This form is a front-end demo. For live tickets use EasyKart’s official booking — or walk in at either Pattaya track.", "book.official": "Official EasyKart booking", "book.faq": "Full Racing FAQ", "form.name": "Full name", "form.namePh": "Your name", "form.contact": "Phone / LINE / email", "form.contactPh": "+66 or email", "form.track": "Preferred track", "form.optBali": "Bali Hai Pier", "form.optThep": "Thepprasit", "form.optEither": "Either / not sure", "form.kart": "Kart interest", "form.optGroup": "Group / event", "form.message": "Message", "form.messagePh": "Preferred day, group size…", "form.submit": "Send demo inquiry", "form.note": "Demo only — not connected to EasyKart’s booking system. Live payments & tickets stay on easykart.net after they invest.", "form.alert": "Thanks! This is a front-end demo — inquiry submit is demo-only. Please use official EasyKart booking or call the track.", "footer.tagline": "<strong>EasyKart Pattaya</strong> — Bali Hai Pier & Thepprasit outdoor go-karting", "footer.demo": "Front-end demo — bookings/payments not connected; paid back-end after they invest. Content & photos from easykart.net.", "footer.compare": "Compare live vs UX upgrade →", "footer.vantage": "— demo redesign by Vantage. Brand mark above is EasyKart; Vantage is agency attribution only.", "sticky.call": "Call", "sticky.book": "Book", "alt.baliTrack": "EasyKart Pattaya Bali Hai Pier track", "alt.thepTrack": "EasyKart Pattaya Thepprasit track", "alt.kartKid": "Kid Kart", "alt.kartRegular": "Regular Kart", "alt.kartFast": "Fast Kart", "alt.kart2": "2-Seater Kart", "alt.safety": "Safety briefing at EasyKart", "alt.lounge": "EasyKart leisure area"},
    th: {"meta.title": "โกคาร์ท พัทยา EasyKart | บาลีฮาย เพียร์ และ ถนนเทพประสิทธิ์", "meta.description": "EasyKart พัทยา — โกคาร์ทกลางแจ้งที่บาลีฮายและเทพประสิทธิ์ รถเด็ก รถทั่วไป รถเร็ว และ 2 ที่นั่ง เปิดทุกวัน 10:00–01:00", "aria.home": "หน้าแรก EasyKart พัทยา", "aria.primaryNav": "เมนูหลัก", "aria.menuOpen": "เปิดเมนู", "aria.menuClose": "ปิดเมนู", "aria.menuDialog": "เมนู", "aria.langSwitch": "ภาษา", "menu.close": "ปิด", "theme.appearance": "ธีม", "theme.dark": "เข้ม", "theme.light": "สว่าง", "theme.darkAnnounce": "ธีมสีเข้ม", "theme.lightAnnounce": "ธีมสีสว่าง", "nav.tracks": "สนามแข่ง", "nav.karts": "รถและราคา", "nav.experience": "ประสบการณ์", "nav.gallery": "แกลเลอรี", "nav.faq": "คำถามที่พบบ่อย", "nav.contact": "ติดต่อ", "nav.compare": "เทียบเว็บจริงกับ UX upgrade", "nav.book": "จองรอบแข่ง", "nav.bookLong": "จองรอบแข่งของคุณ", "hero.eyebrow": "พัทยา · บาลีฮาย เพียร์ และ เทพประสิทธิ์", "hero.title": "<span class=\"th-nowrap\">ประสบการณ์โกคาร์ท</span><br /><em>อันดับ 1 ของพัทยา</em>", "hero.lead": "แข่งกลางแจ้งความเร็วสูงสำหรับครอบครัว กรุ๊ป และสายอะดรีนาลีน — สนามมือใหม่และสนามแข่งเทคนิค ระบบจับเวลามืออาชีพ และแข่งกลางคืนไฟเต็มสนาม", "hero.ctaBook": "จองรอบแข่ง", "hero.ctaTracks": "เลือกสนาม", "hero.ctaOfficial": "จองผ่านเว็บทางการ", "float.hoursStrong": "ทุกวัน 10:00–01:00", "float.hoursSpan": "สองสนามกลางแจ้ง · วอล์กอินหรือจองออนไลน์", "float.speedStrong": "สูงสุด 70 กม./ชม.", "float.speedSpan": "Fast Kart 270cc · จับเวลาดิจิทัลสด", "trust.sinceStrong": "ตั้งแต่ 2004", "trust.sinceSpan": "EasyKart ประเทศไทย", "trust.raceStrong": "8 นาที", "trust.raceSpan": "ต่อรอบแข่ง", "trust.everyStrong": "ทุก 10 นาที", "trust.everySpan": "สตาร์ทรอบแข่ง", "tracks.label": "เลือกสนามแข่ง", "tracks.title": "<span class=\"th-nowrap\">สองสนามกลางแจ้ง</span> ในพัทยา", "tracks.lead": "อยากได้ความเร้าใจริมทะเลใกล้ Walking Street หรือท้าทายฝีมือบนถนนเทพประสิทธิ์ — ทั้งสองสาขาเปิดทุกวันจนหลังเที่ยงคืน", "bali.title": "บาลีฮาย เพียร์", "bali.chip1": "มือใหม่ 350 ม.", "bali.chip2": "สนามแข่ง 800 ม.", "bali.chip3": "ใกล้ Walking Street", "bali.body": "แข่งความเร็วสูงริมทะเล ใกลท่าเรือบาลีฮายและ Walking Street สองสนามสำหรับนักท่องเที่ยว ครอบครัว กรุ๊ป และสายอะดรีนาลีน — พร้อมเทอร์เรซพาโนรามา ไฟกลางคืน โต๊ะพูลและฟุตซอล", "bali.cta": "ที่ตั้งและเวลา", "thep.title": "ถนนเทพประสิทธิ์", "thep.chip1": "มือใหม่ 350 ม.", "thep.chip2": "สนามแข่ง 900 ม.", "thep.chip3": "ใจกลางพัทยา", "thep.body": "สนามแข่งใหม่ล่าสุดบนถนนเทพประสิทธิ์ — ออกแบบเพื่อเวลาต่อรอบ การเข้าโค้งที่แม่นยำและการขับที่เทคนิคมากขึ้น รถรุ่นเดียวกัน บรรยากาศเลานจ์ และระบบจับเวลามืออาชีพ", "thep.cta": "ที่ตั้งและเวลา", "why.label": "ทำไมต้อง EasyKart พัทยา", "why.title": "ปลอดภัย จับเวลาครบ เหมาะทุกระดับ", "why.lead": "ระบบจับเวลามืออาชีพ รถรุ่นใหม่และเครื่องแรงสูง — หนึ่งในกิจกรรมยอดนิยมของพัทยาสำหรับครอบครัว กรุ๊ป และสายอะดรีนาลีน", "why.1t": "บาลีฮาย เพียร์", "why.1b": "ใกล้ Walking Street — สนุก เข้าถึงง่าย สำหรับนักท่องเที่ยว ครอบครัวและกรุ๊ป", "why.2t": "ถนนเทพประสิทธิ์", "why.2b": "สนามใหม่เพื่อความแม่นยำ รอบแข่งที่แข่งขันได้ และความท้าทายที่มากขึ้น", "why.3t": "จับเวลามืออาชีพ", "why.3b": "เวลารอบแบบเรียลไทม์ดิจิทัล — เทียบผลได้ทันทีบนจอ", "why.4t": "สำหรับทุกคน", "why.4b": "ตั้งแต่เด็กและครอบครัวถึงนักขับมืออาชีพ — มีรถและรูปแบบแข่งครบ", "karts.label": "รุ่นรถโกคาร์ท", "karts.title": "เลือกรถของคุณ", "karts.lead": "ราคาแพ็กเกจตามที่ EasyKart เผยแพร่ 1 รอบ = 8 นาที ซื้อ 3 รอบขึ้นไปได้เสื้อสะสมฟรี (มีจำนวนจำกัด) ต้องใส่รองเท้ากีฬา เช่ารองเท้า 50 บาท", "kart.kid.h": "Kid Kart — จุดเริ่มต้นนักแข่งรุ่นเยาว์", "kart.kid.track": "สนามมือใหม่", "kart.kid.age": "อายุ 7–13 ปี", "kart.kid.height": "สูง 125+ ซม.", "kart.kid.p": "เริ่มแข่งอย่างปลอดภัย — ปรับความเร็วต่ำ บังคับง่าย บนสนามสำหรับเด็กโดยเฉพาะ", "kart.kid.price": "1 รอบ", "kart.reg.h": "Regular Kart — สำหรับทุกคน", "kart.reg.track": "สนามมือใหม่", "kart.reg.age": "อายุ 12+", "kart.reg.height": "สูง 135+ ซม.", "kart.reg.p": "เหมาะกับผู้ใหญ่มือใหม่และวัยรุ่น — บังคับสบาย ควบคุมได้เต็มที่ สำหรับรอบแรกที่ผ่อนคลาย", "kart.reg.price": "1 รอบ · 3 รอบ + เสื้อฟรี", "kart.fast.h": "Fast Kart — อะดรีนาลีนเต็มสปีด", "kart.fast.track": "สนามแข่ง", "kart.fast.age": "อายุ 15+", "kart.fast.height": "สูง 150+ ซม.", "kart.fast.p": "เพื่อสายลุ้นระทึก — ควบคุมคม เร่งทันที บนสนามกลางแจ้งระยะยาว", "kart.fast.price": "2 รอบ · 3 รอบ + เสื้อฟรี", "kart.two.h": "2-Seater — สนุกไปด้วยกัน", "kart.two.driver": "คนขับ 20+", "kart.two.kid": "ผู้โดยสาร 110+ ซม.", "kart.two.p": "แชร์ความเร็วกับลูกหรือคู่ — พวงมาลัยคู่ คนขับผู้ใหญ่ควบคุมความเร็ว", "kart.two.price": "1 รอบ", "karts.flexStrong": "เช็กอินเร็วและตั๋วเปิดเวลา", "karts.flex": "จองออนไลน์เพื่อเช็กอินเร็วขึ้น หรือวอล์กอินที่เคาน์เตอร์ รอบแข่งเริ่มทุก 10 นาที — ใช้ตั๋วได้ตลอดเวลาเปิดทำการ", "karts.cta": "จองเลย", "safety.label": "ความปลอดภัยมาก่อน", "safety.title": "มาตรฐานและอุปกรณ์มืออาชีพ", "safety.1": "<strong>หมวกเต็มใบ</strong> ครบทุกไซซ์สำหรับทุกคนขับ", "safety.2": "<strong>รองเท้าหัวปิด</strong> จำเป็น — เช่า 50 บาท พร้อมถุงเท้าใหม่", "safety.3": "<strong>ชุดแข่ง</strong> ให้ยืมฟรี", "safety.4": "<strong>ระบบควบคุมระยะไกล</strong> — มาร์แชลชะลอหรือหยุดรถได้ทันที", "safety.5": "<strong>บรีฟฟิงบังคับ</strong> ก่อนแข่งทุกครั้ง — กติกา การควบคุม มารยาทในสนาม", "lounge.label": "มากกว่าสนามแข่ง", "lounge.title": "จับเวลา เทอร์เรซ และแข่งกลางคืน", "lounge.1": "<strong>จับเวลาดิจิทัลสด</strong> — เทียบรอบและลุ้นกระดานแชมป์ประจำเดือน", "lounge.2": "<strong>อาหารและเครื่องดื่ม</strong> — ของว่าง พิซซ่า และเครื่องดื่ม มุมมองสนามเต็มตา", "lounge.3": "<strong>โซนพักผ่อน</strong> — โต๊ะพูลและฟุตซอลระหว่างรอบ", "lounge.4": "<strong>แข่งกลางคืน</strong> ใต้ไฟสนามแรงหลังพระอาทิตย์ตก", "lounge.5": "<strong>ขึ้นโพเดียม</strong> สำหรับผู้ชนะฮีต", "groups.label": "กรุ๊ปและอีเวนต์", "groups.title": "ทีมบิลด์ดิ้ง ปาร์ตี้ และกรังด์ปรีซ์ส่วนตัว", "groups.lead": "ปาร์ตี้พนักงาน คอร์ปอเรต MICE ปาร์ตี้สละโสด และวันเกิด — จัดประสบการณ์แข่งให้เหมาะทั้งกรุ๊ปเล็กและบริษัทใหญ่ ใครจะทำลายสถิติสนาม?", "groups.1t": "ช่วยเลือกแบบตัวต่อตัว", "groups.1b": "ทีมงานช่วยเลือกรถและแพ็กเกจตามอายุ ประสบการณ์ และขนาดกรุ๊ป", "groups.2t": "ทิปส์การแข่ง", "groups.2b": "แนะนำไลน์เบรก จุดเบรก และเทคนิคเพื่อรอบที่เร็วขึ้น", "groups.3t": "มาร์แชลดูแลตลอด", "groups.3b": "คุมสนามทุกช่วงแข่ง — ห้ามขับประมาท", "gallery.label": "แกลเลอรี", "gallery.title": "สนามจริง คืนจริง ความเร็วจริง", "gallery.lead": "รูปจากหน้าเว็บ EasyKart พัทยาจริง — บาลีฮายและเทพประสิทธิ์ ปรับสี/คมชัดเท่านั้น ไม่ใช้รูปสต็อกหรือ AI", "gal.1": "โกคาร์ทสำหรับทุกคน · บาลีฮาย", "gal.2": "ประสบการณ์ครอบครัว", "gal.3": "สายอะดรีนาลีน", "gal.4": "ระบบไฟกลางคืน", "gal.5": "เลย์เอาต์สนามโปร", "gal.6": "จับเวลาสด", "gal.7": "สนามเร็วเทพประสิทธิ์", "gal.8": "วิวกลางคืน · เทพประสิทธิ์", "gal.9": "รถ 2 ที่นั่ง ครอบครัว", "gal.10": "สองสนาม · เด็กและผู้ใหญ่", "gal.11": "บรรยากาศแชมป์", "gal.12": "จับเวลาระดับโปร", "faq.label": "คำถามก่อนลงสนาม", "faq.title": "ทุกสิ่งที่ควรรู้ก่อนแข่ง", "faq.lead": "คำตอบสำคัญจาก FAQ ของ EasyKart ประเทศไทย — ราคา การจอง เด็ก ความปลอดภัย และรูปแบบแข่ง FAQ เต็มอยู่ที่ easykart.net", "faq.q1": "ต้องจองล่วงหน้าไหม?", "faq.a1": "ที่ EasyKart พัทยา (บาลีฮายและเทพประสิทธิ์) วอล์กอินได้ในช่วงเวลาเปิดทำการ การจองออนไลน์ช่วยเช็กอินเร็วขึ้น รอบแข่งเริ่มทุก 10 นาทีด้วยตั๋วเปิดเวลา", "faq.q2": "แต่ละรอบนานแค่ไหน?", "faq.a2": "แต่ละรอบประมาณ 8 นาที — ประมาณ 10 ถึง 15 รอบสนาม ขึ้นกับความเร็ว มีแพ็กหลายรอบสำหรับเซสชันที่ยาวขึ้น", "faq.q3": "ราคามาตรฐานเท่าไหร่?", "faq.a3": "Kid Kart เริ่ม 499 บาท (1 รอบ) Regular และ 2-Seater เริ่ม 699 บาท (1 รอบ) แพ็ก Fast Kart เริ่ม 1,499 บาท (2 รอบ) ยืนยันแพ็กเกจปัจจุบันในหน้าจอง", "faq.q4": "ควรแต่งตัวอย่างไร?", "faq.a4": "ต้องใส่รองเท้ากีฬา/หัวปิด เช่ารองเท้า 50 บาทต่อคู่ (ครบไซซ์ พร้อมถุงเท้าใหม่) มีหมวกให้ และชุดแข่งยืมฟรีหากต้องการลุคเต็ม", "faq.q5": "เวลาเปิดทำการ?", "faq.a5": "ทั้งสองสนามพัทยา: ทุกวัน 10:00 – 01:00 (หลังเที่ยงคืน) สนามกลางแจ้งพร้อมพื้นที่ชมวิว", "faq.q6": "EasyKart มีที่ไหนอีก?", "faq.a6": "EasyKart ดำเนินงานตั้งแต่ปี 2004 ในไทย: กรุงเทพฯ (RCA Plaza) พัทยาบาลีฮาย พัทยาเทพประสิทธิ์ และเกาะสมุย (ทะเลสาบเฉวง)", "contact.label": "การเดินทางและติดต่อ", "contact.title": "หาเราได้ในพัทยา", "contact.lead": "เลือกสนามที่ใกล้ที่พักของคุณ — ทั้งสองสาขาเปิดดึกทุกวัน", "contact.bali.h": "EasyKart พัทยา (บาลีฮาย เพียร์)", "contact.thep.h": "EasyKart พัทยา (เทพประสิทธิ์)", "contact.address": "ที่อยู่", "contact.phone": "โทรศัพท์", "contact.hours": "เวลาทำการ", "contact.map": "แผนที่", "contact.hoursVal": "ทุกวัน 10:00 – 01:00", "contact.bali.addr": "361/83 หมู่ 10 หนองปรือ บางละมุง ชลบุรี 20150 ประเทศไทย", "contact.thep.addr": "ถนนเทพประสิทธิ์ เมืองพัทยา ชลบุรี 20150 ประเทศไทย", "contact.openMap": "ดูบน Google Maps", "book.label": "จองรอบแข่ง", "book.title": "เริ่มเช็กอินเร็วที่นี่", "book.lead": "แบบฟอร์มนี้เป็นเดโมหน้าบ้าน สำหรับตั๋วจริงใช้ระบบจองทางการของ EasyKart — หรือวอล์กอินที่สนามพัทยา", "book.official": "จองผ่าน EasyKart ทางการ", "book.faq": "FAQ การแข่งเต็ม", "form.name": "ชื่อ-นามสกุล", "form.namePh": "ชื่อของคุณ", "form.contact": "โทร / LINE / อีเมล", "form.contactPh": "+66 หรืออีเมล", "form.track": "สนามที่สนใจ", "form.optBali": "บาลีฮาย เพียร์", "form.optThep": "เทพประสิทธิ์", "form.optEither": "ได้ทั้งคู่ / ยังไม่แน่ใจ", "form.kart": "รถที่สนใจ", "form.optGroup": "กรุ๊ป / อีเวนต์", "form.message": "ข้อความ", "form.messagePh": "วันที่สะดวก ขนาดกรุ๊ป…", "form.submit": "ส่งคำถามเดโม", "form.note": "เดโมเท่านั้น — ยังไม่เชื่อมระบบจอง EasyKart การชำระเงินและตั๋วจริงอยู่ที่ easykart.net หลังลงทุน", "form.alert": "ขอบคุณ! นี่เป็นเดโมหน้าบ้าน — การส่งคำถามเป็นการสาธิต กรุณาใช้ระบบจอง EasyKart ทางการหรือโทรหาสนาม", "footer.tagline": "<strong>EasyKart พัทยา</strong> — โกคาร์ทกลางแจ้งบาลีฮายและเทพประสิทธิ์", "footer.demo": "เดโมหน้าบ้าน — ยังไม่เชื่อมจอง/ชำระเงิน ระบบหลังบ้านหลังลงทุน เนื้อหาและรูปจาก easykart.net", "footer.compare": "เทียบเว็บจริงกับ UX upgrade →", "footer.vantage": "— เดโมรีดีไซน์โดย Vantage โลโก้ด้านบนคือ EasyKart ส่วน Vantage เป็นเครดิตเอเจนซีเท่านั้น", "sticky.call": "โทร", "sticky.book": "จอง", "alt.baliTrack": "สนาม EasyKart พัทยา บาลีฮาย เพียร์", "alt.thepTrack": "สนาม EasyKart พัทยา เทพประสิทธิ์", "alt.kartKid": "รถ Kid Kart", "alt.kartRegular": "รถ Regular Kart", "alt.kartFast": "รถ Fast Kart", "alt.kart2": "รถ 2 ที่นั่ง", "alt.safety": "บรีฟฟิงความปลอดภัยที่ EasyKart", "alt.lounge": "โซนพักผ่อน EasyKart"}
  };
  let currentLang = "en";

  function detectDefaultLang() {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === "th" || saved === "en") return saved;
    } catch (_) {}
    const nav = (navigator.language || navigator.userLanguage || "en").toLowerCase();
    return nav.startsWith("th") ? "th" : "en";
  }

  function applyI18n(lang, dict) {
    if (!dict) return;
    currentLang = lang;
    document.documentElement.lang = lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch (_) {}

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key] != null) el.textContent = dict[key];
    });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const key = el.getAttribute("data-i18n-html");
      if (dict[key] != null) el.innerHTML = dict[key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (dict[key] != null) el.setAttribute("placeholder", dict[key]);
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria");
      if (dict[key] != null) el.setAttribute("aria-label", dict[key]);
    });
    document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
      const key = el.getAttribute("data-i18n-alt");
      if (dict[key] != null) el.setAttribute("alt", dict[key]);
    });

    if (dict["meta.title"]) document.title = dict["meta.title"];
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && dict["meta.description"]) metaDesc.setAttribute("content", dict["meta.description"]);

    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-lang") === lang));
    });

    if (menuBtn && mobileNav) {
      const open = mobileNav.classList.contains("open");
      menuBtn.setAttribute("aria-label", open ? (dict["aria.menuClose"] || "Close menu") : (dict["aria.menuOpen"] || "Open menu"));
    }
  }

  function i18nAlert(key, fallback) {
    const dict = i18nDicts[currentLang];
    alert((dict && dict[key]) || fallback);
  }

  function initI18n() {
    const lang = detectDefaultLang();
    applyI18n(lang, i18nDicts[lang] || i18nDicts.en);
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = btn.getAttribute("data-lang");
        if (next && i18nDicts[next]) applyI18n(next, i18nDicts[next]);
      });
    });
  }
  initI18n();

  const THEME_KEY = "pattaya-demo-theme";
  const themeLive = document.getElementById("themeLive");

  function getTheme() {
    const t = document.documentElement.getAttribute("data-theme");
    return t === "light" ? "light" : "dark";
  }

  function applyTheme(theme, announce) {
    const next = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    document.documentElement.style.colorScheme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch (_) {}
    document.querySelectorAll(".theme-btn").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-theme-set") === next));
    });
    if (announce && themeLive) {
      const d = i18nDicts[currentLang] || {};
      themeLive.textContent = next === "light"
        ? (d["theme.lightAnnounce"] || "Light theme")
        : (d["theme.darkAnnounce"] || "Dark theme");
    }
    if (typeof tryPlayHero === "function") tryPlayHero();
  }

  function initTheme() {
    applyTheme(getTheme(), false);
    document.querySelectorAll(".theme-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = btn.getAttribute("data-theme-set");
        if (next) applyTheme(next, true);
      });
    });
  }
  initTheme();
})();
