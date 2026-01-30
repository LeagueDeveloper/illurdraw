        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
        import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

        // Load illustrations from JSON file
        let illustrations = [];

        async function loadIllustrations() {
            try {
                const response = await fetch('../../../backend/js/json/illustrations.json');

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                // Map JSON illustrations to the format expected by the UI
                illustrations = data.illustrations.map((item, index) => ({
                    id: item.id || index + 1,
                    title: item.title,
                    url: item.url, // Use the URL from the JSON file
                    description: item.description,
                    price: item.price || "Free",
                    type: item.tags && item.tags.length > 0 ? item.tags[0] : "2D"
                }));

                render();
            } catch (error) {
                console.error('Error loading illustrations:', error);
                console.error('Make sure the JSON file is accessible at the correct path');
            }
        }

        // Initialize the page
        loadIllustrations();

        let currentItem = null;
        let currentFilter = 'all';

        onAuthStateChanged(auth, (user) => {
            if (user) {
                const name = user.displayName || user.email.split('@')[0];
                document.getElementById('user-name').innerText = name;
                document.getElementById('user-email').innerText = user.email;

                // Use the user's photoURL if available, otherwise show first letter
                if (user.photoURL) {
                    document.getElementById('avatar-btn').innerHTML = `<img src="${user.photoURL}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" alt="User Avatar">`;
                } else {
                    document.getElementById('avatar-btn').innerText = name[0].toUpperCase();
                }
            } else {
                const currentPath = window.location.pathname;
                const dir = currentPath.substring(0, currentPath.lastIndexOf('/'));
                window.location.href = (dir ? dir + '/' : './') + "authPortal.html";
            }
        });

        document.getElementById('logout-btn').onclick = async () => {
            await signOut(auth);
            location.reload();
        };

        const render = (filter = 'all', search = '') => {
            console.log('Render function called with illustrations:', illustrations);
            const grid = document.getElementById('grid');
            const filtered = illustrations.filter(i => {
                const matchesFilter = filter === 'all' || i.type.includes(filter) || i.price === filter;
                const matchesSearch = i.title.toLowerCase().includes(search.toLowerCase());
                return matchesFilter && matchesSearch;
            });

            console.log('Filtered illustrations:', filtered);
            grid.innerHTML = filtered.map(i => `
                <div class="card" onclick="openModal(${i.id})">
                    <div class="card-img-container">
                        <img src="${i.url}" class="card-img" loading="lazy">
                    </div>
                    <div class="card-body">
                        <span class="card-title">${i.title}</span>
                        <div class="card-meta">
                            <span style="font-size: 0.7rem; color: var(--text-muted)">${i.type}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        };

        // Grid Switching
        document.querySelectorAll('.grid-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.grid-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const cols = btn.dataset.cols;
                document.body.style.setProperty('--grid-cols', cols);
            };
        });

        // Filter Toggle (Mobile)
        document.getElementById('filter-toggle').onclick = () => {
            document.getElementById('sidebar').classList.toggle('show');
        };

        // Sidebar Filter click
        document.querySelectorAll('.filter-item').forEach(item => {
            item.onclick = () => {
                document.querySelectorAll('.filter-item').forEach(b => b.classList.remove('active'));
                item.classList.add('active');
                currentFilter = item.dataset.filter || 'all';
                render(currentFilter, document.getElementById('search-input').value);
                if(window.innerWidth <= 1000) document.getElementById('sidebar').classList.remove('show');
            };
        });

        document.getElementById('search-input').oninput = (e) => render(currentFilter, e.target.value);

        window.openModal = (id) => {
            currentItem = illustrations.find(i => i.id === id);
            document.getElementById('m-img').src = currentItem.url;
            document.getElementById('m-title').innerText = currentItem.title;
            document.getElementById('m-desc').innerText = currentItem.description;
            document.getElementById('m-type').innerText = currentItem.type;
            document.getElementById('embed-code').innerHTML = `<span class="code-tag">&lt;img</span> <span class="code-attr">src</span>=<span class="code-string">"${currentItem.url}"</span> <span class="code-attr">alt</span>=<span class="code-string">"${currentItem.title}"</span> <span class="code-tag">/&gt;</span>`;

            // Generate CDN URL - this would be the actual CDN endpoint in production
            const cdnUrl = `https://cdn.illurdraw.com/icons/${currentItem.title.toLowerCase().replace(/\s+/g, '-')}.svg`;
            document.getElementById('cdn-url').innerHTML = `<span class="code-string">${cdnUrl}</span>`;

            // Generate CSS class usage - this shows how to use the icon with CSS classes
            document.getElementById('modal-overlay').classList.add('active');
        };

        window.copyCode = () => {
            const code = document.getElementById('embed-code').innerText;
            navigator.clipboard.writeText(code);
            const btn = document.querySelector('.copy-btn');
            btn.innerText = 'Copied!';
            setTimeout(() => btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy', 2000);
        };

        window.copyCdnUrl = () => {
            const cdnUrl = document.getElementById('cdn-url').innerText;
            navigator.clipboard.writeText(cdnUrl);
            const btn = document.querySelectorAll('.copy-btn')[1]; // Second copy button
            btn.innerText = 'Copied!';
            setTimeout(() => btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy', 2000);
        };

        window.copyCssClass = () => {
            const cssClass = document.getElementById('css-class').innerText;
            navigator.clipboard.writeText(cssClass);
            const btn = document.querySelectorAll('.copy-btn')[2]; // Third copy button
            btn.innerText = 'Copied!';
            setTimeout(() => btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy', 2000);
        };

        document.getElementById('close-modal').onclick = () => document.getElementById('modal-overlay').classList.remove('active');
        
        // Fixed User Dropdown Logic
        document.getElementById('avatar-btn').onclick = (e) => { 
            e.stopPropagation(); 
            document.getElementById('user-popup').classList.toggle('active'); 
        };
        document.addEventListener('click', () => {
            document.getElementById('user-popup').classList.remove('active');
        });

        render();