        // Smooth Nav Morphing
        const nav = document.getElementById('main-nav');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 40) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        });

        // Search Logic - Updated for Shorter Bar
        const searchContainer = document.getElementById('search-container');
        const navLinks = document.getElementById('nav-links');

        function toggleSearch() {
            searchContainer.classList.toggle('active');

            // Only fade links on small desktops when search is open
            if (window.innerWidth < 1200 && searchContainer.classList.contains('active')) {
                navLinks.classList.add('faded');
            } else {
                navLinks.classList.remove('faded');
            }

            if(searchContainer.classList.contains('active')) {
                searchContainer.querySelector('input').focus();
            }
        }

        // Nav Toggle for Mobile - toggles the nav-links visibility
        const navToggle = document.getElementById('nav-toggle');

        navToggle.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent event bubbling
            navLinks.classList.toggle('active');
        });

        // Close nav links when clicking outside
        document.addEventListener('click', function(event) {
            if (!nav.contains(event.target) && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
            }
        });

        // Handle dropdown menus on mobile
        const dropdownTriggers = document.querySelectorAll('.dropdown-trigger');
        dropdownTriggers.forEach(trigger => {
            trigger.addEventListener('click', function(e) {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    const dropdown = this.closest('.dropdown');
                    dropdown.classList.toggle('active');
                }
            });
        });

        // Illustration Populating
        const assets = [
            { title: "Icons", desc: "Simple icons", tag: "2D", img: "../../Public/hero/icons.png", href: "../../public/p/cmsoon.html" },
            { title: "Animated illustrations", desc: "Animated illustrations", tag:"2D", img: "../../Public/hero/animated.png", href: "../../public/p/cmsoon.html" },
            { title: "UIkit", desc: "Developer ui components", tag: "Code,2D", img: "../../Public/hero/uikit.png", href: "#" },
            { title: "3D library", desc: "3D models and scenes", tag: "3D", img: "../../Public/hero/3d.png", href: "../../public/p/cmsoon.html" },
            { title: "2D Library", desc: "2D illustrations and assets", tag: "2D", img: "../../Public/hero/2d.png", href: "#" },
            { title: "People", desc: "Illustrations, images & more", tag: "2D,People", img: "../../Public/hero/people.png", href: "#" },
            { title: "Mockups", desc: "Mockup products", tag: "2D, Mockups", img: "../../Public/hero/mockups.png", href: "#" },
            { title: "Logos", desc: "Minimilist,sleek logos", tag: "2D, Logos", img: "../../Public/hero/logos.png", href: "#" }
        ];

        const grid = document.getElementById('main-grid');

        assets.forEach((asset, idx) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-preview" style="background: url('${asset.img}'); background-size: contain; background-repeat: no-repeat; background-position: center; position: relative;">
                    <span style="position: absolute; top: 20px; right: 20px; background: lightblue; padding: 6px 14px; border-radius: 50px; font-weight: 800; font-size: 0.75rem;">${asset.tag}</span>
                    <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="${asset.color === '#f8fafc' ? '#0f4c75' : asset.color}" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        <path d="M2 12h20" />
                    </svg>
                </div>
                <h3>${asset.title}</h3>
                <p style="opacity: 0.5; font-size: 0.9rem;">${asset.desc}</p>
                <a href="${asset.href}" class="btn-card" style = "cursor: pointer; position: absolute; bottom: 20px; right: 50px; color: #0f4c75; text-decoration: none;">Explore <i class="fa fa-light fa-arrow-right"></i></a>
            `;
            grid.appendChild(card);
        });

        // Intersection Observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((e, i) => {
                if (e.isIntersecting) {
                    setTimeout(() => e.target.classList.add('reveal'), (i % 3) * 150);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.card').forEach(c => observer.observe(c));

        // Add favicon to the page
        function addFavicon() {
            // Check if favicon already exists
            const existingFavicon = document.querySelector('link[rel="icon"]');
            if (existingFavicon) {
                return; // Favicon already exists
            }

            // Create new favicon link element
            const favicon = document.createElement('link');
            favicon.rel = 'icon';
            favicon.type = 'image/x-icon';
            favicon.href = '../Public/logo&favicon/favicon2.0.ico';

            // Add to the head of the document
            document.head.appendChild(favicon);
        }

        // Add favicon when DOM is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', addFavicon);
        } else {
            addFavicon();
        }
