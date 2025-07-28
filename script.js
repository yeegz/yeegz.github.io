function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.getElementById('mainContent');
    const nav = document.getElementById('nav');
    const menuBar = document.getElementById('menuBar');
    const menuIconOpen = document.getElementById('menuIconOpen');
    const menuIconClose = document.getElementById('menuIconClose');
    const navLinksMobileEl = document.getElementById('navLinks');
    const heroSubtitle = document.getElementById('heroSubtitle');
    const focusOverlay = document.getElementById('focusOverlay');
    const currentYearSpan = document.getElementById('currentYear');
    const focusElements = document.querySelectorAll('.can-focus');
    const glassyElements = document.querySelectorAll('.glassy');
    const footer = document.querySelector('.footer');
    const heroPhoto = document.getElementById('heroPhoto');

    const themeToggleButton = document.getElementById('themeToggleButton');
    const themeSwitcherButton = document.getElementById('themeSwitcherButton');
    const resumeButton = document.querySelector('.resume-button');
    const homeButton = document.querySelector('.home-button');

    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }
    if (resumeButton) {
        const resumeButtonIconLine = resumeButton.querySelector('.icon-line');
        if (resumeButtonIconLine) {
            const length = resumeButtonIconLine.getTotalLength();
            resumeButtonIconLine.style.strokeDasharray = length;
            resumeButtonIconLine.style.strokeDashoffset = length;
        }
    }

    const applyTheme = (theme) => {
        if (theme === 'light') {
            document.body.classList.add('light-mode');
            if (heroPhoto) { heroPhoto.src = 'images/my-photo-light.jpg'; }
        } else {
            document.body.classList.remove('light-mode');
            if (heroPhoto) { heroPhoto.src = 'images/my-photo.jpg'; }
        }
        localStorage.setItem('theme', theme);
    };

    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            const newTheme = document.body.classList.contains('light-mode') ? 'dark' : 'light';
            applyTheme(newTheme);
        });
    }

    const colorThemes = ['theme-red', 'theme-green', 'theme-purple'];
    let currentThemeIndex = 0;

    const applyColorTheme = (themeClass) => {
        colorThemes.forEach(t => document.body.classList.remove(t));
        if (themeClass) {
            document.body.classList.add(themeClass);
            currentThemeIndex = colorThemes.indexOf(themeClass);
        }
        localStorage.setItem('colorTheme', themeClass);
    };

    if (themeSwitcherButton) {
        themeSwitcherButton.addEventListener('click', () => {
            currentThemeIndex = (currentThemeIndex + 1) % colorThemes.length;
            const newThemeClass = colorThemes[currentThemeIndex];
            applyColorTheme(newThemeClass);
        });
    }

    const savedTheme = localStorage.getItem('theme') || 'dark';
    const savedColorTheme = localStorage.getItem('colorTheme') || 'theme-red';
    applyTheme(savedTheme);
    applyColorTheme(savedColorTheme);
    
    if (heroSubtitle) {
        const subtitlePhrases = ["Software Engineer", "Game Developer", "Web Designer", "Photo Editor", "Video Editor"];
        let currentPhraseIndex = 0;
        
        function updateSubtitle() {
            heroSubtitle.classList.add('fade-out');
            setTimeout(() => {
                currentPhraseIndex = (currentPhraseIndex + 1) % subtitlePhrases.length;
                heroSubtitle.textContent = subtitlePhrases[currentPhraseIndex];
                heroSubtitle.classList.remove('fade-out');
                heroSubtitle.classList.add('fade-in');
            }, 300);
        }
        setInterval(updateSubtitle, 4000);
    }

    if (menuBar && navLinksMobileEl) {
        menuBar.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = navLinksMobileEl.classList.toggle('active');
            menuIconOpen.style.display = isActive ? 'none' : 'block';
            menuIconClose.style.display = isActive ? 'block' : 'none';
        });
    }

    if (navLinksMobileEl) {
        document.querySelectorAll('.nav-links-desktop a, .nav-links-mobile a, .nav-brand a').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                if (this.getAttribute('href').startsWith('#')) {
                    e.preventDefault();
                    const targetId = this.getAttribute('href');
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                    }
                    if (navLinksMobileEl.classList.contains('active')) {
                        navLinksMobileEl.classList.remove('active');
                        menuIconOpen.style.display = 'block';
                        menuIconClose.style.display = 'none';
                    }
                }
            });
        });
    }
    
    if (mainContent) {
        const animatedSections = document.querySelectorAll('.animated-section');
        if (animatedSections.length > 0) {
            const animationObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const elementsToAnimate = entry.target.querySelectorAll('[data-animation]');
                    if (entry.isIntersecting) {
                        elementsToAnimate.forEach(el => el.classList.add('is-visible'));
                    } else {
                        elementsToAnimate.forEach(el => el.classList.remove('is-visible'));
                    }
                });
            }, { root: mainContent, threshold: 0.4 });
            animatedSections.forEach(section => animationObserver.observe(section));
        }

        if (nav) {
            const navObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.target.id === 'home') {
                        nav.classList.toggle('visible', !entry.isIntersecting);
                    }
                });
            }, { root: mainContent, threshold: 0.1 });
            const heroSection = document.getElementById('home');
            if (heroSection) navObserver.observe(heroSection);
        }
        
        if (footer) {
             const footerObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const isHidden = entry.isIntersecting;
                    if(resumeButton) resumeButton.classList.toggle('hidden', isHidden);
                    if(themeToggleButton) themeToggleButton.classList.toggle('hidden', isHidden);
                    if(themeSwitcherButton) themeSwitcherButton.classList.toggle('hidden', isHidden);
                });
            }, { root: mainContent, threshold: 0.1 });
            footerObserver.observe(footer);
        }

        const sections = document.querySelectorAll('main > section[id]');
        const allNavLinks = document.querySelectorAll('.nav-links-desktop a, .nav-brand a, .nav-links-mobile a');
        if (sections.length > 0 && allNavLinks.length > 0) {
            const sectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute('id');
                        allNavLinks.forEach(link => {
                            link.classList.remove('active');
                            if (link.getAttribute('href') === `#${id}`) {
                                link.classList.add('active');
                            }
                        });
                    }
                });
            }, { root: mainContent, threshold: 0.5 });
            sections.forEach(section => sectionObserver.observe(section));
        }
    }

    if (focusElements.length > 0 && focusOverlay) {
        focusElements.forEach(el => {
            const parentSection = el.closest('.animated-section, .hero, .resume-sidebar');
            el.addEventListener('mouseenter', () => {
                focusOverlay.classList.add('active');
                el.classList.add('is-focused');
                if (parentSection) parentSection.classList.add('is-focused-section');
            });
            el.addEventListener('mouseleave', () => {
                focusOverlay.classList.remove('active');
                el.classList.remove('is-focused');
                if (parentSection) parentSection.classList.remove('is-focused-section');
            });
        });
    }

    if (glassyElements.length > 0) {
        glassyElements.forEach(el => {
            el.addEventListener('mousemove', throttle(e => {
                const rect = el.getBoundingClientRect();
                el.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                el.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
            }, 30));
        });
    }

    if (document.body.classList.contains('interactive-dots')) {
        window.addEventListener('mousemove', throttle(e => {
            document.body.style.setProperty('--mouse-x', `${e.clientX}px`);
            document.body.style.setProperty('--mouse-y', `${e.clientY}px`);
        }, 16));
    }
});