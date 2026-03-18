// ==========================================
// DOM Elements
// ==========================================
var header = document.getElementById('header');
var burger = document.getElementById('burger');
var nav = document.getElementById('nav');
var programTabs = document.querySelectorAll('.program__tab');
var programDays = document.querySelectorAll('.program__day');
var faqItems = document.querySelectorAll('.faq__item');
var statsNumbers = document.querySelectorAll('.stats__number');
var registrationForm = document.getElementById('registrationForm');
var formSuccess = document.getElementById('formSuccess');

// ==========================================
// Header scroll effect
// ==========================================
window.addEventListener('scroll', function() {
    var currentScroll = window.pageYOffset;

    if (currentScroll > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// ==========================================
// Mobile menu toggle
// ==========================================
if (burger) {
    burger.addEventListener('click', function() {
        burger.classList.toggle('active');
        nav.classList.toggle('active');
        document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
    });
}

// Close mobile menu on link click
if (nav) {
    nav.querySelectorAll('.nav__link').forEach(function(link) {
        link.addEventListener('click', function() {
            burger.classList.remove('active');
            nav.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
}

// ==========================================
// Program tabs
// ==========================================
programTabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
        var day = tab.dataset.day;

        programTabs.forEach(function(t) {
            t.classList.remove('active');
        });
        tab.classList.add('active');

        programDays.forEach(function(d) {
            d.classList.remove('active');
            if (d.dataset.day === day) {
                d.classList.add('active');
            }
        });
    });
});

// ==========================================
// FAQ accordion
// ==========================================
faqItems.forEach(function(item) {
    var question = item.querySelector('.faq__question');

    if (question) {
        question.addEventListener('click', function() {
            var isActive = item.classList.contains('active');

            faqItems.forEach(function(i) {
                i.classList.remove('active');
            });

            if (!isActive) {
                item.classList.add('active');
            }
        });
    }
});

// ==========================================
// Stats counter animation
// ==========================================
function animateValue(element, start, end, duration) {
    var startTimestamp = null;

    function step(timestamp) {
        if (!startTimestamp) startTimestamp = timestamp;
        var progress = Math.min((timestamp - startTimestamp) / duration, 1);
        var easeOut = 1 - Math.pow(1 - progress, 4);
        element.textContent = Math.floor(start + (end - start) * easeOut);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    }

    window.requestAnimationFrame(step);
}

var statsObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
        if (entry.isIntersecting) {
            var element = entry.target;
            var endValue = parseInt(element.dataset.count);
            animateValue(element, 0, endValue, 2500);
            statsObserver.unobserve(element);
        }
    });
}, { threshold: 0.5 });

statsNumbers.forEach(function(stat) {
    statsObserver.observe(stat);
});

// ==========================================
// Package selection from tickets section
// ==========================================
var selectPackageButtons = document.querySelectorAll('.select-package-btn');

selectPackageButtons.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
        e.preventDefault();

        var packageValue = this.dataset.package;
        var formSection = document.getElementById('form');
        var packageRadio = document.querySelector('input[name="package"][value="' + packageValue + '"]');

        if (packageRadio) {
            packageRadio.checked = true;
        }

        if (formSection) {
            var headerHeight = header ? header.offsetHeight : 80;
            var targetPosition = formSection.getBoundingClientRect().top + window.pageYOffset - headerHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });

            setTimeout(function() {
                var nameInput = document.getElementById('name');
                if (nameInput) {
                    nameInput.focus();
                }
            }, 800);
        }
    });
});

