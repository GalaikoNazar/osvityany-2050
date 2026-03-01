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

console.log('Script loaded successfully. Timer should be running.');
