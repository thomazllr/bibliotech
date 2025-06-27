/**
 * BiblioTech Landing Page JavaScript
 */

document.addEventListener("DOMContentLoaded", function () {
  // Smooth scroll para links de ancoragem
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href");

      if (targetId === "#") return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: "smooth",
        });
      }
    });
  });

  // Efeito parallax otimizado no hero
  const hero = document.querySelector(".hero");
  let ticking = false;

  function updateParallax() {
    const scrollPosition = window.scrollY;
    if (scrollPosition < 800) {
      hero.style.transform = `translateY(${scrollPosition * 0.4}px)`;
    }
    ticking = false;
  }

  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }

  window.addEventListener("scroll", requestTick, { passive: true });
});
