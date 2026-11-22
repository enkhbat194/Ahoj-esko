/* AHOJ A0 pilot lesson runner.
 * Draft pedagogy only. No paid TTS, no server upload, no pronunciation grade.
 * Reuses phrases from the versioned A0 curriculum instead of inventing a second phrase bank.
 */
(function () {
  "use strict";

  const STORAGE_KEY = "ahoj.a0.pilot.v1";
  const PILOTS = [
    {
      id: "A0-T02-L01", topic: "A0-T02",
      items: ["Ahoj!", "Dobrý den.", "Na shledanou."],
      context: "Найз болон танихгүй хүнтэй мэндлэх хэллэг өөр байдаг.",
      recognize: { prompt: "Танихгүй насанд хүрсэн хүнтэй албан ёсоор мэндлэхэд?", options: ["Ahoj!", "Dobrý den.", "Na shledanou."], correct: "Dobrý den." },
      speak: "Ahoj!", speakCue: "Найзтайгаа уулзахдаа чангаар мэндэл.",
      recall: { prompt: "Найзтайгаа уулзахад аль чех хэллэг тохирох вэ?", options: ["Na shledanou.", "Ahoj!", "Dobrý den."], correct: "Ahoj!" },
      scenario: { prompt: "Албан уулзалт дуусахад юу гэж салах вэ?", options: ["Dobrý den.", "Ahoj!", "Na shledanou."], correct: "Na shledanou." }
    },
    {
      id: "A0-T02-L02", topic: "A0-T02",
      items: ["Jmenuji se Eba.", "Ahoj!"],
      context: "Жишээ хүний нэр Эба. Нэрээ хэлэх бүтцийг ажигла.",
      recognize: { prompt: "Намайг Эба гэдэг гэж хэлэхэд?", options: ["Ahoj!", "Jmenuji se Eba.", "To je Sára."], correct: "Jmenuji se Eba." },
      speak: "Jmenuji se Eba.", speakCue: "Жишээ нэрийг хэлээд, дараа нь өөрийн нэрээр орлуулан хэл.",
      recall: { prompt: "Өөрийгөө танилцуулах жишээ өгүүлбэр аль вэ?", options: ["To je Sára.", "Dobrý den.", "Jmenuji se Eba."], correct: "Jmenuji se Eba." },
      scenario: { prompt: "Хүн таныг хэн гэдгийг асуув. Эба гэдэг нэртэй бол?", options: ["Na shledanou.", "Jmenuji se Eba.", "Děkuji."], correct: "Jmenuji se Eba." }
    },
    {
      id: "A0-T03-L01", topic: "A0-T03",
      items: ["Nerozumím."],
      context: "Яриаг ойлгохгүй үедээ үүнийг хэлж болно.",
      recognize: { prompt: "«Би ойлгохгүй байна» гэсэн утгатай хэллэг аль вэ?", options: ["Prosím?", "Nerozumím.", "Pomalu, prosím."], correct: "Nerozumím." },
      speak: "Nerozumím.", speakCue: "Хэлж үзээд өөрийн дуу хоолойгоо сонсож болно.",
      recall: { prompt: "Ойлгохгүй байгаагаа илэрхийлэхэд?", options: ["Nerozumím.", "Ještě jednou, prosím.", "Prosím?"], correct: "Nerozumím." },
      scenario: { prompt: "Хэн нэгэн чехээр ярьж, та огт ойлгосонгүй. Юу хэлэх вэ?", options: ["Pomalu, prosím.", "Prosím?", "Nerozumím."], correct: "Nerozumím." }
    },
    {
      id: "A0-T03-L03", topic: "A0-T03",
      items: ["Nerozumím.", "Ještě jednou, prosím."],
      context: "Ойлгоогүйгээ хэлэх, дахин хэлүүлэх хоёр өөр зорилготой.",
      recognize: { prompt: "«Дахиад нэг удаа хэлнэ үү» гэсэн хүсэлт аль вэ?", options: ["Nerozumím.", "Ještě jednou, prosím.", "Pomalu, prosím."], correct: "Ještě jednou, prosím." },
      speak: "Ještě jednou, prosím.", speakCue: "Харилцагчаасаа давтан хэлэхийг эелдгээр хүс.",
      recall: { prompt: "Дахин нэг удаа хэлүүлэх хүсэлт аль нь вэ?", options: ["Prosím?", "Nerozumím.", "Ještě jednou, prosím."], correct: "Ještě jednou, prosím." },
      scenario: { prompt: "Хүн хурдан ярьж, та өгүүлбэрийг дахин сонсохыг хүсэв. Юу хэлэх вэ?", options: ["Ještě jednou, prosím.", "Nerozumím.", "Pomalu, prosím."], correct: "Ještě jednou, prosím." }
    }
  ];

  const course = window.AHOJ_A0_CURRICULUM;
  if (!course || !Array.isArray(course.topics)) throw new Error("A0 pilot requires AHOJ_A0_CURRICULUM");
  const specs = new Map();
  for (const pilot of PILOTS) {
    const topic = course.topics.find((item) => item.id === pilot.topic);
    if (!topic || !topic.lessons.some((item) => item.id === pilot.id)) {
      throw new Error("Pilot lesson ID missing in canonical A0 outline: " + pilot.id);
    }
    const bank = new Map(topic.phrases.map((phrase) => [phrase.cz, phrase]));
    const phrases = [...pilot.items, pilot.speak, ...["recognize", "recall", "scenario"].flatMap((key) => pilot[key].options)];
    for (const phrase of phrases) {
      if (!bank.has(phrase)) throw new Error("Pilot phrase not in canonical topic bank: " + phrase);
    }
    specs.set(pilot.id, Object.assign({}, pilot, {
      title: topic.lessons.find((item) => item.id === pilot.id).title_mn,
      phrases: pilot.items.map((cz) => bank.get(cz))
    }));
  }

  let memoryRecords = {};
  let current = null;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[char]));
  }

  function readRecords() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const value = raw ? JSON.parse(raw) : {};
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch (_) { return memoryRecords; }
  }

  function writeRecord(id, patch) {
    const records = readRecords();
    const prior = records[id] && typeof records[id] === "object" ? records[id] : {};
    records[id] = Object.assign({}, prior, patch);
    memoryRecords = records;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); } catch (_) { /* Memory fallback. */ }
    return records[id];
  }

  function getProgress(id) {
    const value = readRecords()[id];
    return value && typeof value === "object" ? Object.assign({}, value) : null;
  }

  function getStatus(id) {
    if (!specs.has(id)) return "unavailable";
    const progress = getProgress(id);
    if (!progress) return "new";
    if (progress.completedAt) {
      return Number(progress.reviewDueAt) <= Date.now() ? "review_due" : "practice_done";
    }
    return Number(progress.stepIndex) > 0 ? "in_progress" : "new";
  }

  function clearAudio(session) {
    if (session.timer) clearTimeout(session.timer);
    session.timer = null;
    if (session.recorder && session.recorder.state === "recording") {
      try { session.recorder.stop(); } catch (_) { /* Already stopped. */ }
    }
    if (session.stream) session.stream.getTracks().forEach((track) => track.stop());
    session.stream = null;
    session.recorder = null;
    if (session.recordedUrl) URL.revokeObjectURL(session.recordedUrl);
    session.recordedUrl = null;
    if (session.speaking && window.speechSynthesis) window.speechSynthesis.cancel();
    session.speaking = false;
  }

  function destroy() {
    if (!current) return;
    clearAudio(current);
    current = null;
  }

  function audioFeedback(message) {
    if (!current) return;
    const node = current.host.querySelector("[data-pilot-audio-feedback]");
    if (node) node.textContent = message;
  }

  function speakCzech(phrase) {
    if (!current || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      audioFeedback("Энэ төхөөрөмж дээр чех дуу хоолой ашиглах боломжгүй.");
      return;
    }
    const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
    const voice = voices.find((item) => /^cs(?:-|$)/i.test(item.lang));
    if (!voice) {
      audioFeedback("Чех хоолой суулгагдаагүй байна. Энэ нь бэлэн MP3 аудио биш.");
      return;
    }
    const utterance = new window.SpeechSynthesisUtterance(phrase);
    utterance.voice = voice;
    utterance.lang = "cs-CZ";
    utterance.rate = 0.85;
    const session = current;
    window.speechSynthesis.cancel();
    session.speaking = true;
    utterance.onend = () => { session.speaking = false; };
    utterance.onerror = () => { session.speaking = false; audioFeedback("Төхөөрөмжийн дуу тоглуулахад алдаа гарлаа."); };
    window.speechSynthesis.speak(utterance);
    audioFeedback("Төхөөрөмжийн чех хоолой • туршилтын дуудлага (баталгаажаагүй).");
  }

  function next() {
    if (!current) return;
    const session = current;
    clearAudio(session);
    session.index = Math.min(5, session.index + 1);
    session.answered = false;
    if (session.index === 5) {
      const now = Date.now();
      // A pilot reminder heuristic, not a validated SRS mastery algorithm.
      writeRecord(session.spec.id, {
        stepIndex: 5, mistakes: session.mistakes, selfReportedSpoken: session.selfReported,
        completedAt: now, reviewDueAt: now + (session.mistakes ? 1 : 3) * 86400000,
        result: "practice_only"
      });
    } else {
      writeRecord(session.spec.id, {
        stepIndex: session.index, mistakes: session.mistakes,
        selfReportedSpoken: session.selfReported
      });
    }
    render();
  }

  function choiceHtml(question) {
    return '<p class="lp-prompt">' + escapeHtml(question.prompt) + '</p>' +
      '<div class="lp-options">' + question.options.map((value, index) =>
        '<button type="button" class="lp-option" data-pilot-choice="' + index + '">' +
        escapeHtml(value) + '</button>'
      ).join("") + '</div>' +
      '<p class="lp-feedback" role="status" aria-live="polite" data-pilot-feedback></p>' +
      '<button type="button" class="lp-primary" data-pilot-next hidden>Үргэлжлүүлэх ›</button>';
  }

  function render() {
    if (!current) return;
    const session = current;
    const spec = session.spec;
    const step = session.index;
    let body = "";
    if (step === 0) {
      body = '<p class="lp-prompt">' + escapeHtml(spec.context) + '</p>' +
        '<div class="lp-phrases">' + spec.phrases.map((phrase) =>
          '<div class="lp-phrase"><div><strong lang="cs">' + escapeHtml(phrase.cz) +
          '</strong><p>' + escapeHtml(phrase.mn_natural) + '</p></div>' +
          '<button type="button" data-pilot-audio="' + escapeHtml(phrase.cz) + '" aria-label="' +
          escapeHtml(phrase.cz) + ' сонсох">▶</button></div>'
        ).join("") + '</div>' +
        '<button type="button" class="lp-primary" data-pilot-next>Утгыг ойлголоо ›</button>';
    } else if (step === 1) {
      body = choiceHtml(spec.recognize);
    } else if (step === 2) {
      body = '<p class="lp-prompt">' + escapeHtml(spec.speakCue) + '</p>' +
        '<div class="lp-speaking"><p class="lp-cz" lang="cs">' + escapeHtml(spec.speak) + '</p>' +
        '<button type="button" class="lp-secondary" data-pilot-audio="' + escapeHtml(spec.speak) +
        '">▶ Сонсох</button></div>' +
        '<p class="lp-note">Микрофоны бичлэг зөвхөн энэ төхөөрөмж дээр түр хадгалагдана. Серверт илгээхгүй. Автомат дуудлагын оноо өгөхгүй.</p>' +
        '<div class="lp-rec-actions"><button type="button" class="lp-secondary" data-pilot-record>● Бичлэг хийх</button>' +
        '<button type="button" class="lp-secondary" data-pilot-playback hidden>▶ Өөрийгөө сонсох</button></div>' +
        '<button type="button" class="lp-primary" data-pilot-said>Чангаар хэлж давтлаа ›</button>';
    } else if (step === 3) {
      body = choiceHtml(spec.recall);
    } else if (step === 4) {
      body = choiceHtml(spec.scenario);
    } else {
      const due = new Date(getProgress(spec.id).reviewDueAt);
      body = '<div class="lp-finish-icon">✓</div><h3>Дасгалаа хийж дуусгалаа</h3>' +
        '<p class="lp-note">Энэ бол туршилтын дасгал. Чех хэлний редакцын шалгалт, бодит дуудлагын үнэлгээ хийгдээгүй. «Эзэмшсэн» гэсэн дүн биш.</p>' +
        '<p class="lp-due">Дараагийн давталт: ' + escapeHtml(due.toLocaleDateString("mn-MN")) + '</p>' +
        '<button type="button" class="lp-primary" data-pilot-back>Хичээлүүд рүү буцах</button>' +
        '<button type="button" class="lp-secondary" data-pilot-repeat>Дахин давтах</button>';
    }

    const labels = ["Сонсож ойлгох", "Утга таних", "Чангаар давтах", "Санаж сонгох", "Нөхцөлд хэрэглэх", "Дууссан"];
    session.host.innerHTML =
      '<section id="a0PilotRoot" class="lp-screen" aria-label="A0 туршилтын хичээл">' +
        '<header class="lp-header"><button type="button" class="lp-back" data-pilot-back aria-label="Буцах">‹</button>' +
        '<div><p class="lp-eyebrow">A0 • ТУРШИЛТ • ' + escapeHtml(spec.id) + '</p>' +
        '<h2>' + escapeHtml(spec.title) + '</h2></div></header>' +
        '<div class="lp-progress" role="progressbar" aria-valuenow="' + Math.round(step / 5 * 100) +
        '" aria-valuemin="0" aria-valuemax="100"><span style="width:' + (step / 5 * 100) + '%"></span></div>' +
        '<div class="lp-card"><p class="lp-step">' + escapeHtml(labels[step]) + ' · ' + Math.min(step + 1, 5) + '/5</p>' +
        body + '<p class="lp-audio-feedback" data-pilot-audio-feedback role="status" aria-live="polite"></p></div>' +
        '<p class="lp-disclaimer">Туршилтын агуулга · эх хэллэгүүдийн редакцын хяналт хүлээгдэж байна.</p>' +
      '</section>';
  }

  function handleChoice(index) {
    if (!current || current.answered) return;
    const spec = current.spec;
    const question = current.index === 1 ? spec.recognize : current.index === 3 ? spec.recall : spec.scenario;
    if (![1, 3, 4].includes(current.index) || !question || !question.options[index]) return;
    const root = current.host;
    const feedback = root.querySelector("[data-pilot-feedback]");
    if (question.options[index] === question.correct) {
      current.answered = true;
      root.querySelectorAll("[data-pilot-choice]").forEach((button) => {
        button.disabled = true;
        if (Number(button.dataset.pilotChoice) === index) button.classList.add("is-correct");
      });
      feedback.textContent = "Зөв. Дараагийн алхамд орно.";
      root.querySelector("[data-pilot-next]").hidden = false;
    } else {
      current.mistakes += 1;
      writeRecord(current.spec.id, { mistakes: current.mistakes });
      feedback.textContent = "Энэ нөхцөлд тохирохгүй. Дахин сонгоорой.";
      const button = root.querySelector('[data-pilot-choice="' + index + '"]');
      if (button) button.classList.add("is-wrong");
    }
  }

  async function toggleRecording() {
    if (!current || current.index !== 2) return;
    const session = current;
    const button = session.host.querySelector("[data-pilot-record]");
    if (session.recorder && session.recorder.state === "recording") {
      session.recorder.stop();
      button.textContent = "● Дахин бичих";
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      audioFeedback("Энэ браузерт микрофоны бичлэг дэмжигдээгүй. Чангаар хэлээд үргэлжлүүлж болно.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (current !== session) { stream.getTracks().forEach((track) => track.stop()); return; }
      if (session.recordedUrl) URL.revokeObjectURL(session.recordedUrl);
      session.recordedUrl = null;
      const recorder = new window.MediaRecorder(stream);
      const chunks = [];
      session.stream = stream;
      session.recorder = recorder;
      recorder.ondataavailable = (event) => { if (event.data && event.data.size) chunks.push(event.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (current !== session || session.recorder !== recorder) return;
        session.stream = null;
        if (chunks.length) {
          session.recordedUrl = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
          const playback = session.host.querySelector("[data-pilot-playback]");
          if (playback) playback.hidden = false;
        }
        if (session.timer) clearTimeout(session.timer);
        session.timer = null;
        audioFeedback("Бичлэг зөвхөн түр санах ойд байна.");
      };
      recorder.start();
      button.textContent = "■ Бичлэг зогсоох";
      audioFeedback("Бичиж байна • 12 секундийн дээд хугацаа.");
      session.timer = setTimeout(() => {
        if (current === session && recorder.state === "recording") {
          recorder.stop();
          button.textContent = "● Дахин бичих";
        }
      }, 12000);
    } catch (_) {
      audioFeedback("Микрофон ашиглах зөвшөөрөл өгөөгүй эсвэл төхөөрөмж дэмжихгүй байна.");
    }
  }

  function mount(host, lessonId, options) {
    if (!host || !specs.has(lessonId)) return false;
    destroy();
    const saved = getProgress(lessonId);
    current = {
      host, spec: specs.get(lessonId), options: options || {},
      index: saved && !saved.completedAt ? Math.max(0, Math.min(4, Number(saved.stepIndex) || 0)) : 0,
      mistakes: saved ? Number(saved.mistakes) || 0 : 0,
      selfReported: saved ? saved.selfReportedSpoken === true : false,
      answered: false, stream: null, recorder: null, recordedUrl: null, timer: null, speaking: false
    };
    host.addEventListener("click", onClick);
    render();
    return true;
  }

  function onClick(event) {
    if (!current || !current.host.contains(event.target)) return;
    const button = event.target.closest("button");
    if (!button) return;
    if (button.hasAttribute("data-pilot-back")) {
      const callback = current.options.onBack;
      const host = current.host;
      host.removeEventListener("click", onClick);
      destroy();
      if (typeof callback === "function") callback();
    } else if (button.hasAttribute("data-pilot-choice")) {
      handleChoice(Number(button.dataset.pilotChoice));
    } else if (button.hasAttribute("data-pilot-next")) {
      if ([1, 3, 4].includes(current.index) && !current.answered) return;
      next();
    } else if (button.hasAttribute("data-pilot-said")) {
      current.selfReported = true;
      next();
    } else if (button.hasAttribute("data-pilot-audio")) {
      speakCzech(button.dataset.pilotAudio);
    } else if (button.hasAttribute("data-pilot-record")) {
      toggleRecording();
    } else if (button.hasAttribute("data-pilot-playback") && current.recordedUrl) {
      const player = new Audio(current.recordedUrl);
      player.play().catch(() => audioFeedback("Бичлэг тоглуулахад алдаа гарлаа."));
    } else if (button.hasAttribute("data-pilot-repeat")) {
      const host = current.host;
      const id = current.spec.id;
      const options = current.options;
      host.removeEventListener("click", onClick);
      mount(host, id, options);
    }
  }

  window.AhojLessonPilot = {
    ids: PILOTS.map((item) => item.id),
    has: (id) => specs.has(id),
    getSpec: (id) => specs.get(id) || null,
    getProgress, getStatus, mount,
    destroy: () => {
      if (current) current.host.removeEventListener("click", onClick);
      destroy();
    }
  };
})();