// ==========================================
// Form handling
// ==========================================
if (registrationForm) {
    var packageSelector = document.getElementById('packageSelector');
    var packageError = document.getElementById('packageError');
    var packageInputs = document.querySelectorAll('input[name="package"]');

    // Remove error when package is selected
    packageInputs.forEach(function(input) {
        input.addEventListener('change', function() {
            // Remove red highlight from all packages
            var packageOptions = document.querySelectorAll('.package-option__content');
            packageOptions.forEach(function(option) {
                option.style.borderColor = '';
                option.style.boxShadow = '';
                option.style.background = '';
            });
            // Hide error message
            if (packageError) {
                packageError.style.display = 'none';
            }
        });
    });

    registrationForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Check if package is selected
        var packageSelected = document.querySelector('input[name="package"]:checked');

        if (!packageSelected) {
            // Show error - highlight each package
            var packageOptions = document.querySelectorAll('.package-option__content');
            packageOptions.forEach(function(option) {
                option.style.borderColor = '#ef4444';
                option.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.3)';
                option.style.background = 'rgba(239, 68, 68, 0.05)';
            });

            // Show error message
            if (packageError) {
                packageError.style.display = 'flex';
                packageError.style.alignItems = 'center';
                packageError.style.justifyContent = 'center';
                packageError.style.gap = '10px';
            }

            // Scroll to package selector
            if (packageSelector) {
                packageSelector.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            return;
        }

        var submitBtn = this.querySelector('.btn--submit');
        submitBtn.classList.add('loading');

        var formData = new FormData(this);

        // Відправка на PHP
        fetch('send-form.php', {
            method: 'POST',
            body: formData
        })
        .then(function(response) {
            return response.text();
        })
        .then(function(text) {
            submitBtn.classList.remove('loading');
            console.log('Server response:', text);

            try {
                var data = JSON.parse(text);
                if (data.success) {
                    registrationForm.style.display = 'none';
                    formSuccess.classList.add('active');
                    formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    alert(data.message || 'Помилка при відправці. Спробуйте пізніше.');
                }
            } catch (e) {
                console.error('JSON parse error:', e);
                console.error('Raw response:', text);
                // Якщо є "success" в тексті - все ок
                if (text.indexOf('"success":true') !== -1 || text.indexOf('"success": true') !== -1) {
                    registrationForm.style.display = 'none';
                    formSuccess.classList.add('active');
                    formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    alert('Помилка обробки відповіді сервера.');
                }
            }
        })
        .catch(function(error) {
            submitBtn.classList.remove('loading');
            alert('Помилка з\'єднання. Спробуйте пізніше.');
            console.error('Fetch error:', error);
        });
    });
}

// Phone input mask
var phoneInput = document.getElementById('phone');
if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
        var value = e.target.value.replace(/\D/g, '');

        if (value.startsWith('380')) {
            value = value.substring(3);
        } else if (value.startsWith('0')) {
            value = value.substring(1);
        }

        var formatted = '+380';
        if (value.length > 0) {
            formatted += ' (' + value.substring(0, 2);
        }
        if (value.length >= 2) {
            formatted += ') ' + value.substring(2, 5);
        }
        if (value.length >= 5) {
            formatted += '-' + value.substring(5, 7);
        }
        if (value.length >= 7) {
            formatted += '-' + value.substring(7, 9);
        }

        e.target.value = formatted;
    });
}

// ==========================================
// Smooth scroll for anchor links
// ==========================================
document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
        var href = this.getAttribute('href');
        if (href === '#') return;

        var target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            var headerHeight = header ? header.offsetHeight : 80;
            var targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ==========================================
// Active nav link highlight
// ==========================================
var sections = document.querySelectorAll('section[id]');
var navLinks = document.querySelectorAll('.nav__link');

function highlightNav() {
    var scrollPosition = window.scrollY + 150;

    sections.forEach(function(section) {
        var sectionTop = section.offsetTop;
        var sectionHeight = section.offsetHeight;
        var sectionId = section.getAttribute('id');

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            navLinks.forEach(function(link) {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + sectionId) {
                    link.classList.add('active');
                }
            });
        }
    });
}

window.addEventListener('scroll', highlightNav);

// ==========================================
// AOS-like scroll reveal animations
// ==========================================
var revealElements = document.querySelectorAll('[data-aos]');

var revealObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
        if (entry.isIntersecting) {
            var delay = entry.target.dataset.aosDelay || 0;
            setTimeout(function() {
                entry.target.classList.add('aos-animate');
            }, delay);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

revealElements.forEach(function(element) {
    revealObserver.observe(element);
});

// ==========================================
// Reveal animations for cards
// ==========================================
var animatedElements = document.querySelectorAll('.feature, .ticket, .faq__item, .stats__item');

var elementObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            elementObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

animatedElements.forEach(function(element, index) {
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
    element.style.transition = 'opacity 0.6s ease ' + (index * 0.1) + 's, transform 0.6s ease ' + (index * 0.1) + 's';
    elementObserver.observe(element);
});

// ==========================================
// Parallax effect for hero shapes
// ==========================================
var shapes = document.querySelectorAll('.shape');

window.addEventListener('mousemove', function(e) {
    var mouseX = e.clientX / window.innerWidth - 0.5;
    var mouseY = e.clientY / window.innerHeight - 0.5;

    shapes.forEach(function(shape, index) {
        var speed = (index + 1) * 20;
        var x = mouseX * speed;
        var y = mouseY * speed;
        shape.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
    });
});

// ==========================================
// Magnetic buttons effect
// ==========================================
var magneticButtons = document.querySelectorAll('.btn--glow');

magneticButtons.forEach(function(btn) {
    btn.addEventListener('mousemove', function(e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;

        btn.style.transform = 'translate(' + (x * 0.2) + 'px, ' + (y * 0.2) + 'px) translateY(-3px)';
    });

    btn.addEventListener('mouseleave', function() {
        btn.style.transform = 'translate(0, 0)';
    });
});

// ==========================================
// Price formatting
// ==========================================
document.querySelectorAll('.ticket__amount').forEach(function(el) {
    var value = el.textContent.replace(/\s/g, '');
    el.textContent = value.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
});

// ==========================================
// Particle background
// ==========================================
(function() {
    var particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;

    for (var i = 0; i < 30; i++) {
        var particle = document.createElement('div');
        particle.style.cssText =
            'position: absolute;' +
            'width: ' + (Math.random() * 4 + 1) + 'px;' +
            'height: ' + (Math.random() * 4 + 1) + 'px;' +
            'background: rgba(17, 219, 172, ' + (Math.random() * 0.3 + 0.1) + ');' +
            'border-radius: 50%;' +
            'left: ' + (Math.random() * 100) + '%;' +
            'top: ' + (Math.random() * 100) + '%;' +
            'animation: floatParticle ' + (Math.random() * 10 + 10) + 's linear infinite;' +
            'animation-delay: ' + (Math.random() * 5) + 's;';
        particlesContainer.appendChild(particle);
    }

    var style = document.createElement('style');
    style.textContent = '@keyframes floatParticle { 0%, 100% { transform: translateY(0); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(-100px); opacity: 0; } }';
    document.head.appendChild(style);
})();

// ==========================================
// Hide package selector for speaker/partner forms
// ==========================================
(function() {
    var hidePackageButtons = document.querySelectorAll('[data-hide-package="true"]');
    var packageGroup = document.querySelector('#packageSelector')?.closest('.form-group');
    var formTitle = document.querySelector('.form-section__info .section-title');
    var originalTitle = formTitle ? formTitle.innerHTML : '';

    hidePackageButtons.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            if (packageGroup) {
                packageGroup.style.display = 'none';
            }

            // Update form title based on type
            var formType = btn.getAttribute('data-form-type');
            if (formTitle && formType === 'speaker') {
                formTitle.innerHTML = 'Стати<br><span class="text-gradient-animated">доповідачем</span>';
            } else if (formTitle && formType === 'partner') {
                formTitle.innerHTML = 'Запропонувати<br><span class="text-gradient-animated">партнерство</span>';
            }
        });
    });

    // Show package selector when clicking regular registration buttons
    var regularButtons = document.querySelectorAll('a[href="#form"]:not([data-hide-package])');
    regularButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            if (packageGroup) {
                packageGroup.style.display = '';
            }
            if (formTitle) {
                formTitle.innerHTML = originalTitle;
            }
        });
    });
})();

console.log('Script loaded successfully. Timer should be running.');

