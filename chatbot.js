/* ==========================================================================
   Portfolio Assistant — chatbot frontend
   Scope-limited to portfolio topics (skills, projects, about, contact).
   Talks to a backend proxy at /api/chat instead of calling the Groq API
   directly, so no API key is ever exposed in the browser.

   When the daily quota / rate limit is exceeded (HTTP 429), the widget
   shows an "Unable to respond" bubble and disables the input so the
   page stops sending further requests for the rest of the session.
   ========================================================================== */
(function () {
  "use strict";

  var CHAT_ENDPOINT = "/api/chat";
  var MAX_REPLY_CHARS = 1000;
  var MAX_HISTORY_TURNS = 5;
  var QUOTA_MESSAGE = "Unable to respond";
  var QUOTA_PLACEHOLDER = "Chat is unavailable right now.";



  var elWidget, elToggle, elPanel, elClose, elMessages, elForm, elInput, elSubmitBtn;
  var history = [];
  var chatDisabled = false;

  function openPanel() {
    elWidget.classList.add("chat-open");
    elToggle.setAttribute("aria-expanded", "true");
    elPanel.setAttribute("aria-hidden", "false");
    setTimeout(function () { if (!chatDisabled) elInput.focus(); }, 200);
  }
  function closePanel() {
    elWidget.classList.remove("chat-open");
    elToggle.setAttribute("aria-expanded", "false");
    elPanel.setAttribute("aria-hidden", "true");
  }

  function addMessage(text, sender) {
    var msg = document.createElement("div");
    msg.className = "chat-msg chat-msg-" + sender;
    var p = document.createElement("p");
    p.textContent = text;
    msg.appendChild(p);
    elMessages.appendChild(msg);
    elMessages.scrollTop = elMessages.scrollHeight;
    return msg;
  }

  function addTypingIndicator() {
    var msg = document.createElement("div");
    msg.className = "chat-msg chat-msg-bot chat-msg-typing";
    msg.innerHTML = '<span class="chat-dot"></span><span class="chat-dot"></span><span class="chat-dot"></span>';
    elMessages.appendChild(msg);
    elMessages.scrollTop = elMessages.scrollHeight;
    return msg;
  }

  function truncateReply(text) {
    /* if (text.length <= MAX_REPLY_CHARS) return text;
    var cut = text.slice(0, MAX_REPLY_CHARS);
    var lastSpace = cut.lastIndexOf(" ");
    if (lastSpace > 0) cut = cut.slice(0, lastSpace);
    return cut.trim() + "…"; */
    return text;
  }

  // Builds the recent conversation history to send alongside the new
  // message. The backend is responsible for applying the system prompt.
  function buildHistory() {
    var recent = history.slice(-MAX_HISTORY_TURNS * 2);
    return recent.map(function (turn) {
      return { role: turn.role, content: turn.text };
    });
  }

  function buildRequestBody(userText) {
    return {
      message: userText,
      history: buildHistory()
    };
  }

  // Disables the input + submit button so the widget stops firing
  // requests (e.g. after the daily quota has been exhausted).
  function disableChatInput(placeholder) {
    chatDisabled = true;
    elInput.disabled = true;
    elInput.value = "";
    if (placeholder) elInput.placeholder = placeholder;
    if (elSubmitBtn) elSubmitBtn.disabled = true;
  }

  function askAssistant(userText) {
    var body = buildRequestBody(userText);

    return fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }).then(function (res) {
      if (!res.ok) {
        return res.json().catch(function () { return {}; }).then(function (errData) {
          var apiError = errData && errData.error;
          var msg = (apiError && apiError.message) || ("Request failed (" + res.status + ")");
          var err = new Error(msg);
          err.status = res.status;
          // The backend reports rate-limit/quota exhaustion as HTTP 429.
          err.isQuotaExceeded = res.status === 429;
          throw err;
        });
      }
      return res.json();
    }).then(function (data) {
      var text = ((data && data.reply) || "").trim();
      if (!text) {
        throw new Error("No response from the assistant. Try rephrasing your question.");
      }
      return truncateReply(text);
    });
  }

  function handleSend(e) {
    e.preventDefault();
    if (chatDisabled) return;

    var text = elInput.value.trim();
    if (!text) return;

    addMessage(text, "user");
    history.push({ role: "user", text: text });
    elInput.value = "";
    elInput.disabled = true;
    if (elSubmitBtn) elSubmitBtn.disabled = true;

    var typingEl = addTypingIndicator();

    askAssistant(text).then(function (reply) {
      typingEl.remove();
      addMessage(reply, "bot");
      history.push({ role: "assistant", text: reply });
      elInput.disabled = false;
      if (elSubmitBtn) elSubmitBtn.disabled = false;
      elInput.focus();
    }).catch(function (err) {
      typingEl.remove();
      if (err && err.isQuotaExceeded) {
        addMessage(QUOTA_MESSAGE, "bot");
        disableChatInput(QUOTA_PLACEHOLDER);
      } else {
        addMessage("Sorry, something went wrong: " + err.message, "bot");
        elInput.disabled = false;
        if (elSubmitBtn) elSubmitBtn.disabled = false;
        elInput.focus();
      }
    });
  }

  function init() {
    elWidget = document.getElementById("chatWidget");
    if (!elWidget) return;
    elToggle = document.getElementById("chatToggle");
    elPanel = document.getElementById("chatPanel");
    elClose = document.getElementById("chatClose");
    elMessages = document.getElementById("chatMessages");
    elForm = document.getElementById("chatForm");
    elInput = document.getElementById("chatInput");
    elSubmitBtn = elForm ? elForm.querySelector('button[type="submit"]') : null;

    elToggle.addEventListener("click", function () {
      var isOpen = elWidget.classList.contains("chat-open");
      if (isOpen) { closePanel(); } else { openPanel(); }
    });
    elClose.addEventListener("click", closePanel);
    elForm.addEventListener("submit", handleSend);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && elWidget.classList.contains("chat-open")) closePanel();
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
