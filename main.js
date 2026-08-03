document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================
  // 1. Mobile Navigation Toggle
  // ==========================================
  // Your CSS uses '.open' to animate the hamburger icon and show the dropdown menu.
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      // Toggles the '.open' class defined in your CSS media queries
      navToggle.classList.toggle('open');
      navLinks.classList.toggle('open');
      
      // Update accessibility attributes
      const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', !isExpanded);
    });
    
    // Close the menu automatically when a user clicks any navigation link
    const navItems = navLinks.querySelectorAll('a');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        navToggle.classList.remove('open');
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
  
  // ==========================================
  // 2. Scroll Reveal Animations
  // ==========================================
  // Your CSS hides '.reveal' elements and uses '.reveal.in' to fade them in and slide them up.
  const revealElements = document.querySelectorAll('.reveal');
  
  const revealOptions = {
    threshold: 0.15, // Triggers when 15% of the element is visible in the viewport
    rootMargin: "0px 0px -40px 0px"
  };
  
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Adds the '.in' class to trigger the transition specified in your CSS
        entry.target.classList.add('in');
        
        // Unobserve so the animation only happens once
        observer.unobserve(entry.target);
      }
    });
  }, revealOptions);
  
  revealElements.forEach(el => {
    revealObserver.observe(el);
  });
  
  // ==========================================
  // 3. Chatbot UI Toggle
  // ==========================================
  // Your CSS uses '.chat-open' on the parent '.chat-widget' to slide up the chat panel.
  const chatWidget = document.getElementById('chatWidget');
  const chatToggle = document.getElementById('chatToggle');
  const chatClose = document.getElementById('chatClose');
  const chatInput = document.getElementById('chatInput');
  
  function toggleChat() {
    if (chatWidget) {
      // Toggles the '.chat-open' class defined in your CSS
      chatWidget.classList.toggle('chat-open');
      
      const isOpen = chatWidget.classList.contains('chat-open');
      if (chatToggle) {
        chatToggle.setAttribute('aria-expanded', isOpen);
      }
      
      // Automatically focus the text input when the chat opens
      if (isOpen && chatInput) {
        setTimeout(() => {
          chatInput.focus();
        }, 300); // Wait for the 0.2s CSS transition to finish
      }
    }
  }
  
  if (chatToggle) {
    chatToggle.addEventListener('click', toggleChat);
  }
  
  if (chatClose) {
    chatClose.addEventListener('click', toggleChat);
  }
  
});
