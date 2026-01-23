// Script per l'interattività del sito EQB

document.addEventListener('DOMContentLoaded', function() {
    console.log('EQB Website loaded successfully');
    
    // Smooth scrolling per i link di navigazione
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});
