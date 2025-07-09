document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.getElementById('mainContent');
    const nav = document.getElementById('nav');
    const menuBar = document.getElementById('menuBar');
    const menuIconOpen = document.getElementById('menuIconOpen');
    const menuIconClose = document.getElementById('menuIconClose');
    const heroSubtitle = document.getElementById('heroSubtitle');
    const heroPhoto = document.getElementById('heroPhoto');
    const navLinks = document.getElementById('navLinks');
    const focusOverlay = document.getElementById('focusOverlay');
    const resumeButtonIconLine = document.querySelector('.resume-icon .icon-line');
    const currentYearSpan = document.getElementById('currentYear');
    const focusElements = document.querySelectorAll('.can-focus');
    const glassyElements = document.querySelectorAll('.glassy');
    const resumeButton = document.querySelector('.resume-button');
    const footer = document.querySelector('.footer');
    const colorToggleButton = document.getElementById('colorToggleButton');
    const transitionOverlay = document.getElementById('transitionOverlay'); 

    const dynamicPhotoSrc = 'images/my-photo.png';
    const staticPhotoSrc = 'images/my-photo.jpg';

    let isColorThiefEnabled = false;
    
    function resetToDefaultColors() {
        document.documentElement.style.removeProperty('--primary-color');
        document.documentElement.style.removeProperty('--secondary-color');
        document.documentElement.style.removeProperty('--accent-color');
        document.documentElement.style.removeProperty('--primary-color-rgb');
        document.documentElement.style.removeProperty('--secondary-color-rgb');
        document.documentElement.style.removeProperty('--accent-color-rgb');
        document.documentElement.style.removeProperty('--aurora-color-1');
        document.documentElement.style.removeProperty('--aurora-color-2');
        document.documentElement.style.removeProperty('--aurora-color-3');
        document.documentElement.style.removeProperty('--glow-color-rgb');
        
        document.querySelectorAll('.timeline-item-h').forEach(item => {
            item.style.removeProperty('--dot-color');
        });
    }

    function applyDynamicColors() {
        if (!isColorThiefEnabled || !window.ColorThief) return;
        try {
            const colorThief = new ColorThief();
            setTimeout(() => {
                const palette = colorThief.getPalette(heroPhoto, 5);
                if (!palette) return;
                const rgbToCss = (rgb) => `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
                const rgbToString = (rgb) => `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`;
                const primaryColor = rgbToCss(palette[0]);
                const accentColorRGB = rgbToString(palette[2]);

                document.documentElement.style.setProperty('--primary-color', primaryColor);
                document.documentElement.style.setProperty('--secondary-color', rgbToCss(palette[1]));
                document.documentElement.style.setProperty('--accent-color', rgbToCss(palette[2]));
                document.documentElement.style.setProperty('--primary-color-rgb', rgbToString(palette[0]));
                document.documentElement.style.setProperty('--secondary-color-rgb', rgbToString(palette[1]));
                document.documentElement.style.setProperty('--accent-color-rgb', accentColorRGB);
                document.documentElement.style.setProperty('--aurora-color-1', primaryColor);
                document.documentElement.style.setProperty('--aurora-color-2', rgbToCss(palette[2]));
                document.documentElement.style.setProperty('--aurora-color-3', rgbToCss(palette[4]));
                document.documentElement.style.setProperty('--glow-color-rgb', accentColorRGB);
                document.querySelectorAll('.timeline-item-h').forEach(item => {
                    item.style.setProperty('--dot-color', primaryColor);
                });

            }, 100);
        } catch (error) {
            console.error("ColorThief error:", error);
            resetToDefaultColors();
        }
    }

    
    if (colorToggleButton && heroPhoto) {
        colorToggleButton.addEventListener('click', () => {
            transitionOverlay.classList.add('active'); 

            setTimeout(() => {
                isColorThiefEnabled = !isColorThiefEnabled;
                if (isColorThiefEnabled) {
                    heroPhoto.src = dynamicPhotoSrc;
                    colorToggleButton.classList.add('on');
                    colorToggleButton.setAttribute('aria-label', 'Disable Dynamic Colors');
                } else {
                    heroPhoto.src = staticPhotoSrc;
                    colorToggleButton.classList.remove('on');
                    colorToggleButton.setAttribute('aria-label', 'Enable Dynamic Colors');
                    resetToDefaultColors();
                }
                
            }, 400); 

            setTimeout(() => {
                transitionOverlay.classList.remove('active'); 
            }, 600); 
        });
    }
    
    if (heroPhoto) {
        heroPhoto.addEventListener('load', applyDynamicColors);
    }
    
    const subtitlePhrases = ["Software Engineer", "Game Developer", "Web Designer", "Photo Editor", "Video Editor"];
    let currentPhraseIndex = 0;
    function updateSubtitle() {
        if (heroSubtitle) {
            heroSubtitle.style.opacity = 0;
            setTimeout(() => {
                currentPhraseIndex = (currentPhraseIndex + 1) % subtitlePhrases.length;
                heroSubtitle.textContent = subtitlePhrases[currentPhraseIndex];
                heroSubtitle.style.opacity = 1;
            }, 300);
        }
    }
    if (heroSubtitle) {
        heroSubtitle.style.opacity = 1;
        setInterval(updateSubtitle, 3000);
    }
    
    if (currentYearSpan) { currentYearSpan.textContent = new Date().getFullYear(); }
    if (resumeButtonIconLine) {
        const length = resumeButtonIconLine.getTotalLength();
        resumeButtonIconLine.style.strokeDasharray = length;
        resumeButtonIconLine.style.strokeDashoffset = length;
    }
    
    if (menuBar && navLinks) {
        menuBar.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = navLinks.classList.toggle('active');
            menuIconOpen.style.display = isActive ? 'none' : 'block';
            menuIconClose.style.display = isActive ? 'block' : 'none';
        });
    }

    document.querySelectorAll('.nav-links-desktop a, .nav-links-mobile a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetElement = document.querySelector(this.getAttribute('href'));
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                menuIconOpen.style.display = 'block';
                menuIconClose.style.display = 'none';
            }
        });
    });
    
    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const elementsToAnimate = entry.target.querySelectorAll('[data-animation]');
            if (entry.isIntersecting) {
                elementsToAnimate.forEach(el => { el.classList.add('is-visible'); });
            } else {
                elementsToAnimate.forEach(el => { el.classList.remove('is-visible'); });
            }
        });
    }, { root: mainContent, threshold: 0.4 });

    document.querySelectorAll('.animated-section').forEach(section => {
        animationObserver.observe(section);
    });

    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.target.id === 'home') {
                nav.classList.toggle('visible', !entry.isIntersecting);
            }
        });
    }, { root: mainContent, threshold: 0.1 });

    if (mainContent) {
        const heroSection = document.getElementById('home');
        if (heroSection) navObserver.observe(heroSection);
        if (footer) {
             const footerObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    resumeButton.classList.toggle('hidden', entry.isIntersecting);
                    colorToggleButton.classList.toggle('hidden', entry.isIntersecting);
                });
            }, { root: mainContent, threshold: 0.1 });
            footerObserver.observe(footer);
        }
    }

    focusElements.forEach(el => {
        const parentSection = el.closest('.animated-section, .hero');
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

    glassyElements.forEach(el => {
        el.addEventListener('mousemove', e => {
            const rect = el.getBoundingClientRect();
            el.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            el.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
        });
    });
});