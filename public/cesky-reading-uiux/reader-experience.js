/* Ahoj Czech reader v1. Exact chapter text; real media or local Czech voice only. */
(function () {
  "use strict";

  const PREF_KEY = "ahoj.reader.prefs.v1";
  const POSITION_KEY = "ahoj.reader.positions.v1";
  const SPEEDS = [0.75, 0.85, 1, 1.25, 1.5];
  const html = (value) => String(value == null ? "" : value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  const readSaved = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch (_err) { return fallback; }
  };
  const save = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (_err) { /* Private mode or disabled storage: use in-memory state. */ }
  };
  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "—:—";
    const s = Math.floor(seconds);
    return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  };
  const normalizeCzech = (value) => String(value || "").trim().toLocaleLowerCase("cs-CZ");
  const sentenceParts = (text) => {
    const matches = String(text || "").match(/[^.!?]+(?:[.!?]+[»”"’\])]*|$)/gu);
    return (matches || [text]).map((s) => s.trim()).filter(Boolean);
  };

  class CzechReader {
    constructor(options) {
      this.host = options.host;
      this.book = options.book;
      this.ch = options.chapter;
      this.callbacks = options;
      this.readingState = options.readingState;
      this.sentences = [];
      this.words = [];
      this.sentenceIndex = 0;
      this.currentWordId = -1;
      this.speaking = false;
      this.paused = false;
      this.playOnlySentence = false;
      this.generation = 0;
      this.utterance = null;
      this.audio = null;
      this.quickSheet = null;
      this.voicesChanged = () => this.syncUI();
      this.guidedActive = false;
      this.guidedPhase = "disabled";
      this.guidedIndex = 0;
      this.guidedSession = 0;
      this.guidedRecognition = null;
      this.guidedHelpUtterance = null;
      this.guidedError = "";
      this.guidedProcessedResults = new Set();
      this.kind = this.ch.audioUrl ? "file" :
        (typeof window.speechSynthesis !== "undefined" &&
          typeof window.SpeechSynthesisUtterance !== "undefined" ? "tts" : "none");

      const prefs = readSaved(PREF_KEY, {});
      this.fontSize = Math.min(28, Math.max(16, Number(prefs.fontSize) || 18));
      this.speed = SPEEDS.includes(Number(prefs.speed)) ? Number(prefs.speed) : 1;
      this.repeat = prefs.repeat === true;
      this.collapsed = typeof prefs.collapsed === "boolean" ?
        prefs.collapsed : window.innerHeight < 700;

      this.host.classList.add("aho-reader-shell");
      this.render();
      this.bind();
      if (this.kind === "file") this.setupFileAudio();
      if (this.kind === "tts" && window.speechSynthesis.addEventListener) {
        window.speechSynthesis.addEventListener("voiceschanged", this.voicesChanged);
      }
      this.restorePosition();
      this.syncUI();
    }

    savePreferences() {
      save(PREF_KEY, {
        fontSize: this.fontSize,
        speed: this.speed,
        repeat: this.repeat,
        collapsed: this.collapsed
      });
    }

    compileParagraph(text) {
      return sentenceParts(text).map((sentenceText) => {
        const sentenceId = this.sentences.length;
        let result = "";
        const tokens = [];
        const re = /[\p{L}][\p{L}\p{M}'’\-]*|[^\p{L}]+/gu;
        for (const match of sentenceText.matchAll(re)) {
          if (!/^\p{L}/u.test(match[0])) {
            result += html(match[0]);
            continue;
          }
          const id = this.words.length;
          const token = {
            id, sentenceId, text: match[0],
            start: match.index, end: match.index + match[0].length
          };
          tokens.push(token);
          this.words.push(token);
          result += '<button type="button" class="ar-word" data-word="' + id +
            '" aria-label="Толь: ' + html(match[0]) + '" lang="cs">' + html(match[0]) + "</button>";
        }
        this.sentences.push({ text: sentenceText, tokens });
        // No speaker controls inside the prose: keep the Czech text uncluttered.
        // Sentence audio is accessible through a tapped word's dictionary sheet.
        return '<span class="ar-sentence" data-sentence="' + sentenceId + '">' +
          result + '</span>';
      }).join(" ");
    }

    render() {
      this.sentences = [];
      this.words = [];
      const paragraphs = this.ch.cz.map((p) =>
        '<p class="ar-paragraph" lang="cs">' + this.compileParagraph(p) + "</p>"
      ).join("");
      const mnHtml = this.ch.mn.map((p) => "<p>" + html(p) + "</p>").join("");
      const done = this.book.completedChapters.includes(this.ch.num);
      const nextText = done ?
        (this.ch.num < this.book.chapters.length ? "Дараагийн бүлэг →" : "Ном руу буцах") :
        "Уншсанаар тэмдэглэх ✓";

      this.host.innerHTML =
        '<header class="ar-header">' +
          '<button id="ar-close" class="ar-icon-btn" aria-label="Буцах">‹</button>' +
          '<div class="ar-header-copy"><div class="ar-title">' + html(this.book.title) + '</div>' +
          '<div class="ar-subtitle">Бүлэг ' + this.ch.num + " / " + this.book.chapters.length +
          " · " + html(this.ch.title) + '</div></div>' +
          '<button id="ar-font-head" class="ar-icon-btn ar-header-font" aria-label="Үсгийн хэмжээг өөрчлөх">Aa</button>' +
        '</header>' +
        '<main id="ar-scroll" class="ar-scroll" aria-label="Чех уншлагын эх">' +
          '<div class="ar-text" id="ar-text" style="--reader-font-size:' + this.fontSize + 'px">' +
            paragraphs + '</div>' +
          '<button id="ar-translation-toggle" class="ar-trans-toggle" type="button">' +
            (this.readingState.showTranslation ? "Монгол орчуулга нуух" : "Монгол орчуулга харах") +
          '</button>' +
          '<div id="ar-mn" class="ar-mn-box"' + (this.readingState.showTranslation ? "" : " hidden") +
            '>' + mnHtml + '</div>' +
          '<div class="ar-end"><p class="ar-end-status">' +
            (done ? "Уншсан гэж тэмдэглэсэн. Энэ нь шалгалт өгсөн гэсэн үг биш." :
            "Энэ номын бүлгүүд жишээ агуулгатай. Уншиж дууссанаа өөрөө тэмдэглэнэ.") +
          '</p><div class="ar-end-actions">' +
          '<button type="button" id="ar-prev" class="ar-end-btn secondary"' +
            (this.ch.num <= 1 ? " disabled" : "") + '>← Өмнөх</button>' +
          '<button type="button" id="ar-complete" class="ar-end-btn">' + nextText +
          '</button></div></div>' +
        '</main>' +
        '<section id="ar-player" class="ar-player" aria-label="Чех аудио тоглуулагч">' +
          '<div class="ar-progress-top"><span id="ar-elapsed">—:—</span>' +
            '<span id="ar-duration">—:—</span></div>' +
          '<div class="ar-progress-bottom">' +
            '<input id="ar-seek" class="ar-seek" type="range" min="0" max="100" value="0" step=".1" disabled aria-label="Аудионы хугацаа">' +
          '</div>' +
          '<button type="button" class="ar-collapse" id="ar-collapse" aria-label="Тоглуулагч хураах">⌄</button>' +
          '<div class="ar-player-source" id="ar-source" aria-live="polite"></div>' +
          '<div class="ar-guided" aria-label="Дуудаж унших: Чех STT туршилтын горим">' +
            '<span class="ar-guided-icon" aria-hidden="true">' +
              '<svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5m-4 0h8"/></svg>' +
            '</span><div class="ar-guided-copy"><strong>Дуудаж унших</strong><small id="ar-guided-message" aria-live="polite">Чех яриа таних туршилт</small></div>' +
            '<button type="button" id="ar-word-help" class="ar-guided-help" aria-label="Гацсан одоогийн үгийг сонсох" disabled>🔊</button>' +
            '<button type="button" id="ar-guided-retry" class="ar-guided-retry" hidden>Үргэлжлүүлэх</button>' +
            '<button type="button" id="ar-guided-toggle" class="ar-guided-toggle" role="switch" aria-checked="false" aria-label="Дуудаж унших горимыг асаах">●</button>' +
          '</div>' +
          '<div class="ar-player-controls">' +
            '<button type="button" class="ar-round ar-skip" id="ar-back" disabled aria-label="5 секунд ухраах">↶5</button>' +
            '<button type="button" class="ar-round main" id="ar-play" aria-label="Тоглуулах">▶</button>' +
            '<button type="button" class="ar-round ar-skip" id="ar-forward" disabled aria-label="5 секунд урагшлуулах">↷5</button>' +
          '</div>' +
          '<div class="ar-player-options">' +
            '<button type="button" id="ar-repeat" class="ar-option" aria-pressed="false">↻ Давтах</button>' +
            '<label class="ar-option"><select id="ar-speed" aria-label="Тоглуулах хурд">' +
              SPEEDS.map((v) => '<option value="' + v + '"' +
                (v === this.speed ? " selected" : "") + ">" + v + "×</option>").join("") +
            '</select></label>' +
            '<button type="button" id="ar-font" class="ar-option" aria-label="Үсгийн хэмжээг өөрчлөх">Tt <span id="ar-font-size">' +
              this.fontSize + '</span></button>' +
          '</div>' +
          '<div class="ar-status" id="ar-status" role="status"></div>' +
        '</section>';
      this.refs = {
        player: this.host.querySelector("#ar-player"),
        body: this.host.querySelector("#ar-scroll"),
        play: this.host.querySelector("#ar-play"),
        back: this.host.querySelector("#ar-back"),
        forward: this.host.querySelector("#ar-forward"),
        repeat: this.host.querySelector("#ar-repeat"),
        seek: this.host.querySelector("#ar-seek"),
        source: this.host.querySelector("#ar-source"),
        elapsed: this.host.querySelector("#ar-elapsed"),
        duration: this.host.querySelector("#ar-duration"),
        status: this.host.querySelector("#ar-status"),
        trans: this.host.querySelector("#ar-translation-toggle"),
        guideToggle: this.host.querySelector("#ar-guided-toggle"),
        guideMessage: this.host.querySelector("#ar-guided-message"),
        guideHelp: this.host.querySelector("#ar-word-help"),
        guideRetry: this.host.querySelector("#ar-guided-retry")
      };
    }

    bind() {
      this.host.querySelector("#ar-close").addEventListener("click", () => this.callbacks.onClose());
      this.host.querySelector("#ar-prev").addEventListener("click", () => this.callbacks.onPrevious());
      this.host.querySelector("#ar-complete").addEventListener("click", () => this.callbacks.onComplete());
      this.host.querySelector("#ar-collapse").addEventListener("click", () => this.toggleCollapsed());
      this.host.querySelector("#ar-font-head").addEventListener("click", () => this.cycleFontSize());
      this.refs.play.addEventListener("click", () => this.togglePlay());
      this.refs.guideToggle.addEventListener("click", () => this.toggleGuided());
      this.refs.guideHelp.addEventListener("click", () => this.playStuckWord());
      this.refs.guideRetry.addEventListener("click", () => this.startGuidedRecognition());
      this.refs.back.addEventListener("click", () => this.skip(-5));
      this.refs.forward.addEventListener("click", () => this.skip(5));
      this.refs.seek.addEventListener("input", (event) => this.seek(Number(event.target.value)));
      this.refs.repeat.addEventListener("click", () => {
        this.repeat = !this.repeat;
        this.savePreferences();
        this.syncUI();
      });
      this.host.querySelector("#ar-speed").addEventListener("change", (event) => {
        this.speed = Number(event.target.value);
        this.savePreferences();
        if (this.audio) this.audio.playbackRate = this.speed;
        if (this.kind === "tts" && this.speaking && !this.paused) {
          this.startTts(this.sentenceIndex, this.playOnlySentence);
        }
        this.syncUI();
      });
      this.host.querySelector("#ar-font").addEventListener("click", () => this.cycleFontSize());
      this.refs.trans.addEventListener("click", () => {
        this.readingState.showTranslation = !this.readingState.showTranslation;
        this.host.querySelector("#ar-mn").hidden = !this.readingState.showTranslation;
        this.refs.trans.textContent = this.readingState.showTranslation ?
          "Монгол орчуулга нуух" : "Монгол орчуулга харах";
      });
      this.host.querySelector("#ar-text").addEventListener("click", (event) => {
        const wordButton = event.target.closest("[data-word]");
        if (wordButton) {
          this.showWord(Number(wordButton.dataset.word));
          return;
        }
        const sentenceButton = event.target.closest("[data-listen-sentence]");
        if (sentenceButton) this.playSentence(Number(sentenceButton.dataset.listenSentence));
      });
      this.refs.body.addEventListener("scroll", () => {
        const key = this.book.id + ":" + this.ch.num;
        const values = readSaved(POSITION_KEY, {});
        values[key] = Math.round(this.refs.body.scrollTop);
        save(POSITION_KEY, values);
      }, { passive: true });
    }

    cycleFontSize() {
      this.fontSize = this.fontSize >= 28 ? 16 : this.fontSize + 2;
      this.host.querySelector("#ar-text").style.setProperty("--reader-font-size", this.fontSize + "px");
      this.host.querySelector("#ar-font-size").textContent = this.fontSize;
      this.savePreferences();
    }

    restorePosition() {
      const values = readSaved(POSITION_KEY, {});
      const value = Number(values[this.book.id + ":" + this.ch.num]);
      if (Number.isFinite(value) && value > 0) this.refs.body.scrollTop = value;
    }

    getCzechVoice() {
      if (!window.speechSynthesis || !window.speechSynthesis.getVoices) return null;
      const voices = window.speechSynthesis.getVoices();
      return voices.find((v) => /^cs(?:-|$)/i.test(v.lang)) || null;
    }

    setupFileAudio() {
      this.audio = new Audio(this.ch.audioUrl);
      this.audio.preload = "metadata";
      this.audio.playbackRate = this.speed;
      this.audio.addEventListener("loadedmetadata", () => this.syncUI());
      this.audio.addEventListener("timeupdate", () => {
        this.syncTimeline();
        this.syncAlignedWords();
      });
      this.audio.addEventListener("ended", () => {
        if (this.repeat) {
          this.audio.currentTime = 0;
          this.audio.play().catch(() => this.report("Аудиог давтаж тоглуулж чадсангүй."));
        } else {
          this.speaking = false;
          this.syncUI();
        }
      });
      this.audio.addEventListener("error", () => {
        this.speaking = false;
        this.report("Аудио файлыг ачаалж чадсангүй.");
        this.syncUI();
      });
    }

    report(message) {
      if (this.refs.status) this.refs.status.textContent = message || "";
    }

    toggleCollapsed() {
      this.collapsed = !this.collapsed;
      this.savePreferences();
      this.syncUI();
    }

    setSentence(index) {
      this.sentenceIndex = Math.max(0, Math.min(this.sentences.length - 1, index));
      this.host.querySelectorAll(".ar-sentence").forEach((node) => {
        node.classList.toggle("is-current", Number(node.dataset.sentence) === this.sentenceIndex);
      });
    }

    clearSentenceHighlight() {
      this.host.querySelectorAll(".ar-sentence.is-current").forEach((node) => node.classList.remove("is-current"));
    }

    setWord(wordId) {
      const last = this.host.querySelector(".ar-word.is-current");
      if (last) last.classList.remove("is-current");
      this.currentWordId = wordId;
      const current = this.host.querySelector('[data-word="' + wordId + '"]');
      if (current) current.classList.add("is-current");
    }

    syncAlignedWords() {
      if (!this.audio || !Array.isArray(this.ch.wordTimings)) return;
      const ms = this.audio.currentTime * 1000;
      const match = this.ch.wordTimings.find((entry) =>
        ms >= entry.startMs && ms < entry.endMs && Number.isInteger(entry.wordIndex));
      if (match) {
        this.setWord(match.wordIndex);
        const word = this.words[match.wordIndex];
        if (word) this.setSentence(word.sentenceId);
      }
    }

    togglePlay() {
      if (this.guidedActive) this.stopGuided();
      if (this.kind === "file") {
        if (!this.audio) return;
        if (this.audio.paused) {
          this.audio.play().then(() => {
            this.speaking = true;
            this.syncUI();
          }).catch(() => this.report("Аудиог эхлүүлж чадсангүй."));
        } else {
          this.audio.pause();
          this.speaking = false;
          this.syncUI();
        }
        return;
      }

      if (this.kind !== "tts") {
        this.report("Чех аудио болон төхөөрөмжийн дуу хоолой олдсонгүй.");
        return;
      }
      if (this.speaking && !this.paused) {
        window.speechSynthesis.pause();
        this.paused = true;
        this.syncUI();
        return;
      }
      if (this.paused) {
        window.speechSynthesis.resume();
        this.paused = false;
        this.speaking = true;
        this.syncUI();
        return;
      }
      if (!this.getCzechVoice()) {
        this.report("Утсан дээр Чех TTS дуу хоолой байхгүй. Чех хоолой суулгаад дахин оролдоно уу.");
        this.syncUI();
        return;
      }
      this.startTts(this.sentenceIndex < this.sentences.length ? this.sentenceIndex : 0, false);
    }

    // iOS Safari can drop the beginning of the next utterance when the previous
    // sentence ends and we synchronously cancel + speak again. Use ONE native
    // utterance for the whole remaining chapter; keep word boundaries optional.
    startTts(index, oneSentence) {
      const voice = this.getCzechVoice();
      if (!voice || !this.sentences.length) {
        this.report("Чех TTS дуу хоолой олдсонгүй.");
        return;
      }
      if (this.guidedActive) this.stopGuided();
      this.generation += 1;
      const gen = this.generation;
      window.speechSynthesis.cancel();
      const startIndex = Math.max(0, Math.min(this.sentences.length - 1, index));
      const selection = oneSentence ? this.sentences.slice(startIndex, startIndex + 1) :
        this.sentences.slice(startIndex);
      let transcript = "";
      const sections = selection.map((entry, i) => {
        if (i) transcript += "\n";
        const start = transcript.length;
        transcript += entry.text;
        return { entry, sentenceId: startIndex + i, start, end: transcript.length };
      });
      this.speaking = true;
      this.paused = false;
      this.playOnlySentence = oneSentence;
      this.setWord(-1);
      this.setSentence(startIndex);
      const utterance = new SpeechSynthesisUtterance(transcript);
      utterance.lang = "cs-CZ";
      utterance.voice = voice;
      utterance.rate = this.speed;
      this.utterance = utterance;
      utterance.onboundary = (event) => {
        if (gen !== this.generation || (event.name && event.name !== "word")) return;
        if (!Number.isFinite(event.charIndex)) return;
        const section = sections.find((part) =>
          event.charIndex >= part.start && event.charIndex < part.end);
        if (!section) return;
        this.setSentence(section.sentenceId);
        const charIndex = event.charIndex - section.start;
        const token = section.entry.tokens.find((w) =>
          charIndex >= w.start && charIndex < w.end);
        if (token) this.setWord(token.id);
      };
      utterance.onend = () => {
        if (gen !== this.generation) return;
        this.speaking = false;
        this.paused = false;
        this.setWord(-1);
        this.clearSentenceHighlight();
        this.syncUI();
        if (!oneSentence && this.repeat) {
          // Do not reenter speechSynthesis.cancel()/speak() inside Safari's
          // completion callback. The delay is a queue cleanup, NOT word timing.
          setTimeout(() => {
            if (gen === this.generation && this.repeat && !this.guidedActive) {
              this.startTts(0, false);
            }
          }, 180);
        } else {
          this.sentenceIndex = oneSentence ? this.sentenceIndex : 0;
          this.report("");
        }
      };
      utterance.onerror = (event) => {
        if (gen !== this.generation) return;
        this.speaking = false;
        this.paused = false;
        this.syncUI();
        if (event.error !== "interrupted" && event.error !== "canceled") {
          this.report("Төхөөрөмжийн TTS уншлага тасарлаа. Play дарж дахин оролдоно уу.");
        }
      };
      window.speechSynthesis.speak(utterance);
      this.report("");
      this.syncUI();
    }

    playSentence(index) {
      if (this.kind === "tts") {
        this.startTts(index, true);
        return;
      }
      if (this.kind === "file" && Array.isArray(this.ch.sentenceTimings)) {
        const timing = this.ch.sentenceTimings[index];
        if (timing && Number.isFinite(timing.startMs)) {
          this.audio.currentTime = timing.startMs / 1000;
          this.audio.play().then(() => {
            this.speaking = true;
            this.syncUI();
          }).catch(() => this.report("Өгүүлбэрийн аудио тоглосонгүй."));
          return;
        }
      }
      this.report("Энэ өгүүлбэрийн тусдаа аудио/хугацаа холбогдоогүй.");
    }

    getRecognitionConstructor() {
      return window.SpeechRecognition || window.webkitSpeechRecognition || null;
    }

    setGuidedPhase(phase, message = "") {
      this.guidedPhase = phase;
      this.guidedError = message;
      this.syncGuidedUI();
    }

    syncGuidedUI() {
      if (!this.refs || !this.refs.guideToggle) return;
      const available = !!this.getRecognitionConstructor() && window.isSecureContext;
      this.refs.guideToggle.disabled = !available && !this.guidedActive;
      this.refs.guideToggle.setAttribute("aria-checked", String(this.guidedActive));
      this.refs.guideToggle.setAttribute("aria-label", this.guidedActive ?
        "Дуудаж унших горимыг унтраах" : "Дуудаж унших горимыг асаах");
      this.refs.guideToggle.classList.toggle("is-active", this.guidedActive);
      const current = this.words[this.guidedIndex];
      const word = current ? current.text : "";
      const progress = Math.min(this.guidedIndex, this.words.length) + "/" + this.words.length;
      const message = this.guidedError ||
        (this.guidedPhase === "listening" ? "Сонсож байна · " + progress + " · " + word :
        this.guidedPhase === "starting" ? "Микрофоны зөвшөөрлийг шалгаж байна…" :
        this.guidedPhase === "help" ? "Одоогийн үгийг сонсгож байна: " + word :
        this.guidedPhase === "completed" ? "Бүх үг танигдлаа (дуудлагын оноо биш)" :
        this.guidedPhase === "paused" ? "Толь нээлттэй · Үргэлжлүүлэх дарна уу" :
        this.guidedActive ? "Үргэлжлүүлэх дарж микрофоноо нээнэ үү · " + word :
        available ? "Чех үгийг дарааллаар нь таних туршилт" :
        "Энэ браузерт Чех STT дэмжигдээгүй эсвэл HTTPS шаардлагатай");
      this.refs.guideMessage.textContent = message;
      this.refs.guideHelp.disabled = !this.guidedActive ||
        this.guidedPhase === "completed" || this.guidedPhase === "help" ||
        !this.getCzechVoice();
      this.refs.guideRetry.hidden = !this.guidedActive ||
        !["ready", "paused", "error"].includes(this.guidedPhase);
    }

    toggleGuided() {
      if (this.guidedActive) {
        this.stopGuided();
        this.syncUI();
        return;
      }
      if (!window.isSecureContext || !this.getRecognitionConstructor()) {
        this.report("Энэ браузер Чех яриа танихыг дэмжихгүй. Safari-г HTTPS хаягаар нээнэ үү.");
        this.syncGuidedUI();
        return;
      }
      if (!this.words.length) return;
      if (this.audio && !this.audio.paused) this.audio.pause();
      this.generation += 1;
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      this.speaking = false;
      this.paused = false;
      this.guidedActive = true;
      this.guidedIndex = 0;
      this.setWord(this.words[0].id);
      this.setSentence(this.words[0].sentenceId);
      this.startGuidedRecognition();
      this.syncUI();
    }

    abortGuidedRecognition() {
      this.guidedSession += 1;
      const old = this.guidedRecognition;
      this.guidedRecognition = null;
      if (old) {
        old.onstart = null;
        old.onresult = null;
        old.onerror = null;
        old.onend = null;
        try { old.abort(); } catch (_err) { /* already stopped */ }
      }
    }

    stopGuided() {
      this.guidedActive = false;
      this.abortGuidedRecognition();
      if (this.guidedHelpUtterance) {
        this.guidedHelpUtterance = null;
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      }
      this.guidedPhase = "disabled";
      this.guidedError = "";
      this.setWord(-1);
      this.clearSentenceHighlight();
      this.syncGuidedUI();
    }

    startGuidedRecognition() {
      if (!this.guidedActive) return;
      const Recognition = this.getRecognitionConstructor();
      if (!Recognition || !window.isSecureContext) {
        this.setGuidedPhase("error", "Микрофон/яриа таних боломжгүй (HTTPS эсвэл STT дэмжлэг шалга).");
        return;
      }
      this.abortGuidedRecognition();
      const session = this.guidedSession;
      const recognizer = new Recognition();
      this.guidedRecognition = recognizer;
      this.guidedProcessedResults = new Set();
      recognizer.lang = "cs-CZ";
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.maxAlternatives = 1;
      recognizer.onstart = () => {
        if (session === this.guidedSession && this.guidedActive) this.setGuidedPhase("listening");
      };
      recognizer.onresult = (event) => {
        if (session !== this.guidedSession || !this.guidedActive) return;
        for (let i = event.resultIndex || 0; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (!result.isFinal || this.guidedProcessedResults.has(i)) continue;
          this.guidedProcessedResults.add(i);
          const text = result[0] && result[0].transcript || "";
          const spokenWords = text.toLocaleLowerCase("cs-CZ").normalize("NFC")
            .match(/[\p{L}\p{M}]+/gu) || [];
          let accepted = 0;
          for (const spokenWord of spokenWords) {
            const expected = this.words[this.guidedIndex];
            if (!expected) break;
            const target = expected.text.toLocaleLowerCase("cs-CZ").normalize("NFC")
              .replace(/[^\p{L}\p{M}]/gu, "");
            if (spokenWord !== target) break;
            this.guidedIndex += 1;
            accepted += 1;
            if (this.guidedIndex >= this.words.length) {
              if (this.repeat) {
                this.guidedIndex = 0;
                this.setGuidedPhase("listening", "Нэг мөчлөг дууслаа · эхний үг рүү буцлаа");
              } else {
                this.setGuidedPhase("completed");
                this.abortGuidedRecognition();
                this.setWord(-1);
                this.clearSentenceHighlight();
                return;
              }
            }
          }
          const expected = this.words[this.guidedIndex];
          if (expected) {
            this.setWord(expected.id);
            this.setSentence(expected.sentenceId);
          }
          if (accepted === 0 && spokenWords.length) {
            this.setGuidedPhase("listening", "Одоогийн үг танигдсангүй. Дахин хэлээрэй: " + (expected?.text || ""));
          } else {
            this.setGuidedPhase("listening");
          }
        }
      };
      recognizer.onerror = (event) => {
        if (session !== this.guidedSession || !this.guidedActive) return;
        const errors = {
          "not-allowed": "Микрофоны зөвшөөрөл татгалзсан. Safari-ийн тохиргооноос зөвшөөрнө үү.",
          "service-not-allowed": "Браузерын яриа таних үйлчилгээ хаалттай байна.",
          "audio-capture": "Микрофон ашиглах боломжгүй байна.",
          "network": "Яриа таних үйлчилгээ сүлжээнд холбогдсонгүй.",
          "language-not-supported": "Энэ төхөөрөмж cs-CZ яриа танихыг дэмжихгүй байна.",
          "no-speech": "Яриа сонсогдсонгүй. Үргэлжлүүлэх дарж дахин оролдоно уу."
        };
        this.setGuidedPhase("error", errors[event.error] || "Яриа танихад алдаа гарлаа: " + (event.error || "unknown"));
      };
      recognizer.onend = () => {
        if (session !== this.guidedSession || !this.guidedActive) return;
        this.guidedRecognition = null;
        if (this.guidedPhase !== "completed" && this.guidedPhase !== "error") {
          this.setGuidedPhase("ready", "Микрофон зогслоо. Үргэлжлүүлэх дарж дахин сонсоно.");
        }
      };
      this.setGuidedPhase("starting");
      try {
        // Recognition.start() prompts for microphone permission. Avoid using
        // getUserMedia concurrently: some iOS WebKit builds mute its track.
        recognizer.start();
      } catch (_error) {
        this.guidedRecognition = null;
        this.setGuidedPhase("error", "Микрофон эхэлсэнгүй. Дахин оролдох товчийг дарна уу.");
      }
    }

    playStuckWord() {
      if (!this.guidedActive || this.guidedIndex >= this.words.length) return;
      const voice = this.getCzechVoice();
      if (!voice) {
        this.setGuidedPhase("ready", "Төхөөрөмж дээр Чех TTS дуу хоолой алга.");
        return;
      }
      // The guide voice may NEVER be recognized as a learner's own speech.
      this.abortGuidedRecognition();
      const session = this.guidedSession;
      const word = this.words[this.guidedIndex];
      this.setGuidedPhase("help");
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word.text);
      utterance.lang = "cs-CZ";
      utterance.voice = voice;
      utterance.rate = Math.min(this.speed, 0.85);
      this.guidedHelpUtterance = utterance;
      const finish = () => {
        if (session !== this.guidedSession || !this.guidedActive) return;
        this.guidedHelpUtterance = null;
        // Explicit restart is safer on iOS than a repeated recognition loop.
        this.setGuidedPhase("ready", "Жишгийг сонслоо · Үргэлжлүүлэх дарж өөрөө хэлнэ үү");
      };
      utterance.onend = finish;
      utterance.onerror = finish;
      window.speechSynthesis.speak(utterance);
    }

    skip(seconds) {
      if (!this.audio || !Number.isFinite(this.audio.duration)) return;
      this.audio.currentTime = Math.max(0, Math.min(this.audio.duration, this.audio.currentTime + seconds));
      this.syncTimeline();
    }

    seek(percent) {
      if (!this.audio || !Number.isFinite(this.audio.duration)) return;
      this.audio.currentTime = this.audio.duration * Math.min(100, Math.max(0, percent)) / 100;
      this.syncTimeline();
    }

    syncTimeline() {
      if (!this.audio || !this.refs.seek) return;
      const duration = this.audio.duration;
      if (!Number.isFinite(duration) || duration <= 0) return;
      this.refs.seek.disabled = false;
      this.refs.seek.value = String(this.audio.currentTime * 100 / duration);
      this.refs.elapsed.textContent = formatTime(this.audio.currentTime);
      this.refs.duration.textContent = formatTime(duration);
    }

    syncUI() {
      if (!this.refs) return;
      this.syncGuidedUI();
      this.refs.player.classList.toggle("is-collapsed", this.collapsed);
      const collapseBtn = this.host.querySelector("#ar-collapse");
      collapseBtn.textContent = this.collapsed ? "⌃" : "⌄";
      collapseBtn.setAttribute("aria-label", this.collapsed ? "Тоглуулагч дэлгэх" : "Тоглуулагч хураах");
      this.refs.repeat.classList.toggle("is-active", this.repeat);
      this.refs.repeat.setAttribute("aria-pressed", String(this.repeat));
      const playing = this.kind === "file" ? !!(this.audio && !this.audio.paused) :
        this.speaking && !this.paused;
      this.refs.play.textContent = playing ? "Ⅱ" : "▶";
      this.refs.play.setAttribute("aria-label", playing ? "Түр зогсоох" : "Тоглуулах");
      const nativeReady = this.kind === "file" && this.audio &&
        Number.isFinite(this.audio.duration) && this.audio.duration > 0;
      this.refs.back.disabled = !nativeReady;
      this.refs.forward.disabled = !nativeReady;
      this.refs.seek.disabled = !nativeReady;
      if (this.kind === "file") {
        this.refs.source.textContent = "Бодит аудио файл" +
          (Array.isArray(this.ch.wordTimings) ? " · үгийн хугацаатай" : " · үгийн хугацаа холбогдоогүй");
        this.syncTimeline();
      } else if (this.kind === "tts") {
        this.refs.source.textContent = this.getCzechVoice() ?
          "Төхөөрөмжийн Чех TTS · секундээр шилжүүлэхгүй" :
          "Чех TTS хоолой шаардана · бэлэн аудио байхгүй";
        this.refs.elapsed.textContent = "—:—";
        this.refs.duration.textContent = "—:—";
      } else {
        this.refs.source.textContent = "Аудио холбоогүй · TTS дэмжигдээгүй";
        this.refs.play.disabled = true;
      }
    }

    showWord(id) {
      if (this.guidedActive && this.guidedRecognition) {
        this.abortGuidedRecognition();
        this.setGuidedPhase("paused");
      }
      const word = this.words[id];
      if (!word) return;
      if (this.kind === "file" && this.audio && !this.audio.paused) this.audio.pause();
      if (this.kind === "tts" && this.speaking && !this.paused) {
        window.speechSynthesis.pause();
        this.paused = true;
      }
      this.syncUI();
      const known = this.ch.vocab.find((v) => normalizeCzech(v.cz) === normalizeCzech(word.text));
      const context = this.sentences[word.sentenceId]?.text || "";
      const shade = document.createElement("div");
      shade.className = "ar-sheet-shade";
      shade.id = "ar-quick-shade";
      shade.innerHTML =
        '<section class="ar-sheet" role="dialog" aria-modal="true" aria-label="Түргэн толь">' +
        '<div class="ar-sheet-head"><div><div class="ar-sheet-label">Түргэн толь · Чех</div>' +
        '<h3 lang="cs">' + html(word.text) + '</h3></div>' +
        '<button type="button" class="ar-icon-btn" data-close-sheet aria-label="Толь хаах">✕</button></div>' +
        '<p class="ar-sheet-meaning">' + (known ? html(known.mn) : "Баталгаатай утга бүртгэгдээгүй") + '</p>' +
        '<p class="ar-sheet-sentence" lang="cs">' + html(context) + '</p>' +
        '<p class="ar-sheet-note">' +
          (known ? "Энэ орчуулга нь номын жишээ үгийн сангаас авсан. Хувирал, утгын ялгал хараахан шалгагдаагүй." :
            "Дараагийн шатанд Чех хэлний үндсэн хэлбэр болон контекст толь холбогдоно.") +
        '</p></section>';
      shade.addEventListener("click", (event) => {
        if (event.target === shade || event.target.closest("[data-close-sheet]")) this.hideWord();
      });
      this.quickSheet = shade;
      this.host.appendChild(shade);
      const playContext = document.createElement("button");
      playContext.type = "button";
      playContext.className = "ar-sheet-listen";
      playContext.textContent = "▶ Өгүүлбэрийг сонсох";
      playContext.addEventListener("click", () => {
        this.hideWord();
        this.playSentence(word.sentenceId);
      });
      shade.querySelector(".ar-sheet").appendChild(playContext);
      const selected = this.host.querySelector('[data-word="' + id + '"]');
      if (selected) selected.classList.add("is-selected");
      this.selectedWord = selected;
    }

    hideWord() {
      if (this.quickSheet) this.quickSheet.remove();
      if (this.selectedWord) this.selectedWord.classList.remove("is-selected");
      this.quickSheet = null;
      this.selectedWord = null;
    }

    destroy() {
      this.generation += 1;
      this.stopGuided();
      this.hideWord();
      if (this.audio) {
        this.audio.pause();
        this.audio.removeAttribute("src");
        this.audio.load();
        this.audio = null;
      }
      if (this.kind === "tts" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.removeEventListener) {
          window.speechSynthesis.removeEventListener("voiceschanged", this.voicesChanged);
        }
      }
      this.speaking = false;
      this.host.classList.remove("aho-reader-shell");
    }
  }

  let instance = null;
  window.AhojReaderExperience = {
    mount(options) {
      if (instance) instance.destroy();
      instance = new CzechReader(options);
      return instance;
    },
    destroy() {
      if (instance) instance.destroy();
      instance = null;
    },
    closeQuickDictionary() {
      if (!instance || !instance.quickSheet) return false;
      instance.hideWord();
      return true;
    }
  };
})();
