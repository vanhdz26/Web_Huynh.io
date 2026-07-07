let allWorkouts = [];
let detailModal = null;

$(document).ready(function () {
  const currentUser = requireLogin();
  if (!currentUser) return;
  renderAuthNavbar("home");
  showFlashMessage();
  detailModal = new bootstrap.Modal(document.getElementById("detailModal"));
  loadPublicWorkouts();
  $("#searchInput, #typeFilter, #intensityFilter").on("input change", applyFilters);
  renderHomeArticlesPreview();
});

function loadPublicWorkouts() {
  showLoading("#loading");
  $("#diaryList").html("");
  $("#emptyState").addClass("d-none");
  getWorkouts()
    .then(function (data) {
      const currentUser = getCurrentUser();
      const raw = Array.isArray(data) ? data : [];
      allWorkouts = raw.filter(w => String(w.userId || "") === String(currentUser.id));
      allWorkouts.sort((a,b) => new Date(b.date) - new Date(a.date));
      window.allWorkouts = allWorkouts;
      renderHealthDashboard(allWorkouts, currentUser);
      renderDiary(allWorkouts);
      renderProgressBars(allWorkouts);
    })
    .catch(function () {
      $("#diaryList").html(`<div class="alert alert-danger border-0 rounded-4 shadow-sm">Không thể tải dữ liệu. Hãy kiểm tra MockAPI URL trong js/api.js.</div>`);
    })
    .finally(function () { hideLoading("#loading"); });
}

function applyFilters() {
  const keyword = $("#searchInput").val().toLowerCase().trim();
  const type = $("#typeFilter").val();
  const intensity = $("#intensityFilter").val();
  const filtered = allWorkouts.filter(function (w) {
    const text = `${w.name || ""} ${w.muscleGroup || ""} ${w.note || ""}`.toLowerCase();
    return text.includes(keyword) && (type === "all" || w.type === type) && (intensity === "all" || w.intensity === intensity);
  });
  renderDiary(filtered);
  renderProgressBars(filtered);
}

function renderHealthDashboard(workouts, user) {
  const weekly = calculateWeeklyStats(workouts, user);
  const streak = calculateStreak(workouts);
  const bmi = calculateBMI(user.height, getLatestWeight(workouts, user));
  const avgSleep = average(workouts.map(w => w.sleepHours));
  const avgWater = average(workouts.map(w => w.waterLiters));
  const latestWeight = getLatestWeight(workouts, user);

  $("#helloUser").text(`Xin chào, ${user.fullName || "bạn"}`);
  $("#userGoalText").text(user.goal || "Duy trì sức khỏe");
  $("#suggestionText").text(getAdvancedWorkoutSuggestion(workouts, user));
  $("#weeklyWorkouts").text(`${weekly.totalWorkouts}/${weekly.goal}`);
  $("#weeklyCalories").text(formatNumber(weekly.totalCalories));
  $("#weeklyDuration").text(formatNumber(weekly.totalDuration));
  $("#streakDays").text(streak);
  $("#weeklyProgressText").text(`${weekly.percent}% hoàn thành mục tiêu tuần`);
  $("#weeklyProgressBar").css("width", `${weekly.percent}%`).text(`${weekly.percent}%`);
  $("#bmiValue").text(bmi ? bmi.value : "--");
  $("#bmiLabel").text(bmi ? bmi.label : "Chưa đủ dữ liệu");
  $("#latestWeight").text(latestWeight ? `${latestWeight} kg` : "--");
  $("#avgSleep").text(avgSleep ? `${avgSleep.toFixed(1)} giờ` : "--");
  $("#avgWater").text(avgWater ? `${avgWater.toFixed(1)} L` : "--");
  $("#resultCount").text(`${workouts.length} buổi`);
  const timeStats = calculateWorkoutTimeStats(workouts);
  $("#todayWorkouts").text(timeStats.todayCount);
  $("#todayCalories").text(formatNumber(timeStats.todayCalories));
  $("#todayDuration").text(formatNumber(timeStats.todayDuration));
  $("#monthWorkouts").text(timeStats.monthCount);
}

function getLatestWeight(workouts, user) {
  const sorted = [...workouts].filter(w => Number(w.weightToday) > 0).sort((a,b)=>new Date(b.date)-new Date(a.date));
  return sorted.length ? Number(sorted[0].weightToday) : Number(user.weight || 0);
}

