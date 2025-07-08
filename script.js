document.addEventListener('DOMContentLoaded', () => {
    const nav = document.getElementById('nav');
    const menuBar = document.getElementById('menuBar');
    const heroSubtitle = document.getElementById('heroSubtitle');
    const heroPhoto = document.getElementById('heroPhoto');
    const navLinks = document.getElementById('navLinks');
    const focusOverlay = document.getElementById('focusOverlay');
    const heroSection = document.getElementById('home');
    const resumeButtonIconLine = document.querySelector('.resume-icon .icon-line');
    const currentYearSpan = document.getElementById('currentYear');
    const focusElements = document.querySelectorAll('.can-focus');
    const glassyElements = document.querySelectorAll('.glassy');
    const resumeButton = document.querySelector('.resume-button');
    const footer = document.querySelector('.footer');
    
    const colorToggleButton = document.getElementById('colorToggleButton');
    let isColorThiefEnabled = true;
    const originalPhotoSrc = 'images/my-photo.png';
    const alternatePhotoSrc = 'images/my-photo.jpg'; 

    const rootStyles = getComputedStyle(document.documentElement);
    const defaultColors = {
        '--primary-color': rootStyles.getPropertyValue('--primary-color').trim(),
        '--secondary-color': rootStyles.getPropertyValue('--secondary-color').trim(),
        '--accent-color': rootStyles.getPropertyValue('--accent-color').trim(),
        '--primary-color-rgb': rootStyles.getPropertyValue('--primary-color-rgb').trim(),
        '--secondary-color-rgb': rootStyles.getPropertyValue('--secondary-color-rgb').trim(),
        '--accent-color-rgb': rootStyles.getPropertyValue('--accent-color-rgb').trim(),
        '--aurora-color-1': rootStyles.getPropertyValue('--aurora-color-1').trim(),
        '--aurora-color-2': rootStyles.getPropertyValue('--aurora-color-2').trim(),
        '--aurora-color-3': rootStyles.getPropertyValue('--aurora-color-3').trim()
    };
    
    function resetToDefaultColors() {
        Object.keys(defaultColors).forEach(key => {
            document.documentElement.style.setProperty(key, defaultColors[key]);
        });
    }

    function applyDynamicColors() {
        if (!isColorThiefEnabled) return;

        try {
            const colorThief = new ColorThief();
            const palette = colorThief.getPalette(heroPhoto, 5);
            const rgbToCss = (rgb) => `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
            const rgbToString = (rgb) => `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`;
            
            document.documentElement.style.setProperty('--primary-color', rgbToCss(palette[0]));
            document.documentElement.style.setProperty('--secondary-color', rgbToCss(palette[1]));
            document.documentElement.style.setProperty('--accent-color', rgbToCss(palette[2]));
            document.documentElement.style.setProperty('--primary-color-rgb', rgbToString(palette[0]));
            document.documentElement.style.setProperty('--secondary-color-rgb', rgbToString(palette[1]));
            document.documentElement.style.setProperty('--accent-color-rgb', rgbToString(palette[2]));
            document.documentElement.style.setProperty('--aurora-color-1', rgbToCss(palette[0]));
            document.documentElement.style.setProperty('--aurora-color-2', rgbToCss(palette[2]));
            document.documentElement.style.setProperty('--aurora-color-3', rgbToCss(palette[4]));
        } catch (error) {
            console.error("ColorThief error:", error);
        }
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

    if (colorToggleButton && heroPhoto) {
        colorToggleButton.classList.add('off');
        colorToggleButton.setAttribute('aria-label', 'Enable Dynamic Colors');

        colorToggleButton.addEventListener('click', () => {
            isColorThiefEnabled = !isColorThiefEnabled;

            if (isColorThiefEnabled) {
                heroPhoto.src = originalPhotoSrc;
                colorToggleButton.classList.remove('off');
                colorToggleButton.setAttribute('aria-label', 'Disable Dynamic Colors');
            } else {
                heroPhoto.src = alternatePhotoSrc;
                colorToggleButton.classList.add('off');
                colorToggleButton.setAttribute('aria-label', 'Enable Dynamic Colors');
                resetToDefaultColors();
            }
        });
    }
    
    if (heroPhoto) {
        heroPhoto.addEventListener('load', applyDynamicColors);
    }
    
    function setResumeIconLineLength() {
        if (resumeButtonIconLine) {
            const length = resumeButtonIconLine.getTotalLength();
            resumeButtonIconLine.style.strokeDasharray = length;
            resumeButtonIconLine.style.strokeDashoffset = length;
        }
    }

    if (heroSubtitle) {
        heroSubtitle.style.opacity = 1;
        setInterval(updateSubtitle, 3000);
    }
    
    setResumeIconLineLength();
    
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }
    
    if (menuBar && navLinks) {
        menuBar.addEventListener('click', (e) => {
            e.stopPropagation();
            navLinks.classList.add('mobile-menu');
            navLinks.classList.toggle('active');
        });
        navLinks.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('active') && !navLinks.contains(e.target) && !menuBar.contains(e.target)) {
                 navLinks.classList.remove('active');
            }
        });
    }
    
    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                nav.classList.add('visible');
            } else {
                nav.classList.remove('visible');
            }
        });
    }, { threshold: 0.1 });
    if(heroSection){
        navObserver.observe(heroSection);
    }
    
    focusElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            focusOverlay.classList.add('active');
            el.classList.add('is-focused');
        });
        el.addEventListener('mouseleave', () => {
            focusOverlay.classList.remove('active');
            el.classList.remove('is-focused');
        });
    });

    glassyElements.forEach(el => {
        el.addEventListener('mousemove', e => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            el.style.setProperty('--mouse-x', `${x}px`);
            el.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    if (resumeButton && footer && colorToggleButton) {
        const footerObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    resumeButton.classList.add('hidden');
                    colorToggleButton.classList.add('hidden');
                } else {
                    resumeButton.classList.remove('hidden');
                    colorToggleButton.classList.remove('hidden');
                }
            });
        }, { threshold: 0.1 });
        footerObserver.observe(footer);
    }
});