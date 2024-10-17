const sessionInput = document.getElementById("session-length");
const shortBreakInput = document.getElementById("short-break-length");
const longBreakInput = document.getElementById("long-break-length");
const breakCountInput = document.getElementById("break-count");
const timerDisplay = document.getElementById("timer-display");
const startButton = document.getElementById("start-btn");
const pauseButton = document.getElementById("pause-btn");
const resetButton = document.getElementById("reset-btn");
const statusDisplay = document.getElementById("status");
const alertTone = document.getElementById("alert-tone");
const debugToggle = document.getElementById("debug-toggle");
const minutesUntilLongBreakDisplay = document.getElementById(
  "minutes-until-long-break"
);
const sessionsCompletedDisplay = document.getElementById("sessions-completed");

let interval = null;
let isPaused = false;
let isSession = true;
let shortBreaksDone = 0;
let sessionsCompleted = 0;
let debug = false;

// Request notification permission on load
if (Notification.permission === "default") {
  Notification.requestPermission();
}

// Sync the debug mode with the UI toggle
debugToggle.addEventListener("change", () => {
  debug = debugToggle.checked;
  console.log(`Debug mode is now ${debug ? "ON" : "OFF"}`);
});

// Function to return seconds based on debug state
function getSeconds(minutes) {
  return debug ? 5 : minutes * 60;
}

// Format time as mm:ss
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// Start the timer with the specified duration
function startTimer(duration) {
  clearInterval(interval); // Clear any existing interval
  let time = duration;
  timerDisplay.textContent = formatTime(time);

  interval = setInterval(() => {
    if (!isPaused) {
      time--;
      timerDisplay.textContent = formatTime(time);

      // Update the display with the remaining session time
      if (isSession) {
        updateStatsDisplay(time);
      }

      if (time <= 0) {
        clearInterval(interval);
        playAlertTone();
        sendNotification();
        handleSessionEnd(); // Transition to the next state
      }
    }
  }, 1000);
}

// Handle session or break end and switch to the next state
function handleSessionEnd() {
  if (isSession) {
    // End of work session
    sessionsCompleted++;
    shortBreaksDone++;

    if (shortBreaksDone >= breakCountInput.value) {
      statusDisplay.textContent = "Long Break";
      setTimerColor("green"); // Green for long break
      startTimer(getSeconds(Number(longBreakInput.value)));
      shortBreaksDone = 0; // Reset short break counter
    } else {
      statusDisplay.textContent = "Short Break";
      setTimerColor("green"); // Green for short break
      startTimer(getSeconds(Number(shortBreakInput.value)));
    }
  } else {
    // End of break
    statusDisplay.textContent = "Session in progress";
    setTimerColor("red"); // Red for session
    startTimer(getSeconds(Number(sessionInput.value)));
  }
  isSession = !isSession;
  updateStatsDisplay(); // Update the display after session or break ends
}

// Play the alert tone
function playAlertTone() {
  alertTone.currentTime = 0; // Reset to start
  alertTone.play().catch((error) => console.log("Audio play blocked:", error));
}

// Send a notification
function sendNotification() {
  const message = isSession ? "Time for a break!" : "Back to work!";
  if (Notification.permission === "granted" || "default") {
    new Notification("Pomodoro Timer", {
      body: message,
      icon: 'tomato.svg'
    });
  }
}

// Update the stats display (minutes until long break and sessions completed)
function updateStatsDisplay(currentSessionTime = 0) {
  const sessionMinutes = Number(sessionInput.value);
  const shortBreaksUntilLongBreak = breakCountInput.value - shortBreaksDone;

  // Calculate remaining time in the current session in minutes
  const remainingSessionMinutes = Math.ceil(currentSessionTime / 60);

  // Total minutes until long break, including the current session's progress
  const minutesUntilLongBreak =
    sessionMinutes * (shortBreaksUntilLongBreak - 1) +
    (shortBreaksUntilLongBreak - 1) * shortBreakInput.value +
    remainingSessionMinutes;

  minutesUntilLongBreakDisplay.textContent = Math.max(0, minutesUntilLongBreak);
  sessionsCompletedDisplay.textContent = sessionsCompleted;
}

// Set the timer display color
function setTimerColor(color) {
  timerDisplay.style.color = color;
}

// Event listeners for the control buttons
startButton.addEventListener("click", () => {
  if (!interval) {
    // Only start if no interval is running
    statusDisplay.textContent = "Session in progress";
    setTimerColor("red"); // Red for session
    startTimer(getSeconds(Number(sessionInput.value)));
  }
  isPaused = false;
});

pauseButton.addEventListener("click", () => {
  isPaused = !isPaused;
});

// Reset button event listener to properly reset everything
resetButton.addEventListener("click", () => {
  clearInterval(interval);
  interval = null; // Clear the interval reference
  timerDisplay.textContent = formatTime(getSeconds(Number(sessionInput.value)));
  statusDisplay.textContent = "Session in progress";
  setTimerColor("red"); // Reset to red for session
  isSession = true;
  shortBreaksDone = 0;
  sessionsCompleted = 0;
  isPaused = false;
  // updateStatsDisplay(); // Reset stats display
  sessionsCompletedDisplay.textContent = 0;
});
