// Define transition types
const TransitionType = {
  fadeOut: 'fade-out',
  fadeIn: 'fade-in',
  rotateOut: 'rotate-out',
  rotateIn: 'rotate-in',
  flipOut: 'flip-out',
  flipIn: 'flip-in',
};
  
const IconType = {
  STANDBY: './images/speak-icon.svg',
  PUSHSPEAK: './images/push-speak-icon.svg',
  RECORDING: './images/recording-icon.svg',
};

function insertAnimationStyles() {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
      @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
      }

      @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
      }

      @keyframes rotateOut {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
      }

      @keyframes rotateIn {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
      }

      @keyframes flipOut {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(90deg); }
      }

      @keyframes flipIn {
          from { transform: rotateY(90deg); opacity: 0; }
          to { transform: rotateY(0deg); opacity: 1; }
      }

      .fade-out {
          animation: fadeOut 1s cubic-bezier(.65,0,.34,1) forwards;
      }

      .fade-in {
          animation: fadeIn 1s cubic-bezier(.65,0,.34,1) forwards;
      }

      .rotate-out {
          animation: rotateOut 1s cubic-bezier(.65,0,.34,1) forwards;
      }

      .rotate-in {
          animation: rotateIn 1s cubic-bezier(.65,0,.34,1) forwards;
      }

      .flip-out {
          animation: flipOut 1s cubic-bezier(.65,0,.34,1) forwards;
      }

      .flip-in {
          animation: flipIn 1s cubic-bezier(.65,0,.34,1) forwards;
      }
  `;
  document.head.appendChild(styleSheet);
}

// Call this function when your script loads
insertAnimationStyles();
 
function clearAnimationClasses(element) {
  const animationClasses = Object.values(TransitionType);
  element.classList.remove(...animationClasses);
}

// Functions to perform transitions
function fadeIn(element, delay, duration, iconType, callback) {
  setTimeout(() => {
    clearAnimationClasses(element);
    element.classList.add('fade-in');
    element.style.setProperty('--duration', `${duration}s`);

    // Change the icon source at the start to avoid flicker
    displayIcon(element, iconType);

    element.addEventListener('animationend', (event) => {
      if (event.animationName === 'fadeIn') {
        console.log('fadeIn animation completed');
        if (callback) callback();
      }
    }, { once: true });
  }, delay * 1000);
}
 
function fadeOut(element, delay, duration, callback) {
  clearAnimationClasses(element);
  setTimeout(() => {
      element.classList.add('fade-out');
      element.style.animationDuration = `${duration}s`;

      element.addEventListener('animationend', (event) => {
          if (event.animationName === 'fadeOut') {
              console.log('fadeOut animation completed');
              if (callback) callback();
          }
      }, { once: true });
  }, delay * 1000);  // Convert delay to milliseconds
}

function rotateIn(element, delay, duration, iconType, callback) {
  setTimeout(() => {
    clearAnimationClasses(element);
    element.classList.add(TransitionType.rotateIn); 
    displayIcon(element, iconType);
    element.style.setProperty('--duration', `${duration}s`);

    element.addEventListener('animationend', (event) => {
      if (event.animationName === 'rotateIn') {
        console.log('rotateIn animation completed');
        if (callback) callback();
      }
    }, { once: true });
  }, delay * 1000);
}

function rotateOut(element, delay, duration, callback) {
  setTimeout(() => {
    clearAnimationClasses(element);
    element.classList.add(TransitionType.rotateOut); 
    element.style.setProperty('--duration', `${duration}s`);

    element.addEventListener('animationend', (event) => {
      if (event.animationName === 'rotateOut') {
        console.log('rotateOut animation completed');
        if (callback) callback();
      }
    }, { once: true });
  }, delay * 1000);
}

function flipIn(element, delay, duration, iconType, callback) {
  setTimeout(() => {
      clearAnimationClasses(element);
      displayIcon(element, iconType); // Set the icon before animating it in.
      element.classList.add('flip-in');
      element.style.animationDuration = `${duration}s`;

      element.addEventListener('animationend', (event) => {
          if (event.animationName === 'flipIn') {
              console.log('flipIn animation completed');
              if (callback && typeof callback === 'function') {
                  callback();
              }
          }
      }, { once: true });
  }, delay * 1000); // Apply delay in milliseconds
}

function flipOut(element, delay, duration, callback) {
  setTimeout(() => {
    clearAnimationClasses(element);
    element.classList.add('flip-out');
    element.style.animationDuration = `${duration}s`;

    element.addEventListener('animationend', (event) => {
      if (event.animationName === 'flipOut') {
        console.log('flipOut animation completed');
        if (callback) callback();
      }
    }, { once: true });
  }, delay * 1000);
}

// Function to display icon
function displayIcon(element, iconType) {
  console.log('Displaying Icon:', iconType); // Debug: Log displayed icon
  if (iconType) {
    element.src = iconType;
  } else {
    console.error('Icon type is undefined:', iconType);
  }
}

function updateButtonText(newText) {
  const textElement = document.querySelector("#start .text");

  if (textElement) {
    textElement.textContent = newText;
  } else {
    console.error("Text element not found.");
  }
}

/* Sample */
function continuousSwitch() {
  const iconElement = document.querySelector('.icon'); // Ensure this selector matches your HTML

  function switchIcon(currentIconType) {
    console.log('Current Icon:', currentIconType); // Debug: Log current icon
  
  
    if (currentIconType == IconType.STANDBY) {
      flipOut(iconElement, 1, 0.5, () => {
        // Make sure to pass all required arguments to fadeIn
        let nextIconType = IconType.PUSHSPEAK;
        flipIn(iconElement, 0, 0.5, nextIconType, () => {
          console.log('Switch to:', nextIconType);
          updateButtonText("Speak while pushing")
          switchIcon(nextIconType); // Recurse with the new icon type
        });
      });
    } else if (currentIconType == IconType.PUSHSPEAK) {
      fadeOut(iconElement, 10, 0.5, () => {
        // Make sure to pass all required arguments to fadeIn
        let nextIconType = IconType.STANDBY;
        fadeIn(iconElement, 0, 1, nextIconType, () => {
          console.log('Switch to:', nextIconType);
          switchIcon(nextIconType); // Recurse with the new icon type
          updateButtonText("Tap to speak")
        });
      });
    } else {
      console.log(`${currentIconType} is unknown iconType`)
    }
  }  

  // Start the switching process with the initial icon
  switchIcon(IconType.STANDBY);
}

document.addEventListener('DOMContentLoaded', (event) => {
  continuousSwitch();
});



