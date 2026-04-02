// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// 1. Sprawdź zapisaną preferencję w localStorage
const savedTheme = localStorage.getItem('theme');

// 2. Logika ustawiania motywu przy ładowaniu
if (savedTheme === 'light') {
    body.classList.remove('dark-theme');
    body.classList.add('light-theme');
} else {
    body.classList.remove('light-theme');
    body.classList.add('dark-theme');
}

// 3. Obsługa kliknięcia w przełącznik
themeToggle.addEventListener('click', () => {
    if (body.classList.contains('dark-theme')) {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
    }
    updateNavBg();
});

// Hamburger Menu
const hamburgerBtn = document.getElementById('hamburgerBtn');
const navMenu = document.querySelector('.nav-menu');

hamburgerBtn.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('mobile-open');
    hamburgerBtn.classList.toggle('open', isOpen);
    hamburgerBtn.setAttribute('aria-expanded', isOpen);
});

// Close mobile menu on link click
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('mobile-open');
        hamburgerBtn.classList.remove('open');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
    });
});
// Smooth Scrolling for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        
        if (target) {
            const offsetTop = target.offsetTop - 80; // Account for fixed nav
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Active Navigation Link on Scroll
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

function updateActiveLink() {
    const scrollPosition = window.scrollY + 100;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

window.addEventListener('scroll', updateActiveLink);

// Navbar Background on Scroll
const nav = document.querySelector('.nav');

function updateNavBg() {
    const isLight = body.classList.contains('light-theme');
    if (window.scrollY > 50) {
        nav.style.backgroundColor = isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(10, 10, 10, 0.98)';
    } else {
        nav.style.backgroundColor = isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(10, 10, 10, 0.95)';
    }
}

window.addEventListener('scroll', updateNavBg);

// Intersection Observer for Fade-in Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe all elements that should fade in
document.addEventListener('DOMContentLoaded', () => {
    const fadeElements = document.querySelectorAll('.project-card, .skill-item, .stat-card');
    fadeElements.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });
});

// Skill Bar Animation on Scroll
const skillBars = document.querySelectorAll('.skill-progress');
const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const progress = entry.target.style.getPropertyValue('--progress');
            entry.target.style.width = '0';
            setTimeout(() => {
                entry.target.style.width = progress;
            }, 100);
            skillObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

skillBars.forEach(bar => skillObserver.observe(bar));

// Contact Form Handling — Formspree
const contactForm = document.getElementById('contactForm');
const submitBtn = contactForm.querySelector('button[type="submit"]');

// ⚠️ WKLEJ SWÓJ ENDPOINT Z FORMSPREE.IO:
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xeepznno';

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Wysyłanie...';
    submitBtn.disabled = true;

    const data = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        message: document.getElementById('message').value
    };

    try {
        const response = await fetch(FORMSPREE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            submitBtn.textContent = '✓ Wysłano!';
            submitBtn.style.backgroundColor = 'var(--accent-primary)';
            contactForm.reset();
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                submitBtn.style.backgroundColor = '';
            }, 4000);
        } else {
            throw new Error('Błąd serwera');
        }
    } catch (err) {
        submitBtn.textContent = '✗ Błąd — spróbuj ponownie';
        submitBtn.style.backgroundColor = '#ff4444';
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            submitBtn.style.backgroundColor = '';
        }, 4000);
    }
});

const typingText = document.querySelector('.typing-effect');
if (typingText) {
    const originalText = typingText.textContent;
    const roles = ['frontend_developer', 'angular_specialist', 'react_developer', 'web_creator'];
    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    
    function typeEffect() {
        const currentRole = roles[roleIndex];
        
        if (isDeleting) {
            typingText.textContent = currentRole.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typingText.textContent = currentRole.substring(0, charIndex + 1);
            charIndex++;
        }
        
        let typeSpeed = isDeleting ? 50 : 100;
        
        if (!isDeleting && charIndex === currentRole.length) {
            typeSpeed = 2000; // Pause at end
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            roleIndex = (roleIndex + 1) % roles.length;
            typeSpeed = 500; // Pause before typing next
        }
        
        setTimeout(typeEffect, typeSpeed);
    }
    setTimeout(typeEffect, 1000);
}

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero-background');
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Easter Egg - Konami Code
let konamiCode = [];
const konamiPattern = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    konamiCode = konamiCode.slice(-10);
    
    if (konamiCode.join('') === konamiPattern.join('')) {
        document.body.style.animation = 'rainbow 2s linear infinite';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 5000);
    }
});

// Add rainbow animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes rainbow {
        0% { filter: hue-rotate(0deg); }
        100% { filter: hue-rotate(360deg); }
    }
`;
document.head.appendChild(style);

console.log('%c Hej', 'font-size: 24px; color: #00ff88; font-weight: bold;');
console.log('%c Widzę, że sprawdzasz konsolę! Jeśli szukasz programisty, skontaktuj się ze mną', 'font-size: 14px; color: #00ff88;');
if (window.performance) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = window.performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            console.log(`Page loaded in ${pageLoadTime}ms`);
        }, 0);
    });
}

// NOTE: Section reveal is handled by the IntersectionObserver below (fade-in class)
// No duplicate reveal observer needed
document.querySelectorAll('.experience-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
        const body = btn.nextElementSibling;
        const isOpen = btn.getAttribute('aria-expanded') === 'true';

        // Close all
        document.querySelectorAll('.experience-toggle').forEach(b => {
            b.setAttribute('aria-expanded', 'false');
            b.nextElementSibling.hidden = true;
        });

        if (!isOpen) {
            btn.setAttribute('aria-expanded', 'true');
            body.hidden = false;
        }
    });
});
