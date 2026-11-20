(() => {
  const toggle = document.getElementById("projectChatToggle");
  const panel = document.getElementById("projectChatPanel");
  const close = document.getElementById("projectChatClose");
  const form = document.getElementById("projectChatForm");
  const input = document.getElementById("projectChatInput");
  const messages = document.getElementById("projectChatMessages");
  const send = document.getElementById("projectChatSend");
  const userId = sessionStorage.getItem("docubatch_dify_user") || `docubatch-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  sessionStorage.setItem("docubatch_dify_user", userId);
  let conversationId = "";

  const noticeToggle = document.getElementById("landNoticesToggle");
  const noticePanel = document.getElementById("landNoticesPanel");
  const noticeClose = document.getElementById("landNoticesClose");
  const noticeList = document.getElementById("landNoticesList");
  const noticeCount = document.getElementById("landNoticesCount");
  let lastNoticeSignature = "";

  function setOpen(open) {
    panel.classList.toggle("hidden", !open);
    toggle.setAttribute("aria-expanded", String(open));
    if (open) input.focus();
  }

  function addMessage(role, content, extraClass = "") {
    const node = document.createElement("div");
    node.className = `project-chat-message ${role} ${extraClass}`.trim();
    node.textContent = content;
    messages.appendChild(node);
    messages.scrollTop = messages.scrollHeight;
    return node;
  }

  function setNoticesOpen(open) {
    noticePanel.classList.toggle("hidden", !open);
    noticeToggle.setAttribute("aria-expanded", String(open));
    if (open) loadNotices();
  }

  function renderNotices(data) {
    const notices = Array.isArray(data.notices) ? data.notices : [];
    noticeList.replaceChildren();
    if (!notices.length) {
      const empty = document.createElement("p");
      empty.className = "land-notices-empty";
      empty.textContent = "Chưa có thông báo. Danh sách sẽ hiển thị nội dung do quản trị viên cập nhật.";
      noticeList.appendChild(empty);
    }

    for (const notice of notices) {
      const card = document.createElement("article");
      card.className = "land-notice";
      const heading = document.createElement("strong");
      heading.textContent = notice.title;
      const meta = document.createElement("small");
      meta.textContent = [notice.region, notice.date].filter(Boolean).join(" · ");
      const content = document.createElement("p");
      content.textContent = notice.content;
      card.append(heading, meta, content);
      if (notice.url) {
        const link = document.createElement("a");
        link.href = notice.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Xem nguồn";
        card.appendChild(link);
      }
      noticeList.appendChild(card);
    }

    const signature = JSON.stringify(notices);
    if (lastNoticeSignature && signature !== lastNoticeSignature && notices.length) {
      const newest = notices[0];
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Thông báo đất đai mới", { body: newest.title });
      }
    }
    lastNoticeSignature = signature;
    noticeCount.textContent = String(notices.length);
    noticeCount.classList.toggle("hidden", notices.length === 0);
  }

  async function loadNotices() {
    try {
      const response = await fetch("/api/land-notices", { cache: "no-store" });
      if (!response.ok) throw new Error("Không tải được thông báo.");
      renderNotices(await response.json());
    } catch (error) {
      noticeList.replaceChildren();
      const message = document.createElement("p");
      message.className = "land-notices-empty error";
      message.textContent = error.message || "Có lỗi khi tải thông báo.";
      noticeList.appendChild(message);
    }
  }

  toggle.addEventListener("click", () => setOpen(panel.classList.contains("hidden")));
  close.addEventListener("click", () => setOpen(false));
  noticeToggle.addEventListener("click", () => setNoticesOpen(noticePanel.classList.contains("hidden")));
  noticeClose.addEventListener("click", () => setNoticesOpen(false));

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message || send.disabled) return;
    addMessage("user", message);
    input.value = "";
    send.disabled = true;
    const pending = addMessage("assistant", "Đang suy nghĩ…");
    try {
      const response = await fetch("/api/project-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, user_id: userId, conversation_id: conversationId })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "Không gửi được câu hỏi.");
      pending.textContent = result.answer;
      conversationId = result.conversation_id || conversationId;
    } catch (error) {
      pending.textContent = error.message || "Có lỗi khi kết nối trợ lý.";
      pending.classList.add("error");
    } finally {
      send.disabled = false;
      input.focus();
      messages.scrollTop = messages.scrollHeight;
    }
  });

  loadNotices();
  window.setInterval(loadNotices, 5 * 60 * 1000);
  if ("Notification" in window && Notification.permission === "default") {
    noticeToggle.addEventListener("click", () => Notification.requestPermission(), { once: true });
  }
})();
