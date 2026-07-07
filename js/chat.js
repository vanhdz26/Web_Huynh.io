const CHAT_KEY_PREFIX = "fittrack_chat_";

$(document).ready(function () {
  if (!document.getElementById("fitChatWidget")) return;
  initFitChat();
});

function getChatKey() {
  const user = getCurrentUser && getCurrentUser();
  return CHAT_KEY_PREFIX + (user ? user.id : "guest");
}

function getAllChatMessagesForAdmin() {
  const result = [];
  Object.keys(localStorage).forEach(function(key){
    if (key.startsWith(CHAT_KEY_PREFIX)) {
      try {
        const userId = key.replace(CHAT_KEY_PREFIX, "");
        const messages = JSON.parse(localStorage.getItem(key)) || [];
        messages.forEach(m => result.push({ ...m, userId }));
      } catch(e) {}
    }
  });
  return result.sort((a,b)=>new Date(b.time)-new Date(a.time));
}

function loadChatMessages() {
  try { return JSON.parse(localStorage.getItem(getChatKey())) || []; }
  catch(e) { return []; }
}

function saveChatMessages(messages) {
  localStorage.setItem(getChatKey(), JSON.stringify(messages));
}

function initFitChat() {
  renderChatMessages();
  $("#chatToggle").on("click", function(){ $("#chatBox").toggleClass("d-none").hide().fadeIn(180); });
  $("#chatClose").on("click", function(){ $("#chatBox").addClass("d-none"); });
  $("#chatForm").on("submit", function(e){ e.preventDefault(); sendUserChat($("#chatInput").val()); });
  $(".quick-chat").on("click", function(){ sendUserChat($(this).data("message")); });
  $("#clearChatBtn").on("click", function(){ localStorage.removeItem(getChatKey()); renderChatMessages(); });
}

function sendUserChat(text) {
  const message = String(text || "").trim();
  if (!message) return;
  const messages = loadChatMessages();
  messages.push({ sender: "user", message, time: new Date().toISOString() });
  messages.push({ sender: "bot", message: getBotReply(message), time: new Date().toISOString() });
  saveChatMessages(messages);
  $("#chatInput").val("");
  renderChatMessages();
}

function getBotReply(message) {
  const text = message.toLowerCase();
  if (text.includes("tập gì") || text.includes("hôm nay")) return getWorkoutSuggestion(window.allWorkouts || [], getCurrentUser());
  if (text.includes("tiến độ") || text.includes("tuần")) {
    const stats = calculateWeeklyStats(window.allWorkouts || [], getCurrentUser());
    return `Tuần này bạn đã tập ${stats.totalWorkouts}/${stats.goal} buổi, đạt ${stats.percent}% mục tiêu. Tổng ${stats.totalDuration} phút và ${stats.totalCalories} kcal.`;
  }
  if (text.includes("bmi")) return "BMI là chỉ số tham khảo từ chiều cao và cân nặng. Bạn có thể xem BMI ở trang chủ hoặc hồ sơ, không nên dùng nó để đánh giá ngoại hình.";
  if (text.includes("nước")) return "Bạn có thể ghi lượng nước uống trong mỗi buổi tập. FitTrack sẽ tính trung bình để bạn theo dõi thói quen tốt hơn.";
  if (text.includes("thói quen") || text.includes("duy trì")) return "Hãy bắt đầu nhỏ: 15-20 phút mỗi buổi, đặt mục tiêu tuần vừa sức và ghi nhật ký ngay sau khi tập.";
  return "Mình là Trợ lý FitTrack. Bạn có thể hỏi về tiến độ tuần, BMI, gợi ý bài tập, nước uống hoặc cách duy trì thói quen.";
}

function renderChatMessages() {
  const box = $("#chatMessages");
  if (!box.length) return;
  const messages = loadChatMessages();
  box.html("");
  if (!messages.length) {
    box.html(`<div class="chat-empty">Xin chào 👋 Mình có thể hỗ trợ bạn theo dõi tiến độ tập luyện.</div>`);
    return;
  }
  messages.forEach(function(m){
    box.append(`<div class="chat-message ${m.sender}"><div>${m.message}</div><small>${new Date(m.time).toLocaleTimeString("vi-VN", {hour:"2-digit", minute:"2-digit"})}</small></div>`);
  });
  box.scrollTop(box[0].scrollHeight);
}

function renderAdminChatMessages() {
  const wrap = $("#adminChatList");
  if (!wrap.length) return;
  const messages = getAllChatMessagesForAdmin();
  wrap.html("");
  if (!messages.length) {
    wrap.html(`<div class="empty-box text-center p-4"><div class="display-6 mb-2">💬</div><h5 class="fw-bold">Chưa có tin nhắn hỗ trợ</h5><p class="text-muted mb-0">Tin nhắn chat sẽ được lưu bằng localStorage trong trình duyệt.</p></div>`);
    return;
  }
  messages.forEach(function(m){
    wrap.append(`<div class="support-row"><div><strong>${m.sender === "user" ? "Người dùng" : "Trợ lý"}</strong><small class="d-block text-muted">User ID: ${m.userId} • ${formatDate(m.time)}</small><p class="mb-0 mt-1">${m.message}</p></div><span class="badge ${m.sender === "user" ? "text-bg-primary" : "text-bg-success"}">${m.sender}</span></div>`);
  });
}
