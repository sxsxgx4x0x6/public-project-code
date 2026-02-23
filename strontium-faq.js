(function() {
    'use strict';
  
    // ============================================
    // CONFIGURATION
    // ============================================
    const CONFIG = {
      zIndex: 10000,
      shineInterval: 240000,
      searchDebounceMs: 150
    };
  
    // ============================================
    // FAQ DATA
    // ============================================
    const FAQ_DATA = [
      {
        id: 'unplayable-audio',
        section: 'Section 1 · Unplayable Audio',
        items: [
          {
            q: 'Should I always evaluate based on audio rather than the transcript?',
            a: 'Yes. The transcript is for reference only — always evaluate based on what you hear in the audio. This applies even if the transcript doesn\'t match the audio, cuts off earlier than the audio, or is missing entirely. Note any significant discrepancies in your rationale, but they do not block task completion.'
          },
          {
            q: 'What if audio is garbled, partial, or cuts off mid-sentence?',
            a: 'Evaluate what you can hear and penalize appropriately based on the audio\'s actual state. Do not use the transcript to fill in what you couldn\'t hear.'
          },
          {
            q: 'What if only one response\'s audio is unavailable within a task?',
            a: 'First, try refreshing the page. If the issue persists:\n\n• If this is your first task, skip it and check a few more tasks before proceeding. If audio is missing across all tasks, this is likely a device or browser issue — do not work on this project.\n• If previous tasks were working fine, check the appropriate box and proceed:\n  — Transcript present: Check "One or more responses are invalid (no audio but transcript is present)" and evaluate criteria normally using the transcript. Audio generation criteria (e.g. pronunciation, naturalness, tone) will automatically receive Major Issues.\n  — Both audio and transcript missing: Check "One or more responses are invalid (no audio AND no transcription)" and mark Major Issues for all criteria for that response.\n• In both cases, overall preference will be affected by the lack of audio.\n\nNote: If these instructions conflict with your project-specific guidelines, follow the project guidelines instead.'
          },
          {
            q: 'What if audio is missing for one or a few tasks?',
            a: 'If audio is working in most tasks but missing in one or a few, proceed using the transcript for those tasks following the guidance above.'
          },
          {
            q: 'What if audio is missing across all my tasks?',
            a: 'This is likely a device or browser issue. Do not work on this project.'
          }
        ]
      },
      {
        id: 'audio-quality',
        section: 'Section 2 · Audio Quality & Evaluation',
        items: [
          {
            q: 'Should mispronounced words be penalized as an audio defect?',
            a: 'Yes. Mispronunciation is a legitimate audio quality issue and can be scored accordingly.'
          },
          {
            q: 'Is it important to specify exact timestamps when describing audio issues?',
            a: 'Exact timestamps are not required. Approximate indications like "mid-way through" or "near the beginning" are acceptable.'
          },
          {
            q: 'Should I use headphones?',
            a: 'You should listen using any device that allows you to hear clearly and at a comfortable volume.'
          },
          {
            q: 'Why do some models produce a transcript of the user\'s prompt?',
            a: 'This is to measure audio understanding. Sometimes, the criteria will require you to check their accuracy. Otherwise, you can comment on significant errors in the rationale.'
          },
          {
            q: 'If there is an issue in the audio, but not the transcript, should I still penalize the model?',
            a: 'The transcript is primarily there for your reference. You should always judge the audio only, unless a criterion specifically references transcript content.'
          },
          {
            q: 'How carefully should I listen for audio issues?',
            a: 'Don\'t strain to find issues a regular user wouldn\'t notice. Listen at a comfortable volume using any device with clear audio. If a criterion mentions an audio quality issue you don\'t readily notice during normal listening, rate it as No Issues.'
          }
        ]
      },
      {
        id: 'scoring',
        section: 'Section 3 · Scoring & Ratings',
        items: [
          {
            q: 'If a criterion is rated "No Issues" by the LLM checker but I disagree, what should I do?',
            a: 'Your judgment overrides the LLM. The LLM only has access to the transcript, not the audio, so it may miss issues. Apply your own evaluation.'
          },
          {
            q: '(Multi-turn) If a model repeats false information from a previous turn, should it be penalized?',
            a: 'Yes, consider this in the score. The model should ideally correct prior errors rather than confidently repeat them as fact.'
          },
          {
            q: 'If the prompt asks for something factual but the rubric includes incorrect information, do we rate based on the rubric or the facts?',
            a: 'Rate based on the rubric as written. If the rubric says the response should include X, rate accordingly even if X is factually incorrect.'
          },
          {
            q: 'Should we fact-check model responses?',
            a: 'Yes, fact-checking is appropriate. If a response includes inaccurate information (e.g., mismatched authors and titles, non-existent books), this can be scored as an issue against relevant criteria.'
          },
          {
            q: 'If a criterion says "the response should include X" and the response only includes one instance when more were expected, is that a minor or major issue?',
            a: 'Use your judgment based on how significantly the response fails the criterion\'s intent. If the prompt asked for 5 examples and only 1 was provided, that would typically be a major issue.'
          },
          {
            q: 'What if correcting a criterion rating makes the overall comparison look misleading?',
            a: 'There is some leeway in these cases. If correcting a rating to accurately reflect the criterion as written would make the overall comparison illogical — for example, removing the only visible penalization for a response that is genuinely worse — you may keep the preference choice that reflects the true relative quality of the responses, even if the corrected rubric scores don\'t fully support it.\n\nUse this leeway sparingly and explain your reasoning in the final explanation. Important: This is intended for rare, clear-cut cases where the rubric structure itself creates a misleading picture. Do not use this as a general override for preference choices you disagree with.'
          },
          {
            q: 'Is there a knowledge cutoff to be aware of?',
            a: 'Please evaluate the responses assuming they have up-to-date information.'
          },
          {
            q: 'How should I evaluate conditional criteria?',
            a: 'If the criterion is written such that it does not apply to a response, choose No Issues.'
          },
          {
            q: 'What if a prompt is adversarial?',
            a: 'This set should not contain adversarial prompts; if you encounter one, penalize a response for providing harmful information. If you find that the model refused to answer a safe prompt, you can penalize it for that, too.'
          }
        ]
      },
      {
        id: 'problematic-prompts',
        section: 'Section 4 · Impossible or Problematic Prompts',
        items: [
          {
            q: 'What if the rubric has actively contradictory criteria?',
            a: 'In no-edit projects, use your best judgment to infer the rubric author\'s intent and rate accordingly.'
          }
        ]
      },
      {
        id: 'submission',
        section: 'Section 5 · Submission Issues',
        items: [
          {
            q: 'I get "Your responses to the following questions were missing or incorrect" even though everything is filled out. What should I do?',
            a: 'Click on the error message itself — it should navigate you to the unanswered question. Also make sure you have clicked the "Calculate Model Scores" button. Check that the rubric is displayed as a list so you can see the first item. If you still cannot submit, contact support to report your time.'
          },
          {
            q: 'My task expired before I could submit. What should I do?',
            a: 'If the task shows up in "report time", you can just report the time. If it doesn\'t, then you should check and follow instructions from the platform FAQ.'
          },
          {
            q: 'I ran out of time but completed the task. Should I submit it with a note?',
            a: 'Yes — submit with a note in the optional comments field explaining the situation.'
          },
          {
            q: 'Do I log time for a task I ultimately skipped?',
            a: 'Yes. You can always log time for reading instructions and attempting a task, as that time applies regardless of whether the task was completed.'
          }
        ]
      },
      {
        id: 'llm-tools',
        section: 'Section 6 · LLM Analysis Tools',
        items: [
          {
            q: 'The LLM flagged issues that don\'t match my criteria numbers. What\'s going on?',
            a: 'The LLM may be referencing criteria that no longer exist or were renumbered. Cross-reference by context rather than number. If the flags don\'t apply, you can ignore them.'
          },
          {
            q: 'The LLM analysis is focusing on one criterion and ignoring others. Is it working correctly?',
            a: 'Not necessarily. The LLM checker\'s accuracy is not guaranteed. Use your judgment — your evaluation overrides the LLM\'s output.'
          },
          {
            q: '(R&R) If a Rating Explanation has been left blank, should I complete it even if it wasn\'t flagged?',
            a: 'Yes. If any feedback area is completely blank, review the task yourself and regenerate the LLM analysis to provide guidance.'
          }
        ]
      },
      {
        id: 'misc',
        section: 'Section 7 · Miscellaneous',
        items: [
          {
            q: 'Is a prompt asking the model to replicate animal noises adversarial?',
            a: 'No. Requesting animal noises is not asking the model to do something unsafe or harmful, so it is not considered adversarial.'
          },
          {
            q: 'Can a model change its voice to portray a character or express emotions like anger?',
            a: 'Yes, if the prompt explicitly requests this and it is not harmful or offensive. Do not penalize models unnecessarily for attempting voice/character changes when explicitly asked.'
          },
          {
            q: 'For a prompt asking for a "rap," can we expect models to search the internet?',
            a: 'Criteria should reference existing, verifiable examples (e.g., naming real artists or styles) rather than requiring internet search. Avoid criteria that rely on an endless open pool of possible correct answers with no fixed reference point.'
          },
          {
            q: 'Is there audio in some tasks from TV shows or copyrighted content?',
            a: 'If you notice potentially copyrighted audio content in a prompt, flag it in the Optional Comments for admin review. Do not mention it in the task rationale.'
          }
        ]
      }
    ];
  
    // ============================================
    // STATE
    // ============================================
    let isOpen = false;
    let searchQuery = '';
    let openItemKey = null; // track which Q is expanded: "sectionIdx-itemIdx"
    let shineInterval = null;
    let searchDebounceTimer = null;
  
    // ============================================
    // ICONS (inline SVG strings)
    // ============================================
    const ICONS = {
      question: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
      close: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>',
      search: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>',
      chevron: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>',
      book: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>'
    };
  
    // ============================================
    // STYLES
    // ============================================
    const STYLES = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap');
  
      @keyframes sfqShine {
        0%   { background-position: 200% center; }
        100% { background-position: -200% center; }
      }
      @keyframes sfqFadeIn {
        from { opacity: 0; transform: translate(-50%,-50%) scale(0.96); }
        to   { opacity: 1; transform: translate(-50%,-50%) scale(1); }
      }
      @keyframes sfqPulse {
        0%, 100% { box-shadow: 0 2px 12px rgba(30,58,95,.25), 0 0 0 3px rgba(79,108,176,.3); }
        50%      { box-shadow: 0 2px 12px rgba(30,58,95,.25), 0 0 0 5px rgba(79,108,176,.15), 0 0 24px rgba(79,108,176,.12); }
      }
  
      /* ── Trigger Button ── */
      .sfq-trigger {
        position: fixed;
        bottom: 24px;
        left: 24px;
        z-index: ${CONFIG.zIndex};
        height: 46px;
        padding: 0 20px;
        border-radius: 12px;
        border: none;
        cursor: pointer;
        background: #1a2a4a;
        color: #fff;
        font-family: 'DM Sans', -apple-system, sans-serif;
        font-size: 13.5px;
        font-weight: 600;
        letter-spacing: 0.2px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 2px 12px rgba(30,58,95,.25), 0 0 0 3px rgba(79,108,176,.3);
        transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        animation: sfqPulse 2.8s ease-in-out infinite;
        white-space: nowrap;
      }
      .sfq-trigger:hover {
        transform: translateY(-2px) scale(1.03);
        box-shadow: 0 4px 20px rgba(30,58,95,.3), 0 0 0 4px rgba(79,108,176,.4);
      }
      .sfq-trigger.sfq-open {
        animation: none;
        background: #9b3c34;
        box-shadow: 0 2px 12px rgba(155,60,52,.3), 0 0 0 3px rgba(155,60,52,.25);
      }
      .sfq-trigger.sfq-shining {
        background: linear-gradient(90deg, #1a2a4a 0%, #2c4a7c 30%, rgba(255,255,255,0.18) 50%, #2c4a7c 70%, #1a2a4a 100%);
        background-size: 300% auto;
        animation: sfqShine 2s ease-in-out;
      }
      .sfq-trigger svg { width: 16px; height: 16px; flex-shrink: 0; }
  
      /* ── Overlay ── */
      .sfq-overlay {
        position: fixed;
        inset: 0;
        z-index: ${CONFIG.zIndex + 1};
        background: rgba(15,20,30,0.38);
        backdrop-filter: blur(5px);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }
      .sfq-overlay.sfq-visible { opacity: 1; pointer-events: auto; }
  
      /* ── Panel ── */
      .sfq-panel {
        position: fixed;
        z-index: ${CONFIG.zIndex + 2};
        top: 50%;
        left: 50%;
        transform: translate(-50%,-50%) scale(0.96);
        width: 75vw;
        max-width: 860px;
        height: 75vh;
        max-height: 720px;
        background: #fafaf8;
        border-radius: 18px;
        box-shadow: 0 24px 80px rgba(0,0,0,0.2), 0 2px 12px rgba(0,0,0,0.08);
        display: flex;
        flex-direction: column;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease, transform 0.3s ease;
        overflow: hidden;
        border: 1px solid rgba(0,0,0,0.06);
        font-family: 'DM Sans', -apple-system, sans-serif;
      }
      .sfq-panel.sfq-visible {
        opacity: 1;
        pointer-events: auto;
        transform: translate(-50%,-50%) scale(1);
        animation: sfqFadeIn 0.3s ease forwards;
      }
  
      /* ── Header ── */
      .sfq-header {
        padding: 22px 28px 14px;
        border-bottom: 1px solid #e5e2dc;
        flex-shrink: 0;
        background: linear-gradient(180deg, #fafaf8 0%, #f4f3f0 100%);
      }
      .sfq-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 14px;
      }
      .sfq-header-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .sfq-header-icon {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        background: #1a2a4a;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .sfq-header-icon svg { width: 18px; height: 18px; }
      .sfq-header-title {
        font-size: 16px;
        font-weight: 700;
        color: #1a1a2e;
        letter-spacing: -0.3px;
        line-height: 1.2;
      }
      .sfq-header-subtitle {
        font-size: 12.5px;
        color: #7a7870;
        margin-top: 1px;
      }
      .sfq-close-btn {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        border: none;
        background: rgba(0,0,0,0.04);
        color: #64605a;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s, color 0.15s;
      }
      .sfq-close-btn:hover { background: rgba(0,0,0,0.08); color: #1a1a2e; }
      .sfq-close-btn svg { width: 16px; height: 16px; }
  
      /* ── Search ── */
      .sfq-search-wrap {
        position: relative;
      }
      .sfq-search-input {
        width: 100%;
        padding: 10px 14px 10px 38px;
        border: 1.5px solid #ddd9d1;
        border-radius: 10px;
        font-family: 'DM Sans', sans-serif;
        font-size: 14px;
        background: #fff;
        outline: none;
        color: #1a1a2e;
        transition: border-color 0.2s;
        box-sizing: border-box;
      }
      .sfq-search-input::placeholder { color: #b0aca4; }
      .sfq-search-input:focus { border-color: #4f6cb0; }
      .sfq-search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        width: 16px;
        height: 16px;
        color: #9a9890;
        pointer-events: none;
      }
      .sfq-search-count {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 11.5px;
        color: #8a8680;
        background: #ebe8e3;
        padding: 2px 8px;
        border-radius: 6px;
        font-weight: 500;
      }
  
      /* ── Body ── */
      .sfq-body {
        flex: 1;
        overflow-y: auto;
        scroll-behavior: smooth;
      }
      .sfq-body::-webkit-scrollbar { width: 6px; }
      .sfq-body::-webkit-scrollbar-track { background: transparent; }
      .sfq-body::-webkit-scrollbar-thumb { background: #d4d0ca; border-radius: 3px; }
  
      /* ── Sections ── */
      .sfq-section-header {
        position: sticky;
        top: 0;
        z-index: 2;
        padding: 14px 28px 8px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.9px;
        text-transform: uppercase;
        color: #4f6cb0;
        background: #fafaf8;
      }
      .sfq-section-header.sfq-hidden { display: none; }
  
      /* ── Items ── */
      .sfq-item {
        border-bottom: 1px solid #eceae5;
      }
      .sfq-item.sfq-hidden { display: none; }
  
      .sfq-question-btn {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 13px 28px;
        cursor: pointer;
        background: none;
        border: none;
        width: 100%;
        text-align: left;
        font-family: 'DM Sans', sans-serif;
        font-size: 14px;
        font-weight: 600;
        color: #2c2c3a;
        line-height: 1.5;
        transition: background 0.12s;
      }
      .sfq-question-btn:hover { background: rgba(79,108,176,0.04); }
      .sfq-question-btn:focus-visible {
        outline: 2px solid #4f6cb0;
        outline-offset: -2px;
        border-radius: 4px;
      }
  
      .sfq-chevron {
        flex-shrink: 0;
        width: 18px;
        height: 18px;
        margin-top: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #9a9890;
        transition: transform 0.25s ease, color 0.25s ease;
      }
      .sfq-chevron svg { width: 14px; height: 14px; }
      .sfq-item.sfq-expanded .sfq-chevron {
        transform: rotate(90deg);
        color: #4f6cb0;
      }
  
      .sfq-answer {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.35s ease, padding 0.25s ease;
        padding: 0 28px 0 56px;
      }
      .sfq-item.sfq-expanded .sfq-answer {
        max-height: 800px;
        padding: 0 28px 16px 56px;
      }
      .sfq-answer-text {
        font-size: 13.5px;
        line-height: 1.7;
        color: #4a4a56;
        white-space: pre-line;
      }
      .sfq-answer-text strong { color: #2c2c3a; font-weight: 600; }
      .sfq-answer-text em { font-style: italic; color: #5a5a6a; }
  
      /* ── Highlight ── */
      .sfq-highlight {
        background: #fef3c7;
        color: #92400e;
        padding: 0.05em 0.2em;
        border-radius: 3px;
      }
  
      /* ── No results ── */
      .sfq-no-results {
        display: none;
        padding: 48px 28px;
        text-align: center;
        color: #9a9890;
        font-size: 14px;
      }
      .sfq-no-results.sfq-visible { display: block; }
      .sfq-no-results svg {
        width: 48px;
        height: 48px;
        margin-bottom: 12px;
        opacity: 0.3;
      }
  
      /* ── Footer ── */
      .sfq-footer {
        padding: 10px 28px;
        border-top: 1px solid #e5e2dc;
        background: #f4f3f0;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      .sfq-footer-text {
        font-size: 12px;
        color: #9a9890;
      }
      .sfq-footer-text code {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        background: #e5e2dc;
        padding: 1px 5px;
        border-radius: 4px;
        color: #64605a;
      }
  
      /* ── Responsive ── */
      @media (max-width: 768px) {
        .sfq-panel {
          width: 95vw;
          height: 90vh;
          max-width: none;
          max-height: none;
          border-radius: 14px;
        }
        .sfq-trigger {
          bottom: 16px;
          left: 16px;
          height: 42px;
          padding: 0 16px;
          font-size: 12.5px;
        }
      }
    `;
  
    // ============================================
    // HELPERS
    // ============================================
    function escapeHtml(text) {
      if (text == null) return '';
      return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  
    function highlightText(text, query) {
      if (!query) return escapeHtml(text);
      const escaped = escapeHtml(text);
      const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return escaped.replace(regex, '<span class="sfq-highlight">$1</span>');
    }
  
    function debounce(fn, ms) {
      return function(...args) {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => fn.apply(this, args), ms);
      };
    }
  
    // ============================================
    // DOM CONSTRUCTION
    // ============================================
    function injectStyles() {
      const el = document.createElement('style');
      el.id = 'sfq-styles';
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
  
    function buildDOM() {
      // Trigger
      const trigger = document.createElement('button');
      trigger.className = 'sfq-trigger';
      trigger.id = 'sfq-trigger';
      trigger.setAttribute('aria-label', 'Open Project FAQ');
      trigger.setAttribute('title', 'Strontium Project FAQ');
      trigger.innerHTML = `${ICONS.question}<span>Project FAQ</span>`;
      document.body.appendChild(trigger);
  
      // Overlay
      const overlay = document.createElement('div');
      overlay.className = 'sfq-overlay';
      overlay.id = 'sfq-overlay';
      document.body.appendChild(overlay);
  
      // Panel
      const panel = document.createElement('div');
      panel.className = 'sfq-panel';
      panel.id = 'sfq-panel';
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
      panel.setAttribute('aria-label', 'Strontium Project FAQ');
  
      const totalQs = FAQ_DATA.reduce((sum, s) => sum + s.items.length, 0);
  
      panel.innerHTML = `
        <div class="sfq-header">
          <div class="sfq-header-row">
            <div class="sfq-header-left">
              <div class="sfq-header-icon">${ICONS.book}</div>
              <div>
                <div class="sfq-header-title">Strontium Projects — FAQ</div>
                <div class="sfq-header-subtitle">Evaluation guidelines · ${totalQs} questions</div>
              </div>
            </div>
            <button class="sfq-close-btn" id="sfq-close" aria-label="Close FAQ">${ICONS.close}</button>
          </div>
          <div class="sfq-search-wrap">
            <span class="sfq-search-icon">${ICONS.search}</span>
            <input type="text" class="sfq-search-input" id="sfq-search" placeholder="Search questions…" autocomplete="off" />
            <span class="sfq-search-count" id="sfq-count"></span>
          </div>
        </div>
        <div class="sfq-body" id="sfq-body"></div>
        <div class="sfq-footer">
          <span class="sfq-footer-text">Press <code>Esc</code> to close · Strontium Evaluation Only</span>
        </div>
      `;
      document.body.appendChild(panel);
    }
  
    // ============================================
    // RENDERING
    // ============================================
    function render() {
      const body = document.getElementById('sfq-body');
      const countEl = document.getElementById('sfq-count');
      const query = searchQuery.toLowerCase().trim();
  
      let html = '';
      let totalVisible = 0;
  
      FAQ_DATA.forEach((section, sIdx) => {
        let sectionHtml = '';
        let sectionVisible = 0;
  
        section.items.forEach((item, iIdx) => {
          const key = `${sIdx}-${iIdx}`;
          const qMatch = !query || item.q.toLowerCase().includes(query);
          const aMatch = !query || item.a.toLowerCase().includes(query);
          const visible = qMatch || aMatch;
          const expanded = openItemKey === key;
  
          if (visible) {
            sectionVisible++;
            totalVisible++;
  
            const qText = query ? highlightText(item.q, query) : escapeHtml(item.q);
            const aText = query ? highlightText(item.a, query) : escapeHtml(item.a);
  
            sectionHtml += `
              <div class="sfq-item${expanded ? ' sfq-expanded' : ''}" data-key="${key}">
                <button class="sfq-question-btn" data-key="${key}" aria-expanded="${expanded}">
                  <span class="sfq-chevron">${ICONS.chevron}</span>
                  <span>${qText}</span>
                </button>
                <div class="sfq-answer">
                  <div class="sfq-answer-text">${aText}</div>
                </div>
              </div>
            `;
          }
        });
  
        const sectionHidden = sectionVisible === 0;
        html += `<div class="sfq-section-header${sectionHidden ? ' sfq-hidden' : ''}">${escapeHtml(section.section)}</div>`;
        html += sectionHtml;
      });
  
      // No results
      html += `
        <div class="sfq-no-results${totalVisible === 0 ? ' sfq-visible' : ''}">
          ${ICONS.search}
          <p>No matching questions found.</p>
        </div>
      `;
  
      body.innerHTML = html;
  
      // Update count
      if (query) {
        countEl.textContent = `${totalVisible} found`;
      } else {
        countEl.textContent = '';
      }
  
      // Attach question click handlers
      body.querySelectorAll('.sfq-question-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const key = btn.getAttribute('data-key');
          openItemKey = openItemKey === key ? null : key;
          render();
        });
      });
    }
  
    // ============================================
    // OPEN / CLOSE
    // ============================================
    function open() {
      isOpen = true;
      document.getElementById('sfq-overlay').classList.add('sfq-visible');
      document.getElementById('sfq-panel').classList.add('sfq-visible');
      document.getElementById('sfq-trigger').classList.add('sfq-open');
      document.getElementById('sfq-trigger').querySelector('span').textContent = 'Close';
  
      // Reset state
      searchQuery = '';
      openItemKey = null;
      const input = document.getElementById('sfq-search');
      input.value = '';
      render();
      setTimeout(() => input.focus(), 250);
    }
  
    function close() {
      isOpen = false;
      document.getElementById('sfq-overlay').classList.remove('sfq-visible');
      document.getElementById('sfq-panel').classList.remove('sfq-visible');
      document.getElementById('sfq-trigger').classList.remove('sfq-open');
      document.getElementById('sfq-trigger').querySelector('span').textContent = 'Project FAQ';
    }
  
    function toggle() {
      isOpen ? close() : open();
    }
  
    // ============================================
    // SHINE EFFECT
    // ============================================
    function startShine() {
      const btn = document.getElementById('sfq-trigger');
      if (!btn) return;
      btn.addEventListener('animationend', (e) => {
        if (e.animationName === 'sfqShine') btn.classList.remove('sfq-shining');
      });
      shineInterval = setInterval(() => {
        if (!isOpen) btn.classList.add('sfq-shining');
      }, CONFIG.shineInterval);
    }
  
    // ============================================
    // INIT
    // ============================================
    function init() {
      injectStyles();
      buildDOM();
      startShine();
  
      // Event listeners
      document.getElementById('sfq-trigger').addEventListener('click', toggle);
      document.getElementById('sfq-close').addEventListener('click', close);
      document.getElementById('sfq-overlay').addEventListener('click', close);
  
      const debouncedSearch = debounce((val) => {
        searchQuery = val;
        openItemKey = null;
        render();
      }, CONFIG.searchDebounceMs);
  
      document.getElementById('sfq-search').addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
      });
  
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen) close();
      });
  
      // Prevent panel click from closing
      document.getElementById('sfq-panel').addEventListener('click', (e) => e.stopPropagation());
  
      // Initial render (hidden)
      render();
  
      console.log('Strontium FAQ Widget: loaded', FAQ_DATA.reduce((s, sec) => s + sec.items.length, 0), 'questions');
    }
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  
  })();