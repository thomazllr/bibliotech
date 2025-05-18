export function showToast(message, type = "info", duration = 3000) {
    const toast = document.createElement("div");
    toast.classList.add("toast", type);
  
    const icons = {
      info: "info-circle",
      success: "check-circle",
      error: "exclamation-circle",
      warning: "exclamation-triangle",
    };
  
    const icon = icons[type] || "info-circle";
  
    toast.innerHTML = `
      <i class="fas fa-${icon} toast-icon"></i>
      <span class="toast-message">${message}</span>
      <button class="toast-close">&times;</button>
    `;
  
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.classList.add("toast-container");
      document.body.appendChild(container);
    }
  
    container.appendChild(toast);
  
    // Exibe o toast
    void toast.offsetWidth;
    toast.classList.add("active");
  
    // Remove o toast após o tempo definido
    let timeoutId = setTimeout(() => {
      toast.classList.remove("active");
      toast.classList.add("fadeOut");
      toast.addEventListener("transitionend", () => toast.remove(), {
        once: true,
      });
    }, duration);
  
    // Permite fechar manualmente
    toast.querySelector(".toast-close").addEventListener("click", () => {
      clearTimeout(timeoutId);
      toast.classList.remove("active");
      toast.classList.add("fadeOut");
      toast.addEventListener("transitionend", () => toast.remove(), {
        once: true,
      });
    });
  
    return toast;
  }