function renderDiary(workouts) {
  const list = $("#diaryList");
  list.html("");
  $("#resultCount").text(`${workouts.length} buổi`);
  if (!workouts.length) {
    $("#emptyState").removeClass("d-none").hide().fadeIn(220);
    return;
  }
  $("#emptyState").addClass("d-none");
  const groups = groupWorkoutsByDate(workouts);
  Object.keys(groups).sort((a,b)=>new Date(b)-new Date(a)).forEach(function(dateKey){
    const dayItems = groups[dateKey];
    const totalCalo = dayItems.reduce((s,w)=>s+Number(w.calories||0),0);
    const totalDuration = dayItems.reduce((s,w)=>s+Number(w.duration||0),0);
    let html = `
      <div class="diary-day card border-0 shadow-sm mb-4">
        <div class="card-header bg-white border-0 p-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div><h3 class="h5 fw-bold mb-1">${formatDate(dateKey)}</h3><small class="text-muted">${dayItems.length} buổi • ${totalDuration} phút • ${totalCalo} kcal</small></div>
          <span class="badge bg-success-subtle text-success-emphasis">Nhật ký ngày</span>
        </div>
        <div class="card-body p-4 pt-0">`;
    dayItems.forEach(function(w){
      html += `
        <div class="diary-item" onclick="openDetailModal('${w.id}')">
          <div class="diary-icon">${getTypeIcon(w.type)}</div>
          <div class="flex-grow-1">
            <div class="d-flex justify-content-between gap-2 flex-wrap">
              <h4 class="h6 fw-bold mb-1">${w.name || "Buổi tập"}</h4>
              <small class="text-muted">${w.duration || 0} phút • ${w.calories || 0} kcal</small>
            </div>
            <div class="d-flex flex-wrap gap-2 mt-1">
              <span class="badge type-badge ${getTypeBadgeClass(w.type)}">${w.type || "Khác"}</span>
              <span class="badge ${getIntensityClass(w.intensity)}">${w.intensity || "Chưa rõ"}</span>
              <span class="badge text-bg-light">${w.muscleGroup || "Chưa cập nhật"}</span>
              ${w.mood ? `<span class="badge text-bg-light">Tâm trạng: ${w.mood}</span>` : ""}
            </div>
            ${w.note ? `<p class="text-muted small mt-2 mb-0">${w.note}</p>` : ""}
          </div>
        </div>`;
    });
    html += `</div></div>`;
    list.append(html);
  });
}

function renderProgressBars(workouts) {
  const caloChart = $("#calorieChart");
  const durationChart = $("#durationChart");
  caloChart.html(""); durationChart.html("");
  const daily = getDailyWorkoutSummary(workouts, 7);
  const maxCalo = Math.max(...daily.map(d=>Number(d.calories||0)), 1);
  const maxDuration = Math.max(...daily.map(d=>Number(d.duration||0)), 1);
  daily.forEach(function(day){
    const label = formatDate(day.date);
    caloChart.append(createChartRow(label, day.calories, "kcal", (Number(day.calories||0)/maxCalo)*100));
    durationChart.append(createChartRow(label, day.duration, "phút", (Number(day.duration||0)/maxDuration)*100));
  });
  setTimeout(function(){ $(".chart-bar").each(function(){ $(this).css("width", $(this).data("width")); }); }, 100);
}

function createChartRow(label, value, unit, percent) {
  return `<div class="chart-row"><div class="chart-label">${label}</div><div class="chart-track"><div class="chart-bar" data-width="${percent}%"></div></div><div class="chart-value">${value} ${unit}</div></div>`;
}

function openDetailModal(id) {
  const w = allWorkouts.find(item => String(item.id) === String(id));
  if (!w) return;
  $("#detailTitle").text(w.name || "Chi tiết buổi tập");
  $("#detailBody").html(`
    <div class="d-flex align-items-center gap-3 mb-3">
      <div class="stat-icon">${getTypeIcon(w.type)}</div>
      <div><span class="badge type-badge ${getTypeBadgeClass(w.type)}">${w.type || "Khác"}</span><div class="text-muted small mt-1">${formatDate(w.date)}</div></div>
    </div>
    <div class="row g-3">
      <div class="col-6"><div class="metric-box"><small>Nhóm cơ</small><strong>${w.muscleGroup || "--"}</strong></div></div>
      <div class="col-6"><div class="metric-box"><small>Cường độ</small><strong>${w.intensity || "--"}</strong></div></div>
      <div class="col-6"><div class="metric-box"><small>Thời lượng</small><strong>${w.duration || 0} phút</strong></div></div>
      <div class="col-6"><div class="metric-box"><small>Calo</small><strong>${w.calories || 0} kcal</strong></div></div>
      <div class="col-6"><div class="metric-box"><small>Ngủ</small><strong>${w.sleepHours || "--"} giờ</strong></div></div>
      <div class="col-6"><div class="metric-box"><small>Nước uống</small><strong>${w.waterLiters || "--"} L</strong></div></div>
      <div class="col-6"><div class="metric-box"><small>Cân nặng</small><strong>${w.weightToday || "--"} kg</strong></div></div>
      <div class="col-6"><div class="metric-box"><small>Tâm trạng</small><strong>${w.mood || "--"}</strong></div></div>
      <div class="col-12"><p class="mb-0"><strong>Ghi chú:</strong> ${w.note || "Không có ghi chú"}</p></div>
    </div>`);
  detailModal.show();
}


// ===== Phase 8: Articles preview =====
function renderHomeArticlesPreview() {
  const box = $("#homeArticles");
  if (!box.length) return;
  const articles = getFitTrackArticles().slice(0, 3);
  box.html(articles.map(a => `
    <div class="col-md-4">
      <a class="article-card card h-100 text-decoration-none text-dark" href="articles.html#article-${a.id}">
        <div class="card-body p-4">
          <span class="badge bg-success-subtle text-success-emphasis mb-3">${a.category}</span>
          <h3 class="h5 fw-bold">${a.title}</h3>
          <p class="text-muted small mb-0">${a.summary}</p>
        </div>
      </a>
    </div>`).join(""));
}
