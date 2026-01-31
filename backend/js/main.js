        // Firebase Auth Setup
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
        import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

        // Utility function to normalize image URLs
        window.normalizeImageUrl = function(url) {
            if (!url) return '';
            // If already starts with /Public/, return as-is
            if (url.startsWith('/Public/')) return url;
            // Convert relative paths to /Public/
            return url.replace(/^\.\.\//, '/Public/').replace(/^\.\//, '/Public/');
        };

        const firebaseConfig = {
            apiKey: "AIzaSyAujjzX5uNYAkMcoWMkaBJ5FtXvkSbSbkk",
            authDomain: "illurdraw.firebaseapp.com",
            projectId: "illurdraw",
            storageBucket: "illurdraw.firebasestorage.app",
            messagingSenderId: "105766754419",
            appId: "1:105766754419:web:2006d15005cf4efc8a7206"
        };

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);

        // Auth State Listener
        onAuthStateChanged(auth, (user) => {
            const getStartedBtn = document.getElementById('get-started-btn');
            const userMenu = document.getElementById('user-menu');

            if (user) {
                // User is signed in
                getStartedBtn.style.display = 'none';
                userMenu.style.display = 'flex';

                // Update user info
                const name = user.displayName || user.email.split('@')[0];
                document.getElementById('user-name-nav').innerText = name;
                document.getElementById('user-email-nav').innerText = user.email;

                // Update avatar
                if (user.photoURL) {
                    document.getElementById('user-avatar-btn').innerHTML = `<img src="${user.photoURL}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" alt="User Avatar">`;
                } else {
                    document.getElementById('user-avatar-btn').innerText = name[0].toUpperCase();
                }
            } else {
                // User is signed out
                getStartedBtn.style.display = 'block';
                userMenu.style.display = 'none';
            }
        });

        // Logout Handler
        document.getElementById('logout-btn-nav').addEventListener('click', async () => {
            await signOut(auth);
            location.reload();
        });

        // User Avatar Dropdown Toggle
        document.getElementById('user-avatar-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('user-dropdown').classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            document.getElementById('user-dropdown').classList.remove('active');
        });

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
        let illustrations = [];

        // Load illustrations from JSON for search
        async function loadIllustrations() {
            try {
                const response = await fetch('./backend/js/json/illustrations.json');
                if (response.ok) {
                    const data = await response.json();
                    illustrations = data.illustrations || [];
                    console.log('Illustrations loaded:', illustrations.length);
                }
            } catch (error) {
                console.error('Error loading illustrations:', error);
            }
        }
        loadIllustrations();

        window.toggleSearch = function() {
            searchContainer.classList.toggle('active');

            // Only fade links on small desktops when search is open
            if (window.innerWidth < 1200 && searchContainer.classList.contains('active')) {
                navLinks.classList.add('faded');
            } else {
                navLinks.classList.remove('faded');
            }

            if(searchContainer.classList.contains('active')) {
                const input = document.getElementById('home-search-input');
                if (input) {
                    input.focus();
                    input.oninput = (e) => renderHomeSearchResults(e.target.value);
                }
            }
        };

        function renderHomeSearchResults(query) {
            const resultsBox = document.getElementById('search-results');
            if (!resultsBox) return;
            
            if (!query || !query.trim()) { 
                resultsBox.style.display = 'none';
                resultsBox.innerHTML = '';
                return;
            }
            
            const q = query.toLowerCase();
            const matches = illustrations.filter(i => 
                i.title.toLowerCase().includes(q) || 
                (i.tags && i.tags.some(t => t.toLowerCase().includes(q)))
            ).slice(0, 6);
            
            if (matches.length === 0) {
                resultsBox.style.display = 'none';
                return;
            }
            
            resultsBox.innerHTML = matches.map(i => `
                <div class="search-result-item" onclick="navigateToIllustration(${i.id});">
                    <img class="result-thumb" src="${normalizeImageUrl(i.url)}" alt="${i.title}" onerror="this.src='/Public/categiories/people/5-people-hugging.png'">
                    <div class="result-meta">
                        <div class="result-title">${i.title}</div>
                        <div class="result-sub">${(i.tags && i.tags.join(', ')) || 'Asset'}</div>
                    </div>
                </div>
            `).join('');
            resultsBox.style.display = 'block';
        }

        window.navigateToIllustration = function(id) {
            window.location.href = `p/home.html?illId=${id}`;
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
