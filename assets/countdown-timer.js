/**
 * Countdown Timer
 * Creates a real-time countdown to a specified date and time
 */

class CountdownTimer {
  constructor(element) {
    this.element = element;
    this.targetDate = this.parseTargetDateTime();
    this.expiredMessage = this.element.dataset.expiredMessage || 'This offer has ended';
    this.showDays = this.element.dataset.showDays === 'true';
    this.showHours = this.element.dataset.showHours === 'true';
    this.showMinutes = this.element.dataset.showMinutes === 'true';
    this.showSeconds = this.element.dataset.showSeconds === 'true';
    
    this.interval = null;
    this.init();
  }

  parseTargetDateTime() {
    const date = this.element.dataset.targetDate;
    const time = this.element.dataset.targetTime;
    const timezone = this.element.dataset.timezone || 'UTC';
    
    if (!date || !time) {
      console.error('Countdown Timer: Missing target date or time');
      return null;
    }

    // Create date string in ISO format
    const dateTimeString = `${date}T${time}:00`;
    
    try {
      // Create date in the specified timezone
      const targetDate = new Date(dateTimeString);
      
      // Convert to UTC for calculations
      const utcDate = new Date(targetDate.toLocaleString('en-US', { timeZone: timezone }));
      return utcDate;
    } catch (error) {
      console.error('Countdown Timer: Invalid date/time format', error);
      return null;
    }
  }

  init() {
    if (!this.targetDate) {
      this.showError('Invalid countdown settings');
      return;
    }

    // Start the countdown
    this.updateCountdown();
    this.interval = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  updateCountdown() {
    const now = new Date();
    const timeLeft = this.targetDate - now;

    if (timeLeft <= 0) {
      this.showExpired();
      return;
    }

    this.displayTimeLeft(timeLeft);
  }

  displayTimeLeft(timeLeft) {
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    let displayHTML = '<div class="countdown-timer__units">';

    if (this.showDays && days > 0) {
      displayHTML += `
        <div class="countdown-timer__unit">
          <span class="countdown-timer__number">${this.padZero(days)}</span>
          <span class="countdown-timer__label">${days === 1 ? 'Day' : 'Days'}</span>
        </div>
      `;
    }

    if (this.showHours) {
      displayHTML += `
        <div class="countdown-timer__unit">
          <span class="countdown-timer__number">${this.padZero(hours)}</span>
          <span class="countdown-timer__label">${hours === 1 ? 'Hour' : 'Hours'}</span>
        </div>
      `;
    }

    if (this.showMinutes) {
      displayHTML += `
        <div class="countdown-timer__unit">
          <span class="countdown-timer__number">${this.padZero(minutes)}</span>
          <span class="countdown-timer__label">${minutes === 1 ? 'Minute' : 'Minutes'}</span>
        </div>
      `;
    }

    if (this.showSeconds) {
      displayHTML += `
        <div class="countdown-timer__unit">
          <span class="countdown-timer__number">${this.padZero(seconds)}</span>
          <span class="countdown-timer__label">${seconds === 1 ? 'Second' : 'Seconds'}</span>
        </div>
      `;
    }

    displayHTML += '</div>';
    this.element.querySelector('.countdown-timer__display').innerHTML = displayHTML;
  }

  showExpired() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    
    this.element.querySelector('.countdown-timer__display').innerHTML = `
      <div class="countdown-timer__expired">
        <span class="countdown-timer__expired-message">${this.expiredMessage}</span>
      </div>
    `;
  }

  showError(message) {
    this.element.querySelector('.countdown-timer__display').innerHTML = `
      <div class="countdown-timer__error">
        <span>${message}</span>
      </div>
    `;
  }

  padZero(num) {
    return num.toString().padStart(2, '0');
  }

  destroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}

// Initialize all countdown timers on the page
document.addEventListener('DOMContentLoaded', function() {
  const countdownElements = document.querySelectorAll('.countdown-timer');
  
  countdownElements.forEach(element => {
    new CountdownTimer(element);
  });
});

// Handle page visibility changes to pause/resume countdown
document.addEventListener('visibilitychange', function() {
  const countdownElements = document.querySelectorAll('.countdown-timer');
  
  countdownElements.forEach(element => {
    const timer = element.countdownTimer;
    if (timer) {
      if (document.hidden) {
        timer.pause();
      } else {
        timer.resume();
      }
    }
  });
});

