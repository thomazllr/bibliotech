export function setupMenuToggle(callback) {
    const menuItems = document.querySelectorAll(".menu-item");
    
    menuItems.forEach(item => {
      item.addEventListener("click", async function() {
        const sectionId = this.dataset.section;
        
        // Ativação visual do menu
        menuItems.forEach(i => i.classList.remove("active"));
        this.classList.add("active");
        
        // Controle de seções
        document.querySelectorAll(".profile-content").forEach(s => {
          s.classList.add("hidden");
        });
        const sectionEl = document.getElementById(`section-${sectionId}`);
        if (sectionEl) {
          sectionEl.classList.remove("hidden");
        } else {
          console.warn(`Seção não encontrada: section-${sectionId}`);
        }
        
        // Callback para inicialização sob demanda
        if (typeof callback === 'function') {
          await callback(sectionId);
        }
      });
    });
}