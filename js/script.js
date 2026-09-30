/* =========================================================
   BRIGITTE MORTA — PORTFOLIO JAVASCRIPT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const root = document.documentElement;
    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    const navLinks = document.querySelectorAll(".nav-link");
    const sections = document.querySelectorAll("main section[id]");
    const contactForm = document.getElementById("contactForm");

    /* ---------------------------------------------------------
       THEME
       Dark mode is the default.
    --------------------------------------------------------- */

    const savedTheme = localStorage.getItem("portfolio-theme");

    if (savedTheme === "light") {
        setTheme("light");
    } else {
        setTheme("dark");
    }

    function setTheme(theme) {
        root.setAttribute("data-theme", theme);

        const isLight = theme === "light";

        if (themeIcon) {
            themeIcon.className = isLight
                ? "bi bi-moon-fill"
                : "bi bi-sun-fill";
        }

        if (themeToggle) {
            const label = isLight
                ? "Switch to dark mode"
                : "Switch to light mode";

            themeToggle.setAttribute("aria-label", label);
            themeToggle.setAttribute("title", label);
        }

        if (metaTheme) {
            metaTheme.setAttribute(
                "content",
                isLight ? "#f7f9fc" : "#080b1a"
            );
        }
    }

    themeToggle?.addEventListener("click", () => {
        const current = root.getAttribute("data-theme");
        const next = current === "dark" ? "light" : "dark";

        setTheme(next);
        localStorage.setItem("portfolio-theme", next);
    });

    /* ---------------------------------------------------------
       SCROLL REVEAL
    --------------------------------------------------------- */

    const revealItems = document.querySelectorAll(".reveal");

    if ("IntersectionObserver" in window) {
        const revealObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.12,
                rootMargin: "0px 0px -40px 0px"
            }
        );

        revealItems.forEach((item) => revealObserver.observe(item));
    } else {
        revealItems.forEach((item) => item.classList.add("is-visible"));
    }

    /* ---------------------------------------------------------
       MOUSE HOVER GLOW
       Adds a subtle pointer-responsive highlight to cards.
    --------------------------------------------------------- */

    const interactiveCards = document.querySelectorAll(
        ".stack-card, .mini-card, .project-feature, .contact-form"
    );

    interactiveCards.forEach((card) => {
        card.addEventListener("pointermove", (event) => {
            const rect = card.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            card.style.setProperty("--mouse-x", `${x}px`);
            card.style.setProperty("--mouse-y", `${y}px`);
        });

        card.addEventListener("pointerleave", () => {
            card.style.removeProperty("--mouse-x");
            card.style.removeProperty("--mouse-y");
        });
    });

    /* ---------------------------------------------------------
       ACTIVE NAVIGATION
    --------------------------------------------------------- */

    const sectionObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                navLinks.forEach((link) => {
                    link.classList.remove("active");

                    if (link.getAttribute("href") === `#${entry.target.id}`) {
                        link.classList.add("active");
                    }
                });
            });
        },
        {
            rootMargin: "-35% 0px -55% 0px",
            threshold: 0
        }
    );

    sections.forEach((section) => sectionObserver.observe(section));

    /* ---------------------------------------------------------
       CLOSE MOBILE NAV AFTER CLICK
    --------------------------------------------------------- */

    navLinks.forEach((link) => {
        link.addEventListener("click", () => {
            const navigation = document.getElementById("mainNavigation");

            if (
                navigation &&
                navigation.classList.contains("show") &&
                window.bootstrap
            ) {
                const collapse = bootstrap.Collapse.getInstance(navigation)
                    || new bootstrap.Collapse(navigation, { toggle: false });

                collapse.hide();
            }
        });
    });

    /* ---------------------------------------------------------
       PROJECT PREVIEW MODAL
       Clicking the project card opens the full project image.
       Links inside the card remain normal links.
    --------------------------------------------------------- */

    const projectCards = document.querySelectorAll(".project-clickable");

    if (projectCards.length && window.bootstrap) {
        projectCards.forEach((projectCard) => {
            const modalId = projectCard.getAttribute("data-project-modal");
            const projectModalElement = modalId
                ? document.getElementById(modalId)
                : null;

            if (!projectModalElement) return;

            const projectModal = new bootstrap.Modal(projectModalElement);

            const openProjectModal = () => projectModal.show();

            projectCard.addEventListener("click", (event) => {
                if (event.target.closest("a, button, input, textarea, select")) return;
                openProjectModal();
            });

            projectCard.addEventListener("keydown", (event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                if (event.target !== projectCard) return;

                event.preventDefault();
                openProjectModal();
            });
        });
    }

    /* ---------------------------------------------------------
       CONTACT FORM
       Front-end only for now. Directs the user to email.
    --------------------------------------------------------- */

    contactForm?.addEventListener("submit", (event) => {
        event.preventDefault();

        const name = document.getElementById("name")?.value.trim();
        const email = document.getElementById("email")?.value.trim();
        const message = document.getElementById("message")?.value.trim();

        if (!name || !email || !message) return;

        const subject = encodeURIComponent(
            `Portfolio inquiry from ${name}`
        );

        const body = encodeURIComponent(
            `Name: ${name}\nEmail: ${email}\n\n${message}`
        );

        window.location.href =
            `mailto:brigittemorta@gmail.com?subject=${subject}&body=${body}`;
    });

    /* ---------------------------------------------------------
       TECH ICON DRAGGING
       Moves only the selected technology card (icon + label) and
       constrains it to its own technical-stack grid. Positions reset
       on refresh.
    --------------------------------------------------------- */

    const draggableTechIcons = document.querySelectorAll(".tech-icon");

    draggableTechIcons.forEach((icon) => {
        let dragState = null;

        const getOffset = (axis) =>
            Number.parseFloat(icon.dataset[`drag${axis}`] || "0");

        const setOffset = (x, y) => {
            icon.dataset.dragX = String(x);
            icon.dataset.dragY = String(y);
            icon.style.transform = `translate(${x}px, ${y}px)`;
        };

        const finishDrag = (event) => {
            if (!dragState) return;

            if (icon.hasPointerCapture?.(event.pointerId)) {
                icon.releasePointerCapture(event.pointerId);
            }

            dragState = null;
            icon.classList.remove("is-dragging");
        };

        icon.addEventListener("pointerdown", (event) => {
            if (event.button !== 0) return;

            const container = icon.closest(".tech-icon-grid");
            if (!container) return;

            const iconRect = icon.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            dragState = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                startOffsetX: getOffset("X"),
                startOffsetY: getOffset("Y"),
                minDeltaX: containerRect.left - iconRect.left,
                maxDeltaX: containerRect.right - iconRect.right,
                minDeltaY: containerRect.top - iconRect.top,
                maxDeltaY: containerRect.bottom - iconRect.bottom,
            };

            icon.setPointerCapture?.(event.pointerId);
            icon.classList.add("is-dragging");
            event.preventDefault();
        });

        icon.addEventListener("pointermove", (event) => {
            if (!dragState || event.pointerId !== dragState.pointerId) return;

            const rawDeltaX = event.clientX - dragState.startX;
            const rawDeltaY = event.clientY - dragState.startY;
            const deltaX = Math.min(
                dragState.maxDeltaX,
                Math.max(dragState.minDeltaX, rawDeltaX)
            );
            const deltaY = Math.min(
                dragState.maxDeltaY,
                Math.max(dragState.minDeltaY, rawDeltaY)
            );

            setOffset(
                dragState.startOffsetX + deltaX,
                dragState.startOffsetY + deltaY
            );
        });

        icon.addEventListener("pointerup", finishDrag);
        icon.addEventListener("pointercancel", finishDrag);
    });


    /* ---------------------------------------------------------
       SCROLL PROGRESS
       Visual-only enhancement; existing navigation/functionality
       remains unchanged.
    --------------------------------------------------------- */

    const updateScrollProgress = () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollableHeight =
            document.documentElement.scrollHeight - window.innerHeight;

        const progress = scrollableHeight > 0
            ? Math.min(1, Math.max(0, scrollTop / scrollableHeight))
            : 0;

        root.style.setProperty("--scroll-progress", progress.toFixed(4));
    };

    updateScrollProgress();
    window.addEventListener("scroll", updateScrollProgress, { passive: true });

});

