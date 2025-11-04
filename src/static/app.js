document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const activitiesList = document.getElementById("activities-list");
  const messageDiv = document.getElementById("message");
  const registrationModal = document.getElementById("registration-modal");
  const modalActivityName = document.getElementById("modal-activity-name");
  const signupForm = document.getElementById("signup-form");
  const activityInput = document.getElementById("activity");
  const closeRegistrationModal = document.querySelector(".close-modal");

  // Search and filter elements
  const searchInput = document.getElementById("activity-search");
  const searchButton = document.getElementById("search-button");
  const categoryFilters = document.querySelectorAll(".category-filter");
  const dayFilters = document.querySelectorAll(".day-filter");
  const timeFilters = document.querySelectorAll(".time-filter");

  // Authentication elements
  const loginButton = document.getElementById("login-button");
  const userInfo = document.getElementById("user-info");
  const displayName = document.getElementById("display-name");
  const logoutButton = document.getElementById("logout-button");
  const loginModal = document.getElementById("login-modal");
  const loginForm = document.getElementById("login-form");
  const closeLoginModal = document.querySelector(".close-login-modal");
  const loginMessage = document.getElementById("login-message");

  // Announcement elements
  const announcementBanner = document.getElementById("announcement-banner");
  const announcementTitle = document.getElementById("announcement-title");
  const announcementMessage = document.getElementById("announcement-message");
  const dismissAnnouncementBtn = document.getElementById("dismiss-announcement");
  const manageAnnouncementsBtn = document.getElementById("manage-announcements-button");
  const announcementModal = document.getElementById("announcement-modal");
  const closeAnnouncementModal = document.querySelector(".close-announcement-modal");
  const announcementsList = document.getElementById("announcements-list");
  const announcementFormSection = document.getElementById("announcement-form-section");
  const announcementForm = document.getElementById("announcement-form");
  const announcementIdInput = document.getElementById("announcement-id");
  const formTitle = document.getElementById("form-title");
  const addAnnouncementBtn = document.getElementById("add-announcement-btn");
  const cancelAnnouncementBtn = document.getElementById("cancel-announcement-btn");
  const announcementModalMessage = document.getElementById("announcement-message");

  // Activity categories with corresponding colors
  const activityTypes = {
    sports: { label: "Sports", color: "#e8f5e9", textColor: "#2e7d32" },
    arts: { label: "Arts", color: "#f3e5f5", textColor: "#7b1fa2" },
    academic: { label: "Academic", color: "#e3f2fd", textColor: "#1565c0" },
    community: { label: "Community", color: "#fff3e0", textColor: "#e65100" },
    technology: { label: "Technology", color: "#e8eaf6", textColor: "#3949ab" },
  };

  // State for activities and filters
  let allActivities = {};
  let currentFilter = "all";
  let searchQuery = "";
  let currentDay = "";
  let currentTimeRange = "";

  // Authentication state
  let currentUser = null;

  // Time range mappings for the dropdown
  const timeRanges = {
    morning: { start: "06:00", end: "08:00" }, // Before school hours
    afternoon: { start: "15:00", end: "18:00" }, // After school hours
    weekend: { days: ["Saturday", "Sunday"] }, // Weekend days
  };

  // Initialize filters from active elements
  function initializeFilters() {
    // Initialize day filter
    const activeDayFilter = document.querySelector(".day-filter.active");
    if (activeDayFilter) {
      currentDay = activeDayFilter.dataset.day;
    }

    // Initialize time filter
    const activeTimeFilter = document.querySelector(".time-filter.active");
    if (activeTimeFilter) {
      currentTimeRange = activeTimeFilter.dataset.time;
    }
  }

  // Function to set day filter
  function setDayFilter(day) {
    currentDay = day;

    // Update active class
    dayFilters.forEach((btn) => {
      if (btn.dataset.day === day) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    fetchActivities();
  }

  // Function to set time range filter
  function setTimeRangeFilter(timeRange) {
    currentTimeRange = timeRange;

    // Update active class
    timeFilters.forEach((btn) => {
      if (btn.dataset.time === timeRange) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    fetchActivities();
  }

  // Check if user is already logged in (from localStorage)
  function checkAuthentication() {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
        // Verify the stored user with the server
        validateUserSession(currentUser.username);
      } catch (error) {
        console.error("Error parsing saved user", error);
        logout(); // Clear invalid data
      }
    }

    // Set authentication class on body
    updateAuthBodyClass();
  }

  // Validate user session with the server
  async function validateUserSession(username) {
    try {
      const response = await fetch(
        `/auth/check-session?username=${encodeURIComponent(username)}`
      );

      if (!response.ok) {
        // Session invalid, log out
        logout();
        return;
      }

      // Session is valid, update user data
      const userData = await response.json();
      currentUser = userData;
      localStorage.setItem("currentUser", JSON.stringify(userData));
      updateAuthUI();
    } catch (error) {
      console.error("Error validating session:", error);
    }
  }


  // Announcement functions
  async function fetchAnnouncements() {
    try {
      const response = await fetch("/announcements");
      const announcements = await response.json();
      return announcements;
    } catch (error) {
      console.error("Error fetching announcements:", error);
      return [];
    }
  }

  async function fetchAllAnnouncements() {
    try {
      const response = await fetch("/announcements/all", {
        headers: {
          "Authorization": `Bearer ${btoa(`${currentUser.username}:${getPasswordFromStorage()}`)}`
        }
      });
      const announcements = await response.json();
      return announcements;
    } catch (error) {
      console.error("Error fetching all announcements:", error);
      return [];
    }
  }

  function getPasswordFromStorage() {
    // This is a simplified approach - in a real app, you'd store tokens securely
    // For this demo, we'll assume the password is stored temporarily
    return sessionStorage.getItem("userPassword") || "";
  }

  function displayAnnouncementBanner(announcements) {
    if (announcements.length === 0) {
      announcementBanner.classList.add("hidden");
      return;
    }

    // Display the most recent announcement
    const latestAnnouncement = announcements[0];
    announcementTitle.textContent = latestAnnouncement.title;
    announcementMessage.textContent = latestAnnouncement.message;

    // Check if user has dismissed this announcement
    const dismissedAnnouncements = JSON.parse(localStorage.getItem("dismissedAnnouncements") || "[]");
    if (!dismissedAnnouncements.includes(latestAnnouncement._id)) {
      announcementBanner.classList.remove("hidden");
    }
  }

  function dismissAnnouncement() {
    announcementBanner.classList.add("hidden");

    // Get current announcement ID
    const announcements = JSON.parse(sessionStorage.getItem("currentAnnouncements") || "[]");
    if (announcements.length > 0) {
      let dismissedAnnouncements = JSON.parse(localStorage.getItem("dismissedAnnouncements") || "[]");
      dismissedAnnouncements.push(announcements[0]._id);

      // Cleanup: Remove IDs of expired announcements
      const now = new Date();
      // Get all current announcements and their expiration dates
      const validIds = announcements
        .filter(a => new Date(a.expiration_date) > now)
        .map(a => a._id);

      // Only keep dismissed IDs that are still valid (not expired)
      dismissedAnnouncements = dismissedAnnouncements.filter(id => validIds.includes(id));

      localStorage.setItem("dismissedAnnouncements", JSON.stringify(dismissedAnnouncements));
    }
  }

  function openAnnouncementModal() {
    announcementModal.classList.remove("hidden");
    announcementModal.classList.add("show");
    loadAnnouncementsList();
  }

  function closeAnnouncementModalHandler() {
    announcementModal.classList.remove("show");
    setTimeout(() => {
      announcementModal.classList.add("hidden");
      announcementFormSection.classList.add("hidden");
      announcementForm.reset();
    }, 300);
  }

  async function loadAnnouncementsList() {
    announcementsList.innerHTML = '<div class="loading-announcements">Loading announcements...</div>';

    try {
      const announcements = await fetchAllAnnouncements();
      sessionStorage.setItem("allAnnouncements", JSON.stringify(announcements));
      displayAnnouncementsList(announcements);
    } catch (error) {
      announcementsList.innerHTML = `<div class="no-announcements">Error loading announcements: ${error.message || error}</div>`;
      console.error("Error loading announcements:", error);
    }
  }

  function displayAnnouncementsList(announcements) {
    if (announcements.length === 0) {
      announcementsList.innerHTML = '<div class="no-announcements">No announcements found</div>';
      return;
    }

    announcementsList.innerHTML = announcements.map(announcement => `
      <div class="announcement-item">
        <div class="announcement-item-content">
          <h4>${escapeHtml(announcement.title)}</h4>
          <p>${escapeHtml(announcement.message)}</p>
          <div class="announcement-meta">
            Created by: ${announcement.created_by} |
            Expires: ${formatDate(announcement.expiration_date)}
            ${announcement.start_date ? ` | Starts: ${formatDate(announcement.start_date)}` : ''}
          </div>
        </div>
        <div class="announcement-actions">
          <button class="edit-btn" data-id="${announcement._id}">Edit</button>
          <button class="delete-btn" data-id="${announcement._id}">Delete</button>
        </div>
      </div>
    `).join('');

    // Add event listeners for edit and delete buttons
    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", (e) => editAnnouncement(e.target.dataset.id));
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", (e) => deleteAnnouncement(e.target.dataset.id));
    });
  }

  function formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } catch (error) {
      return dateString;
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showAddAnnouncementForm() {
    formTitle.textContent = "Add New Announcement";
    announcementIdInput.value = "";
    announcementForm.reset();
    announcementFormSection.classList.remove("hidden");
    document.getElementById("announcement-form-title").focus();
  }

  function editAnnouncement(id) {
    const announcements = JSON.parse(sessionStorage.getItem("currentAnnouncements") || "[]");
    const announcement = announcements.find(a => a._id === id);

    if (announcement) {
      formTitle.textContent = "Edit Announcement";
      announcementIdInput.value = announcement._id;
      document.getElementById("announcement-form-title").value = announcement.title;
      document.getElementById("announcement-form-message").value = announcement.message;

      if (announcement.start_date) {
        const startDate = new Date(announcement.start_date);
        document.getElementById("announcement-start-date").value = startDate.toISOString().slice(0, 16);
      }

      const expirationDate = new Date(announcement.expiration_date);
      document.getElementById("announcement-expiration-date").value = expirationDate.toISOString().slice(0, 16);

      announcementFormSection.classList.remove("hidden");
      document.getElementById("announcement-form-title").focus();
    }
  }

  async function saveAnnouncement(event) {
    event.preventDefault();

    const id = announcementIdInput.value;
    const title = document.getElementById("announcement-form-title").value.trim();
    const message = document.getElementById("announcement-form-message").value.trim();
    const startDate = document.getElementById("announcement-start-date").value;
    const expirationDate = document.getElementById("announcement-expiration-date").value;

    if (!title || !message || !expirationDate) {
      showAnnouncementMessage("Please fill in all required fields", "error");
      return;
    }

    const announcementData = {
      title,
      message,
      start_date: startDate || null,
      expiration_date: expirationDate
    };

    try {
      const url = id ? `/announcements/${id}` : "/announcements";
      const method = id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${btoa(`${currentUser.username}:${getPasswordFromStorage()}`)}`
        },
        body: JSON.stringify(announcementData)
      });

      const result = await response.json();

      if (response.ok) {
        showAnnouncementMessage(`Announcement ${id ? 'updated' : 'created'} successfully`, "success");
        announcementFormSection.classList.add("hidden");
        announcementForm.reset();
        loadAnnouncementsList();
        // Refresh the banner as well
        loadAndDisplayAnnouncements();
      } else {
        showAnnouncementMessage(result.detail || "Error saving announcement", "error");
      }
    } catch (error) {
      showAnnouncementMessage("Error saving announcement", "error");
      console.error("Error saving announcement:", error);
    }
  }

  async function deleteAnnouncement(id) {
    if (!confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    try {
      const response = await fetch(`/announcements/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${btoa(`${currentUser.username}:${getPasswordFromStorage()}`)}`
        }
      });

      if (response.ok) {
        showAnnouncementMessage("Announcement deleted successfully", "success");
        loadAnnouncementsList();
        loadAndDisplayAnnouncements();
      } else {
        const result = await response.json();
        showAnnouncementMessage(result.detail || "Error deleting announcement", "error");
      }
    } catch (error) {
      showAnnouncementMessage("Error deleting announcement", "error");
      console.error("Error deleting announcement:", error);
    }
  }

  function showAnnouncementMessage(text, type) {
    announcementModalMessage.textContent = text;
    announcementModalMessage.className = `message ${type}`;
    announcementModalMessage.classList.remove("hidden");

    setTimeout(() => {
      announcementModalMessage.classList.add("hidden");
    }, 5000);
  }

  async function loadAndDisplayAnnouncements() {
    const announcements = await fetchAnnouncements();
    sessionStorage.setItem("currentAnnouncements", JSON.stringify(announcements));
    displayAnnouncementBanner(announcements);
  }

  // Update UI based on authentication state
  function updateAuthUI() {
    if (currentUser) {
      loginButton.classList.add("hidden");
      userInfo.classList.remove("hidden");
      manageAnnouncementsBtn.classList.remove("hidden");
      displayName.textContent = currentUser.display_name;
    } else {
      loginButton.classList.remove("hidden");
      userInfo.classList.add("hidden");
      manageAnnouncementsBtn.classList.add("hidden");
      displayName.textContent = "";
      // Hide announcement management modal if open
      closeAnnouncementModalHandler();
    }

    updateAuthBodyClass();
    // Refresh the activities to update the UI
    fetchActivities();
    // Load announcements
    loadAndDisplayAnnouncements();
  }

  // Update body class for CSS targeting
  function updateAuthBodyClass() {
    if (currentUser) {
      document.body.classList.remove("not-authenticated");
    } else {
      document.body.classList.add("not-authenticated");
    }
  }

  // Login function
  async function login(username, password) {
    try {
      const response = await fetch(
        `/auth/login?username=${encodeURIComponent(
          username
        )}&password=${encodeURIComponent(password)}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showLoginMessage(
          data.detail || "Invalid username or password",
          "error"
        );
        return false;
      }

      // Login successful
      currentUser = data;
      localStorage.setItem("currentUser", JSON.stringify(data));
      // Store password temporarily for API calls (in a real app, use tokens)
      sessionStorage.setItem("userPassword", password);
      updateAuthUI();
      closeLoginModalHandler();
      showMessage(`Welcome, ${currentUser.display_name}!`, "success");
      return true;
    } catch (error) {
      console.error("Error during login:", error);
      showLoginMessage("Login failed. Please try again.", "error");
      return false;
    }
  }

  // Logout function
  function logout() {
    currentUser = null;
    localStorage.removeItem("currentUser");
    sessionStorage.removeItem("userPassword");
    updateAuthUI();
    showMessage("You have been logged out.", "info");
  }

  // Show message in login modal
  function showLoginMessage(text, type) {
    loginMessage.textContent = text;
    loginMessage.className = `message ${type}`;
    loginMessage.classList.remove("hidden");
  }

  // Open login modal
  function openLoginModal() {
    loginModal.classList.remove("hidden");
    loginModal.classList.add("show");
    loginMessage.classList.add("hidden");
    loginForm.reset();
  }

  // Close login modal
  function closeLoginModalHandler() {
    loginModal.classList.remove("show");
    setTimeout(() => {
      loginModal.classList.add("hidden");
      loginForm.reset();
    }, 300);
  }

  // Event listeners for authentication
  loginButton.addEventListener("click", openLoginModal);
  logoutButton.addEventListener("click", logout);
  closeLoginModal.addEventListener("click", closeLoginModalHandler);

  // Close login modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === loginModal) {
      closeLoginModalHandler();
    }
  });

  // Handle login form submission
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    await login(username, password);
  });

  // Announcement event listeners
  dismissAnnouncementBtn.addEventListener("click", dismissAnnouncement);
  manageAnnouncementsBtn.addEventListener("click", openAnnouncementModal);
  closeAnnouncementModal.addEventListener("click", closeAnnouncementModalHandler);
  addAnnouncementBtn.addEventListener("click", showAddAnnouncementForm);
  cancelAnnouncementBtn.addEventListener("click", () => {
    announcementFormSection.classList.add("hidden");
    announcementForm.reset();
  });
  announcementForm.addEventListener("submit", saveAnnouncement);

  // Close announcement modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === announcementModal) {
      closeAnnouncementModalHandler();
    }
  });

  // Show loading skeletons
  function showLoadingSkeletons() {
    activitiesList.innerHTML = "";

    // Create more skeleton cards to fill the screen since they're smaller now
    for (let i = 0; i < 9; i++) {
      const skeletonCard = document.createElement("div");
      skeletonCard.className = "skeleton-card";
      skeletonCard.innerHTML = `
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line skeleton-text short"></div>
        <div style="margin-top: 8px;">
          <div class="skeleton-line" style="height: 6px;"></div>
          <div class="skeleton-line skeleton-text short" style="height: 8px; margin-top: 3px;"></div>
        </div>
        <div style="margin-top: auto;">
          <div class="skeleton-line" style="height: 24px; margin-top: 8px;"></div>
        </div>
      `;
      activitiesList.appendChild(skeletonCard);
    }
  }

  // Format schedule for display - handles both old and new format
  function formatSchedule(details) {
    // If schedule_details is available, use the structured data
    if (details.schedule_details) {
      const days = details.schedule_details.days.join(", ");

      // Convert 24h time format to 12h AM/PM format for display
      const formatTime = (time24) => {
        const [hours, minutes] = time24.split(":").map((num) => parseInt(num));
        const period = hours >= 12 ? "PM" : "AM";
        const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
        return `${displayHours}:${minutes
          .toString()
          .padStart(2, "0")} ${period}`;
      };

      const startTime = formatTime(details.schedule_details.start_time);
      const endTime = formatTime(details.schedule_details.end_time);

      return `${days}, ${startTime} - ${endTime}`;
    }

    // Fallback to the string format if schedule_details isn't available
    return details.schedule;
  }

  // Function to determine activity type (this would ideally come from backend)
  function getActivityType(activityName, description) {
    const name = activityName.toLowerCase();
    const desc = description.toLowerCase();

    if (
      name.includes("soccer") ||
      name.includes("basketball") ||
      name.includes("sport") ||
      name.includes("fitness") ||
      desc.includes("team") ||
      desc.includes("game") ||
      desc.includes("athletic")
    ) {
      return "sports";
    } else if (
      name.includes("art") ||
      name.includes("music") ||
      name.includes("theater") ||
      name.includes("drama") ||
      desc.includes("creative") ||
      desc.includes("paint")
    ) {
      return "arts";
    } else if (
      name.includes("science") ||
      name.includes("math") ||
      name.includes("academic") ||
      name.includes("study") ||
      name.includes("olympiad") ||
      desc.includes("learning") ||
      desc.includes("education") ||
      desc.includes("competition")
    ) {
      return "academic";
    } else if (
      name.includes("volunteer") ||
      name.includes("community") ||
      desc.includes("service") ||
      desc.includes("volunteer")
    ) {
      return "community";
    } else if (
      name.includes("computer") ||
      name.includes("coding") ||
      name.includes("tech") ||
      name.includes("robotics") ||
      desc.includes("programming") ||
      desc.includes("technology") ||
      desc.includes("digital") ||
      desc.includes("robot")
    ) {
      return "technology";
    }

    // Default to "academic" if no match
    return "academic";
  }

  // Function to fetch activities from API with optional day and time filters
  async function fetchActivities() {
    // Show loading skeletons first
    showLoadingSkeletons();

    try {
      // Build query string with filters if they exist
      let queryParams = [];

      // Handle day filter
      if (currentDay) {
        queryParams.push(`day=${encodeURIComponent(currentDay)}`);
      }

      // Handle time range filter
      if (currentTimeRange) {
        const range = timeRanges[currentTimeRange];

        // Handle weekend special case
        if (currentTimeRange === "weekend") {
          // Don't add time parameters for weekend filter
          // Weekend filtering will be handled on the client side
        } else if (range) {
          // Add time parameters for before/after school
          queryParams.push(`start_time=${encodeURIComponent(range.start)}`);
          queryParams.push(`end_time=${encodeURIComponent(range.end)}`);
        }
      }

      const queryString =
        queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
      const response = await fetch(`/activities${queryString}`);
      const activities = await response.json();

      // Save the activities data
      allActivities = activities;

      // Apply search and filter, and handle weekend filter in client
      displayFilteredActivities();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Function to display filtered activities
  function displayFilteredActivities() {
    // Clear the activities list
    activitiesList.innerHTML = "";

    // Apply client-side filtering - this handles category filter and search, plus weekend filter
    let filteredActivities = {};

    Object.entries(allActivities).forEach(([name, details]) => {
      const activityType = getActivityType(name, details.description);

      // Apply category filter
      if (currentFilter !== "all" && activityType !== currentFilter) {
        return;
      }

      // Apply weekend filter if selected
      if (currentTimeRange === "weekend" && details.schedule_details) {
        const activityDays = details.schedule_details.days;
        const isWeekendActivity = activityDays.some((day) =>
          timeRanges.weekend.days.includes(day)
        );

        if (!isWeekendActivity) {
          return;
        }
      }

      // Apply search filter
      const searchableContent = [
        name.toLowerCase(),
        details.description.toLowerCase(),
        formatSchedule(details).toLowerCase(),
      ].join(" ");

      if (
        searchQuery &&
        !searchableContent.includes(searchQuery.toLowerCase())
      ) {
        return;
      }

      // Activity passed all filters, add to filtered list
      filteredActivities[name] = details;
    });

    // Check if there are any results
    if (Object.keys(filteredActivities).length === 0) {
      activitiesList.innerHTML = `
        <div class="no-results">
          <h4>No activities found</h4>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      `;
      return;
    }

    // Display filtered activities
    Object.entries(filteredActivities).forEach(([name, details]) => {
      renderActivityCard(name, details);
    });
  }

  // Function to render a single activity card
  function renderActivityCard(name, details) {
    const activityCard = document.createElement("div");
    activityCard.className = "activity-card";

    // Calculate spots and capacity
    const totalSpots = details.max_participants;
    const takenSpots = details.participants.length;
    const spotsLeft = totalSpots - takenSpots;
    const capacityPercentage = (takenSpots / totalSpots) * 100;
    const isFull = spotsLeft <= 0;

    // Determine capacity status class
    let capacityStatusClass = "capacity-available";
    if (isFull) {
      capacityStatusClass = "capacity-full";
    } else if (capacityPercentage >= 75) {
      capacityStatusClass = "capacity-near-full";
    }

    // Determine activity type
    const activityType = getActivityType(name, details.description);
    const typeInfo = activityTypes[activityType];

    // Format the schedule using the new helper function
    const formattedSchedule = formatSchedule(details);

    // Create activity tag
    const tagHtml = `
      <span class="activity-tag" style="background-color: ${typeInfo.color}; color: ${typeInfo.textColor}">
        ${typeInfo.label}
      </span>
    `;

    // Create capacity indicator
    const capacityIndicator = `
      <div class="capacity-container ${capacityStatusClass}">
        <div class="capacity-bar-bg">
          <div class="capacity-bar-fill" style="width: ${capacityPercentage}%"></div>
        </div>
        <div class="capacity-text">
          <span>${takenSpots} enrolled</span>
          <span>${spotsLeft} spots left</span>
        </div>
      </div>
    `;

    activityCard.innerHTML = `
      ${tagHtml}
      <h4>${name}</h4>
      <p>${details.description}</p>
      <p class="tooltip">
        <strong>Schedule:</strong> ${formattedSchedule}
        <span class="tooltip-text">Regular meetings at this time throughout the semester</span>
      </p>
      ${capacityIndicator}
      <div class="participants-list">
        <h5>Current Participants:</h5>
        <ul>
          ${details.participants
            .map(
              (email) => `
            <li>
              ${email}
              ${
                currentUser
                  ? `
                <span class="delete-participant tooltip" data-activity="${name}" data-email="${email}">
                  ✖
                  <span class="tooltip-text">Unregister this student</span>
                </span>
              `
                  : ""
              }
            </li>
          `
            )
            .join("")}
        </ul>
      </div>
      <div class="activity-card-actions">
        ${
          currentUser
            ? `
          <button class="register-button" data-activity="${name}" ${
                isFull ? "disabled" : ""
              }>
            ${isFull ? "Activity Full" : "Register Student"}
          </button>
        `
            : `
          <div class="auth-notice">
            Teachers can register students.
          </div>
        `
        }
      </div>
    `;

    // Add click handlers for delete buttons
    const deleteButtons = activityCard.querySelectorAll(".delete-participant");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });

    // Add click handler for register button (only when authenticated)
    if (currentUser) {
      const registerButton = activityCard.querySelector(".register-button");
      if (!isFull) {
        registerButton.addEventListener("click", () => {
          openRegistrationModal(name);
        });
      }
    }

    activitiesList.appendChild(activityCard);
  }

  // Event listeners for search and filter
  searchInput.addEventListener("input", (event) => {
    searchQuery = event.target.value;
    displayFilteredActivities();
  });

  searchButton.addEventListener("click", (event) => {
    event.preventDefault();
    searchQuery = searchInput.value;
    displayFilteredActivities();
  });

  // Add event listeners to category filter buttons
  categoryFilters.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active class
      categoryFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Update current filter and display filtered activities
      currentFilter = button.dataset.category;
      displayFilteredActivities();
    });
  });

  // Add event listeners to day filter buttons
  dayFilters.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active class
      dayFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Update current day filter and fetch activities
      currentDay = button.dataset.day;
      fetchActivities();
    });
  });

  // Add event listeners for time filter buttons
  timeFilters.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active class
      timeFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Update current time filter and fetch activities
      currentTimeRange = button.dataset.time;
      fetchActivities();
    });
  });

  // Open registration modal
  function openRegistrationModal(activityName) {
    modalActivityName.textContent = activityName;
    activityInput.value = activityName;
    registrationModal.classList.remove("hidden");
    // Add slight delay to trigger animation
    setTimeout(() => {
      registrationModal.classList.add("show");
    }, 10);
  }

  // Close registration modal
  function closeRegistrationModalHandler() {
    registrationModal.classList.remove("show");
    setTimeout(() => {
      registrationModal.classList.add("hidden");
      signupForm.reset();
    }, 300);
  }

  // Event listener for close button
  closeRegistrationModal.addEventListener(
    "click",
    closeRegistrationModalHandler
  );

  // Close modal when clicking outside of it
  window.addEventListener("click", (event) => {
    if (event.target === registrationModal) {
      closeRegistrationModalHandler();
    }
  });

  // Create and show confirmation dialog
  function showConfirmationDialog(message, confirmCallback) {
    // Create the confirmation dialog if it doesn't exist
    let confirmDialog = document.getElementById("confirm-dialog");
    if (!confirmDialog) {
      confirmDialog = document.createElement("div");
      confirmDialog.id = "confirm-dialog";
      confirmDialog.className = "modal hidden";
      confirmDialog.innerHTML = `
        <div class="modal-content">
          <h3>Confirm Action</h3>
          <p id="confirm-message"></p>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
            <button id="cancel-button" class="cancel-btn">Cancel</button>
            <button id="confirm-button" class="confirm-btn">Confirm</button>
          </div>
        </div>
      `;
      document.body.appendChild(confirmDialog);

      // Style the buttons
      const cancelBtn = confirmDialog.querySelector("#cancel-button");
      const confirmBtn = confirmDialog.querySelector("#confirm-button");

      cancelBtn.style.backgroundColor = "#f1f1f1";
      cancelBtn.style.color = "#333";

      confirmBtn.style.backgroundColor = "#dc3545";
      confirmBtn.style.color = "white";
    }

    // Set the message
    const confirmMessage = document.getElementById("confirm-message");
    confirmMessage.textContent = message;

    // Show the dialog
    confirmDialog.classList.remove("hidden");
    setTimeout(() => {
      confirmDialog.classList.add("show");
    }, 10);

    // Handle button clicks
    const cancelButton = document.getElementById("cancel-button");
    const confirmButton = document.getElementById("confirm-button");

    // Remove any existing event listeners
    const newCancelButton = cancelButton.cloneNode(true);
    const newConfirmButton = confirmButton.cloneNode(true);
    cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
    confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);

    // Add new event listeners
    newCancelButton.addEventListener("click", () => {
      confirmDialog.classList.remove("show");
      setTimeout(() => {
        confirmDialog.classList.add("hidden");
      }, 300);
    });

    newConfirmButton.addEventListener("click", () => {
      confirmCallback();
      confirmDialog.classList.remove("show");
      setTimeout(() => {
        confirmDialog.classList.add("hidden");
      }, 300);
    });

    // Close when clicking outside
    confirmDialog.addEventListener("click", (event) => {
      if (event.target === confirmDialog) {
        confirmDialog.classList.remove("show");
        setTimeout(() => {
          confirmDialog.classList.add("hidden");
        }, 300);
      }
    });
  }

  // Handle unregistration with confirmation
  async function handleUnregister(event) {
    // Check if user is authenticated
    if (!currentUser) {
      showMessage(
        "You must be logged in as a teacher to unregister students.",
        "error"
      );
      return;
    }

    const activity = event.target.dataset.activity;
    const email = event.target.dataset.email;

    // Show confirmation dialog
    showConfirmationDialog(
      `Are you sure you want to unregister ${email} from ${activity}?`,
      async () => {
        try {
          const response = await fetch(
            `/activities/${encodeURIComponent(
              activity
            )}/unregister?email=${encodeURIComponent(
              email
            )}&teacher_username=${encodeURIComponent(currentUser.username)}`,
            {
              method: "POST",
            }
          );

          const result = await response.json();

          if (response.ok) {
            showMessage(result.message, "success");
            // Refresh the activities list
            fetchActivities();
          } else {
            showMessage(result.detail || "An error occurred", "error");
          }
        } catch (error) {
          showMessage("Failed to unregister. Please try again.", "error");
          console.error("Error unregistering:", error);
        }
      }
    );
  }

  // Show message function
  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    // Hide message after 5 seconds
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Check if user is authenticated
    if (!currentUser) {
      showMessage(
        "You must be logged in as a teacher to register students.",
        "error"
      );
      return;
    }

    const email = document.getElementById("email").value;
    const activity = activityInput.value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(
          email
        )}&teacher_username=${encodeURIComponent(currentUser.username)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        closeRegistrationModalHandler();
        // Refresh the activities list after successful signup
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Expose filter functions to window for future UI control
  window.activityFilters = {
    setDayFilter,
    setTimeRangeFilter,
  };

  // Initialize app
  checkAuthentication();
  initializeFilters();
  fetchActivities();
  loadAndDisplayAnnouncements();
});
