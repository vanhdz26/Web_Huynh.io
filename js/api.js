// MockAPI endpoints
const WORKOUT_API_URL = "https://6a114b823e35d0f37ee32270.mockapi.io/api/v1/workouts";
const USER_API_URL = "https://6a114b823e35d0f37ee32270.mockapi.io/api/v1/users";

// Giữ biến cũ để các file trước không bị lỗi
const API_BASE_URL = WORKOUT_API_URL;

function handleResponse(response) {
  if (!response.ok) {
    throw new Error("API request failed");
  }
  return response.json();
}

function getWorkouts() {
  return fetch(WORKOUT_API_URL)
    .then(handleResponse)
    .catch(function (error) {
      console.error("Lỗi khi lấy danh sách workouts:", error);
      throw error;
    });
}

function getWorkoutById(id) {
  return fetch(`${WORKOUT_API_URL}/${id}`)
    .then(handleResponse)
    .catch(function (error) {
      console.error("Lỗi khi lấy chi tiết workout:", error);
      throw error;
    });
}

function createWorkout(data) {
  return fetch(WORKOUT_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then(handleResponse)
    .catch(function (error) {
      console.error("Lỗi khi thêm workout:", error);
      throw error;
    });
}

function updateWorkout(id, data) {
  return fetch(`${WORKOUT_API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then(handleResponse)
    .catch(function (error) {
      console.error("Lỗi khi cập nhật workout:", error);
      throw error;
    });
}

function deleteWorkout(id) {
  return fetch(`${WORKOUT_API_URL}/${id}`, {
    method: "DELETE",
  })
    .then(handleResponse)
    .catch(function (error) {
      console.error("Lỗi khi xóa workout:", error);
      throw error;
    });
}

function getUsers() {
  return fetch(USER_API_URL)
    .then(handleResponse)
    .catch(function (error) {
      console.error("Lỗi khi lấy danh sách users:", error);
      throw error;
    });
}

function getUserById(id) {
  return fetch(`${USER_API_URL}/${id}`)
    .then(handleResponse)
    .catch(function (error) {
      console.error("Lỗi khi lấy chi tiết user:", error);
      throw error;
    });
}

function createUser(data) {
  return fetch(USER_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then(handleResponse)
    .catch(function (error) {
      console.error("Lỗi khi tạo user:", error);
      throw error;
    });
}

function updateUser(id, data) {
  return fetch(`${USER_API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then(handleResponse)
    .catch(function (error) {
      console.error("Lỗi khi cập nhật user:", error);
      throw error;
    });
}

// Dùng jQuery AJAX để đáp ứng yêu cầu kỹ thuật có $.ajax().
function getUsersByAjax() {
  return $.ajax({
    url: USER_API_URL,
    method: "GET",
    dataType: "json",
  });
}