// ==========================================
// Style Customizer
// ==========================================
(function() {
    var customizer = document.getElementById('styleCustomizer');
    var toggle = document.getElementById('styleCustomizerToggle');
    var closeBtn = document.getElementById('styleCustomizerClose');
    var overlay = document.getElementById('styleCustomizerOverlay');
    var resetBtn = document.getElementById('resetStyles');
    var exportBtn = document.getElementById('exportStyles');
    var savedIndicator = document.getElementById('savedIndicator');
    var presetBtns = document.querySelectorAll('.preset-btn');
    var colorInputs = document.querySelectorAll('.color-picker-item__input');
    var hexInputs = document.querySelectorAll('.color-picker-item__hex');

    if (!customizer || !toggle) return;

    // Default colors (Navy Blue / Terracotta theme)
    var defaultColors = {
        '--color-bg': '#0a1628',
        '--color-bg-light': '#0d1b2a',
        '--color-text': '#ffffff',
        '--color-text-muted': '#c4a39a',
        '--color-primary': '#a0564a',
        '--color-secondary': '#c27a6a'
    };

    // Theme presets
    var presets = {
        'default': {
            '--color-bg': '#0a1628',
            '--color-bg-light': '#0d1b2a',
            '--color-text': '#ffffff',
            '--color-text-muted': '#c4a39a',
            '--color-primary': '#a0564a',
            '--color-secondary': '#c27a6a'
        },
        'ocean': {
            '--color-bg': '#0a192f',
            '--color-bg-light': '#112240',
            '--color-text': '#e6f1ff',
            '--color-text-muted': '#8892b0',
            '--color-primary': '#64ffda',
            '--color-secondary': '#64ffda'
        },
        'emerald': {
            '--color-bg': '#050505',
            '--color-bg-light': '#0a0a0a',
            '--color-text': '#ffffff',
            '--color-text-muted': '#888888',
            '--color-primary': '#11DBAC',
            '--color-secondary': '#3de8c0'
        },
        'sunset': {
            '--color-bg': '#1a1a2e',
            '--color-bg-light': '#16213e',
            '--color-text': '#ffeaa7',
            '--color-text-muted': '#dfe6e9',
            '--color-primary': '#ff6b6b',
            '--color-secondary': '#ff8e8e'
        },
        'purple': {
            '--color-bg': '#0f0f1a',
            '--color-bg-light': '#1a1a2e',
            '--color-text': '#f3e8ff',
            '--color-text-muted': '#a78bfa',
            '--color-primary': '#a855f7',
            '--color-secondary': '#c084fc'
        },
        'light': {
            '--color-bg': '#f8fafc',
            '--color-bg-light': '#e2e8f0',
            '--color-text': '#1e293b',
            '--color-text-muted': '#64748b',
            '--color-primary': '#8b4a3c',
            '--color-secondary': '#c27a6a'
        }
    };

    var STORAGE_KEY = 'pedagogy2026_custom_styles';

    function openCustomizer() {
        customizer.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeCustomizer() {
        customizer.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    toggle.addEventListener('click', openCustomizer);
    closeBtn.addEventListener('click', closeCustomizer);
    overlay.addEventListener('click', closeCustomizer);

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && customizer.classList.contains('active')) {
            closeCustomizer();
        }
    });

    function applyColor(varName, color) {
        document.documentElement.style.setProperty(varName, color);

        if (varName === '--color-primary' || varName === '--color-secondary') {
            var primary = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || color;
            var secondary = getComputedStyle(document.documentElement).getPropertyValue('--color-secondary').trim() || color;
            document.documentElement.style.setProperty(
                '--color-accent-gradient',
                'linear-gradient(135deg, ' + primary + ' 0%, ' + secondary + ' 100%)'
            );
            document.documentElement.style.setProperty('--color-glow', hexToRgba(primary, 0.5));
            document.documentElement.style.setProperty('--color-border', hexToRgba(primary, 0.3));
            document.documentElement.style.setProperty('--glass-border', hexToRgba(primary, 0.2));
        }
    }

    function applyPreset(presetName) {
        var preset = presets[presetName];
        if (!preset) return;

        Object.keys(preset).forEach(function(varName) {
            applyColor(varName, preset[varName]);
            updateInputs(varName, preset[varName]);
        });

        presetBtns.forEach(function(btn) {
            btn.classList.remove('active');
            if (btn.dataset.preset === presetName) {
                btn.classList.add('active');
            }
        });

        saveToLocalStorage();
        showSavedIndicator();
    }

    function updateInputs(varName, color) {
        colorInputs.forEach(function(input) {
            if (input.dataset.var === varName) {
                input.value = color;
                input.parentElement.style.background = color;
            }
        });
        hexInputs.forEach(function(input) {
            if (input.dataset.var === varName) {
                input.value = color.toUpperCase();
            }
        });
    }

    function saveToLocalStorage() {
        var styles = {};
        var computedStyle = getComputedStyle(document.documentElement);

        Object.keys(defaultColors).forEach(function(varName) {
            var value = computedStyle.getPropertyValue(varName).trim();
            if (value) {
                styles[varName] = value;
            }
        });

        var activePreset = document.querySelector('.preset-btn.active');
        if (activePreset) {
            styles._preset = activePreset.dataset.preset;
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(styles));
    }

    function loadFromLocalStorage() {
        var saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            Object.keys(defaultColors).forEach(function(varName) {
                updateInputs(varName, defaultColors[varName]);
            });
            return;
        }

        try {
            var styles = JSON.parse(saved);

            Object.keys(styles).forEach(function(varName) {
                if (varName.startsWith('--')) {
                    applyColor(varName, styles[varName]);
                    updateInputs(varName, styles[varName]);
                }
            });

            if (styles._preset) {
                presetBtns.forEach(function(btn) {
                    btn.classList.remove('active');
                    if (btn.dataset.preset === styles._preset) {
                        btn.classList.add('active');
                    }
                });
            } else {
                presetBtns.forEach(function(btn) {
                    btn.classList.remove('active');
                });
            }
        } catch (e) {
            console.error('Error loading saved styles:', e);
        }
    }

    function showSavedIndicator() {
        savedIndicator.classList.add('show');
        setTimeout(function() {
            savedIndicator.classList.remove('show');
        }, 2000);
    }

    function hexToRgba(hex, alpha) {
        if (!hex || hex.length < 7) return 'rgba(160, 86, 74, ' + alpha + ')';
        var r = parseInt(hex.slice(1, 3), 16);
        var g = parseInt(hex.slice(3, 5), 16);
        var b = parseInt(hex.slice(5, 7), 16);
        return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
    }

    presetBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            applyPreset(this.dataset.preset);
        });
    });

    colorInputs.forEach(function(input) {
        input.addEventListener('input', function() {
            var varName = this.dataset.var;
            var color = this.value;

            applyColor(varName, color);
            updateInputs(varName, color);

            presetBtns.forEach(function(btn) {
                btn.classList.remove('active');
            });

            saveToLocalStorage();
            showSavedIndicator();
        });
    });

    hexInputs.forEach(function(input) {
        input.addEventListener('input', function() {
            var value = this.value;

            if (value.length > 0 && value[0] !== '#') {
                value = '#' + value;
            }

            if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                var varName = this.dataset.var;
                applyColor(varName, value);
                updateInputs(varName, value);

                presetBtns.forEach(function(btn) {
                    btn.classList.remove('active');
                });

                saveToLocalStorage();
                showSavedIndicator();
            }
        });

        input.addEventListener('blur', function() {
            var value = this.value;
            if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
                var varName = this.dataset.var;
                var current = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
                this.value = current.toUpperCase();
            }
        });
    });

    resetBtn.addEventListener('click', function() {
        if (confirm('Скинути всі налаштування стилю до стандартних?')) {
            applyPreset('default');
            localStorage.removeItem(STORAGE_KEY);
        }
    });

    exportBtn.addEventListener('click', function() {
        var computedStyle = getComputedStyle(document.documentElement);
        var cssText = ':root {\n';

        Object.keys(defaultColors).forEach(function(varName) {
            var value = computedStyle.getPropertyValue(varName).trim();
            cssText += '    ' + varName + ': ' + value + ';\n';
        });

        cssText += '    --color-accent-gradient: ' + computedStyle.getPropertyValue('--color-accent-gradient').trim() + ';\n';
        cssText += '    --color-glow: ' + computedStyle.getPropertyValue('--color-glow').trim() + ';\n';
        cssText += '}';

        navigator.clipboard.writeText(cssText).then(function() {
            alert('CSS скопійовано в буфер обміну!');
        }).catch(function() {
            prompt('Скопіюйте CSS:', cssText);
        });
    });

    loadFromLocalStorage();
    console.log('Style Customizer initialized.');
})();
