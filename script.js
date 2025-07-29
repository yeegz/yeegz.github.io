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
    // --- CACHE DOM ELEMENTS ---
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
    const allNavLinks = document.querySelectorAll('.nav-links-desktop a, .nav-links-mobile a, .nav-brand a');
    const sections = document.querySelectorAll('main > section[id]');

    // --- INITIALIZE ---
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }
    
    // --- RESUME BUTTON ANIMATION ---
    if (resumeButton) {
        const resumeButtonIconLine = resumeButton.querySelector('.icon-line');
        if (resumeButtonIconLine) {
            try {
                const length = resumeButtonIconLine.getTotalLength();
                resumeButtonIconLine.style.strokeDasharray = length;
                resumeButtonIconLine.style.strokeDashoffset = length;
            } catch (e) {
                console.error("Could not get total length of SVG path.", e);
            }
        }
    }

    // --- THEME & APPEARANCE ---
    const applyTheme = (theme) => {
        if (theme === 'light') {
            document.body.classList.add('light-mode');
            if (heroPhoto) heroPhoto.src = 'images/my-photo-light.jpg';
        } else {
            document.body.classList.remove('light-mode');
            if (heroPhoto) heroPhoto.src = 'images/my-photo.jpg';
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

    // --- HERO SUBTITLE ANIMATION ---
    if (heroSubtitle) {
        const subtitlePhrases = ["Software Engineer", "Game Developer", "Web Designer", "Photo Editor", "Video Editor"];
        let currentPhraseIndex = 0;
        
        function updateSubtitle() {
            heroSubtitle.classList.remove('fade-in');
            heroSubtitle.classList.add('fade-out');
            
            setTimeout(() => {
                currentPhraseIndex = (currentPhraseIndex + 1) % subtitlePhrases.length;
                heroSubtitle.textContent = subtitlePhrases[currentPhraseIndex];
                
                heroSubtitle.classList.remove('fade-out');
                heroSubtitle.classList.add('fade-in');
            }, 300);
        }

        heroSubtitle.textContent = subtitlePhrases[0];
        heroSubtitle.classList.add('fade-in');
        setInterval(updateSubtitle, 4000);
    }
    
    // --- NAVIGATION & SCROLLING ---
    if (menuBar && navLinksMobileEl) {
        menuBar.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = navLinksMobileEl.classList.toggle('active');
            if (menuIconOpen) menuIconOpen.style.display = isActive ? 'none' : 'block';
            if (menuIconClose) menuIconClose.style.display = isActive ? 'block' : 'none';
        });
    }

    if (allNavLinks.length > 0) {
        allNavLinks.forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                if (this.getAttribute('href').startsWith('#')) {
                    e.preventDefault();
                    const targetId = this.getAttribute('href');
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                    }
                    if (navLinksMobileEl && navLinksMobileEl.classList.contains('active')) {
                        navLinksMobileEl.classList.remove('active');
                        if (menuIconOpen) menuIconOpen.style.display = 'block';
                        if (menuIconClose) menuIconClose.style.display = 'none';
                    }
                }
            });
        });
    }
    
    // --- INTERSECTION OBSERVERS ---
    if (mainContent) {
        const animatedSections = document.querySelectorAll('.animated-section');
        if (animatedSections.length > 0) {
            const animationObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const elementsToAnimate = entry.target.querySelectorAll('[data-animation]');
                    if (entry.isIntersecting) {
                        elementsToAnimate.forEach(el => el.classList.add('is-visible'));
                    }
                });
            }, { root: mainContent, threshold: 0.4 });
            animatedSections.forEach(section => animationObserver.observe(section));
        }

        if (nav) {
            const heroSection = document.getElementById('home');
            if(heroSection){
                const navObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        nav.classList.toggle('visible', !entry.isIntersecting);
                    });
                }, { root: mainContent, threshold: 0.1 });
                navObserver.observe(heroSection);
            }
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

    // --- INTERACTIVITY & EFFECTS ---
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

    // --- DOTS BACKGROUND EFFECT ---
    if (document.body.classList.contains('interactive-dots')) {
        window.addEventListener('mousemove', throttle(e => {
            document.body.style.setProperty('--mouse-x', `${e.clientX}px`);
            document.body.style.setProperty('--mouse-y', `${e.clientY}px`);
        }, 16));
    }

    // --- PHOTO GALLERY LOGIC ---
    const galleryOverlay = document.getElementById('galleryOverlay');
    if (galleryOverlay) {
        const galleryMainImage = document.getElementById('galleryMainImage');
        const galleryDescription = document.getElementById('galleryDescription');
        const galleryCloseBtn = document.getElementById('galleryCloseBtn');
        const galleryPrevBtn = document.getElementById('galleryPrev');
        const galleryNextBtn = document.getElementById('galleryNext');
        const viewPhotoButtons = document.querySelectorAll('.view-photos-btn');
        
        let currentAlbum = [];
        let currentImageIndex = 0;

        const photoAlbums = {
            gis: {
                title: 'Global International School',
                photos: [
                    { src: 'images/GIS1.png', description: 'Me at Graduation' },
                    { src: 'images/GIS2.png', description: 'Me and my Father' },
                    { src: 'images/GIS3.png', description: 'Me and my Friends' }
                ]
            },
            mmu: {
                title: 'Multimedia University',
                photos: [
                    { src: 'images/mmu1.png', description: 'Us before our Final' },
                    { src: 'images/mmu2.png', description: 'During Class' },
                    { src: 'images/mmu3.png', description: 'At Library' }
                ]
            },
            sunway: {
                title: 'Sunway University',
                photos: [
                    { src: 'images/sunway1.png', description: 'Sunway campus entrance.' },
                    { src: 'images/sunway2.png', description: 'Waiting for next Class' },
                    { src: 'images/sunway3.png', description: 'A vertical shot of the Sunway University Campus' }
                ]
            }
        };

        function updateGalleryView() {
            galleryMainImage.style.opacity = 0;
            galleryDescription.style.opacity = 0;

            setTimeout(() => {
                const currentPhoto = currentAlbum[currentImageIndex];
                galleryMainImage.src = currentPhoto.src;
                galleryDescription.textContent = currentPhoto.description;
                
                galleryMainImage.style.opacity = 1;
                galleryDescription.style.opacity = 1;

                galleryPrevBtn.style.display = currentImageIndex === 0 ? 'none' : 'flex';
                galleryNextBtn.style.display = currentImageIndex === currentAlbum.length - 1 ? 'none' : 'flex';
            }, 200);
        }

        function openGallery(albumKey) {
            currentAlbum = photoAlbums[albumKey]?.photos;
            if (!currentAlbum || currentAlbum.length === 0) return;

            currentImageIndex = 0;
            updateGalleryView();
            galleryOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeGallery() {
            galleryOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
        
        viewPhotoButtons.forEach(button => {
            button.addEventListener('click', () => openGallery(button.dataset.album));
        });

        galleryPrevBtn.addEventListener('click', () => {
            if (currentImageIndex > 0) {
                currentImageIndex--;
                updateGalleryView();
            }
        });

        galleryNextBtn.addEventListener('click', () => {
            if (currentImageIndex < currentAlbum.length - 1) {
                currentImageIndex++;
                updateGalleryView();
            }
        });

        galleryCloseBtn.addEventListener('click', closeGallery);
        galleryOverlay.addEventListener('click', (e) => {
            if (e.target === galleryOverlay) {
                closeGallery();
            }
        });
        
        window.addEventListener('keydown', (e) => {
            if (galleryOverlay.classList.contains('active')) {
                if (e.key === 'Escape') closeGallery();
                if (e.key === 'ArrowLeft') galleryPrevBtn.click();
                if (e.key === 'ArrowRight') galleryNextBtn.click();
            }
        });
    }
    
    // --- LOAD SAVED SETTINGS ---
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const savedColorTheme = localStorage.getItem('colorTheme') || 'theme-red';

    applyTheme(savedTheme);
    applyColorTheme(savedColorTheme);
});