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
          id: 'faq-rubric-structure',
          section: 'Section 1 · Rubric Structure & Scope',
          items: [
            {
              q: 'The static rubric already covers audio quality, pronunciation, and naturalness. What if the prompt explicitly asks the model to do something acoustic, like "say this in a whisper" or "speak in an excited tone"? Should I skip writing a criterion for that?',
              a: 'No — you should still write a criterion for that. The static rubric evaluates baseline audio qualities that apply to every response regardless of the prompt: Is the audio clean? Are words pronounced correctly? Does the voice sound natural? When a prompt explicitly asks the model to speak in a particular way, that\'s an instruction the model needs to follow, and it falls under Instruction Execution (Audio Generation). These are different things. A response could score well on the static Naturalness criterion (it sounds human-like and fluid) while completely ignoring the user\'s request to whisper.\n\nA good test: if the response passes one criterion, does it automatically pass the other? If a response sounds natural, does that mean it also whispered? No — so they\'re not redundant, and you should include both.\n\nUse this same test any time you\'re unsure whether a criterion you\'re writing overlaps with the static rubric. If passing the static criterion guarantees passing yours (or vice versa), they\'re redundant and you should remove yours. If a response could pass one and fail the other, they\'re measuring different things and both belong.'
            },
            {
              q: 'How aggressively should I edit the editable rubric? It already has criteria when I receive it.',
              a: 'The editable rubric you receive is a complete starting rubric — not a blank slate. Your job is to refine it, not rebuild it from scratch. That said, "refine" can mean real changes: removing criteria that overlap with the static rubric, removing criteria that are incidental or unlikely to differentiate future responses, adding criteria that are missing, and making light edits to improve clarity, atomicity, or self-containedness. Don\'t change things for the sake of changing them, but don\'t treat the existing criteria as untouchable either. If something needs to be fixed, fix it.'
            },
            {
              q: 'Should I change the category annotation on an existing criterion if I think it\'s wrong?',
              a: 'Only if you\'re confident it\'s wrong — meaning you saw the criterion, saw the assigned category, and immediately recognized the mismatch. These annotations have already been reviewed, so if you\'re on the fence or it\'s a close call between two plausible categories, leave it as-is.'
            }
          ]
        },
        {
          id: 'faq-incidental-vs-generalizable',
          section: 'Section 2 · Incidental vs. Generalizable Criteria',
          items: [
            {
              q: 'Both sample responses include the same detail (e.g., both mention resting the steak). Does that make a criterion about it incidental?',
              a: 'No. Whether a criterion is incidental has nothing to do with how many of the sample responses happen to include the detail. The test is whether the detail is something future responses would also need to get right. If resting a steak is genuinely good advice that any quality response to "how do I cook a steak?" should include, then it\'s a valid criterion — even if both samples already mention it. Incidental criteria are ones that latch onto arbitrary details unlikely to recur; a widely agreed-upon best practice is not arbitrary just because the current samples both got it right.'
            },
            {
              q: 'One of the responses includes something objectively wrong. Should I write a criterion to catch that specific error?',
              a: 'Generally, no — not as a negative criterion targeting that particular mistake. Criteria should be written to describe what a good response looks like, not to flag errors that happened to appear in one particular sample. If a response to "tell me about the Great Wall of China" says it\'s located in Japan, you wouldn\'t write "the response should not say the Great Wall is in Japan" — that\'s a criterion tailored to one bad response that\'s unlikely to recur. Instead, write the positive version: "The response should identify the Great Wall of China as being located in China." That criterion catches the original error while also being useful against any future response that gets the location wrong in a different way.'
            },
            {
              q: 'Some prompts have a narrow, objectively correct answer — like a math problem or a factual lookup. Does the incidental vs. generalizable distinction still apply?',
              a: 'For prompts with clear-cut correct answers, your criteria will naturally be more specific and objective — and that\'s fine. If addressing all the explicit requirements of the prompt fully describes what a correct response looks like, then those objective criteria may be all you need. The incidental vs. generalizable distinction is most relevant for open-ended or subjective prompts where many valid responses are possible. Don\'t avoid specificity when the prompt calls for it; the point is to avoid false specificity on prompts where it isn\'t warranted.'
            }
          ]
        },
        {
          id: 'faq-writing-criteria',
          section: 'Section 3 · Writing Criteria: Atomicity, Self-Containedness & Judgment',
          items: [
            {
              q: 'The instructions say not to over-split criteria for things models rarely fail at. How do I know what models are likely to fail at?',
              a: 'Use your experience. You\'ve worked with models of varying quality and seen the kinds of mistakes they make. If you\'ve never seen a model fail to generate a table when explicitly asked for one, it\'s probably fine to combine "create a table with columns for X, Y, and Z" into a single criterion. If you\'ve seen models struggle with a particular type of request — misinterpreting conditional logic, losing track of constraints in a long prompt, making errors on math problems — that\'s a signal to break those aspects into more granular criteria. When in doubt, lean toward splitting; it\'s easier to consolidate criteria that turn out to be unnecessary than to add ones that were missing.'
            },
            {
              q: 'For multi-turn conversations, how much of the conversation history do I need to include in a criterion to make it self-contained?',
              a: 'Include whatever the autorater would need to grade the criterion accurately. The autorater cannot see the prompt, the content text, or the conversation history — your criterion is the only thing it has. That doesn\'t mean you need to paste in the entire conversation; it means you need to include the specific pieces of context that the criterion depends on. If your criterion is "the response should correctly recall the user\'s preferred name from the earlier turn," you need to state what that name is. If the criterion depends on something the user said three turns ago, paraphrase or quote the relevant part. Think about what you would need in order to evaluate the response yourself if you had no access to anything except the criterion text and the response.'
            },
            {
              q: 'If the prompt includes a long piece of content (like an article to summarize), how do I make a criterion self-contained without just copying the entire text?',
              a: 'This requires judgment, and it\'s one of the harder parts of writing good criteria. The key question is the same: what would the autorater need to see in order to grade this? If the prompt asks for a summary, don\'t paste the full article — the autorater would then have to decide for itself what the key points are, which defeats the purpose. Instead, identify the key points yourself and include them in the criterion as an answer key: "The response should summarize the article\'s key points, which include [point 1], [point 2], and [point 3]." If the prompt asks for a near-verbatim rewrite with small changes, you may need to provide the full expected text. Use your judgment about how much context is necessary for accurate grading, and err on the side of being explicit.'
            }
          ]
        },
        {
          id: 'faq-category-taxonomy',
          section: 'Section 4 · Category Taxonomy',
          items: [
            {
              q: 'A criterion seems like it could fit into two categories. How do I decide?',
              a: 'Go with whichever category feels like the best fit. Don\'t overthink it — if a criterion is clearly more about one dimension than another, choose that one. The taxonomy documentation includes some explicit exceptions to help with common borderline cases (e.g., "summarize in one line" is Instruction Following, not Conciseness), so check whether your case is addressed there. If you genuinely feel a criterion doesn\'t fit any defined category, you can select "Other" and use the explanation box to describe why you chose it. But try the defined categories first; "Other" should be a last resort.'
            }
          ]
        },
        {
          id: 'faq-llm-evaluation',
          section: 'Section 5 · LLM Evaluation Tool',
          items: [
            {
              q: 'After I rate each criterion, I generate an LLM evaluation. What should I do with its feedback?',
              a: 'The LLM evaluation tool reviews your rubric against the principles in the instructions — atomicity, self-containedness, generalizability, and so on. It may flag issues you missed or suggest improvements. That said, the tool is in beta. Treat its feedback as a second opinion, not a directive. If it raises a point that makes you rethink a criterion, revise accordingly. If you disagree with its suggestion and have a clear reason why, you can disregard it. You always have the final say.'
            }
          ]
        },
        {
          id: 'faq-scoring',
          section: 'Section 6 · Scoring',
          items: [
            {
              q: 'A criterion is conditional (e.g., "If the response mentions a cat, it should include the word \'purr\'"). What if I\'m unsure whether the condition is met — like, does "kitten" count as mentioning a cat?',
              a: 'Use your judgment. If the connection is close enough that a reasonable person would consider the condition met, treat it as met and score accordingly. If it\'s a genuine stretch, you might consider it a borderline case and score it as Minor Issues rather than No Issues or Major Issues. The No Issues / Minor Issues / Major Issues scale gives you room to reflect the degree of the issue rather than forcing a binary call.'
            },
            {
              q: 'Can I use "could" in a criterion itself, or only in elaborations?',
              a: '"Could" should only appear in elaborations — the "For example" portion of a criterion or similar follow-on language. The criterion itself should always use "should" (or "should not"). The word "should" establishes the requirement; "could" in the elaboration signals that the examples are illustrative, not exhaustive, and the response has flexibility in how it meets the requirement.'
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