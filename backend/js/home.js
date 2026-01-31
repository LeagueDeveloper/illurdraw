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

        // Load illustrations from JSON file
        let illustrations = [];

        async function loadIllustrations() {
            try {
                const response = await fetch('../../backend/js/json/illustrations.json');

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
                    type: item.tags && item.tags.length > 0 ? item.tags[0] : "2D",
                    tags: item.tags || [],
                    // Support both correct and misspelled keys from JSON (customizable / costomizable)
                    customizable: (item.customizable !== undefined) ? item.customizable : ((item.costomizable !== undefined) ? item.costomizable : false)
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

        // Check for illustration ID in URL query params to auto-open modal
        const urlParams = new URLSearchParams(window.location.search);
        const autoOpenId = urlParams.get('illId');

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

                // Auto-open illustration modal if illId param exists
                if (autoOpenId) {
                    setTimeout(() => openModal(parseInt(autoOpenId)), 500);
                    // Clean URL
                    window.history.replaceState({}, document.title, window.location.pathname);
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
                // Filter by tags (case-insensitive) or by 'all'
                const matchesFilter = filter === 'all' || (i.tags && i.tags.some(t => t.toLowerCase() === filter.toLowerCase()));
                // Search by title (case-insensitive) or show all if no search
                const matchesSearch = !search || i.title.toLowerCase().includes(search.toLowerCase());
                return matchesFilter && matchesSearch;
            });

            console.log('Filtered illustrations:', filtered);
            grid.innerHTML = filtered.map(i => `
                <div class="card" onclick="openModal(${i.id})">
                    <div class="card-img-container">
                        <img src="${normalizeImageUrl(i.url)}" class="card-img" loading="lazy" onerror="this.src='/Public/categiories/people/5-people-hugging.png'">
                    </div>
                    <div class="card-body">
                        <span class="card-title">${i.title}</span>
                        <div class="card-meta">
                            <span style="font-size: 0.7rem; color: var(--text-muted)">${i.type}</span>
                            ${i.customizable ? `<span class="price-tag customizable">Customizable</span>` : ''}
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
        document.querySelectorAll('.filter-item[data-filter]').forEach(item => {
            item.onclick = () => {
                // Only toggle active state for category filters (not bg)
                if(!item.dataset.filterType){
                    document.querySelectorAll('.filter-item[data-filter]').forEach(b => b.classList.remove('active'));
                    item.classList.add('active');
                    currentFilter = item.dataset.filter || 'all';
                }
                render(currentFilter, document.getElementById('search-input').value);
                if(window.innerWidth <= 1000) document.getElementById('sidebar').classList.remove('show');
            };
        });

        document.getElementById('search-input').oninput = (e) => {
            const q = e.target.value;
            render(currentFilter, q);
            renderSuggestions(q);
        };

        function renderSuggestions(query) {
            const box = document.getElementById('search-suggestions');
            if (!box) return;
            if (!query || !query.trim()) { box.style.display = 'none'; box.innerHTML = ''; return; }
            const q = query.toLowerCase();
            const matches = illustrations.filter(i => i.title.toLowerCase().includes(q)).slice(0, 6);
            box.innerHTML = matches.map(i => `
                <div class="suggestion-item" onclick="event.stopPropagation(); document.getElementById('search-suggestions').style.display='none'; openModal(${i.id});">
                    <img class="suggestion-thumb" src="${normalizeImageUrl(i.url)}" alt="${i.title}">
                    <div class="suggestion-meta">
                        <div class="suggestion-title">${i.title}</div>
                        <div class="suggestion-sub">${i.type}</div>
                    </div>
                </div>
            `).join('');
            box.style.display = matches.length ? 'block' : 'none';
        }

        window.openModal = (id) => {
            currentItem = illustrations.find(i => i.id === id);
            if (!currentItem) {
                console.error('Item not found:', id);
                return;
            }
            // show loader overlay inside modal
            showModalLoader();
            const mImg = document.getElementById('m-img');
            mImg.onload = () => { hideModalLoader(); };
            mImg.onerror = () => { hideModalLoader(); };
            mImg.src = normalizeImageUrl(currentItem.url);
            document.getElementById('m-title').innerText = currentItem.title;
            document.getElementById('m-desc').innerText = currentItem.description;
            document.getElementById('m-type').innerText = currentItem.type + (currentItem.customizable ? ' • Customizable' : '');
            document.getElementById('embed-code').innerHTML = `<span class="code-tag">&lt;img</span> <span class="code-attr">src</span>=<span class="code-string">"${currentItem.url}"</span> <span class="code-attr">alt</span>=<span class="code-string">"${currentItem.title}"</span> <span class="code-tag">/&gt;</span>`;

            // Generate CDN URL - this would be the actual CDN endpoint in production
            const cdnUrl = `https://cdn.illurdraw.com/icons/${currentItem.title.toLowerCase().replace(/\s+/g, '-')}.svg`;
            document.getElementById('cdn-url').innerHTML = `<span class="code-string">${cdnUrl}</span>`;

            // Toggle customize button availability based on `customizable` flag and wire to editor
            const customizeBtn = document.getElementById('customize-btn');
            const customizeInfo = document.getElementById('customize-info');
            if (customizeBtn) {
                if (currentItem.customizable) {
                    customizeBtn.disabled = false;
                    customizeBtn.classList.remove('disabled');
                    customizeBtn.style.opacity = '1';
                    customizeBtn.style.cursor = 'pointer';
                    customizeBtn.onclick = () => {
                        window.location.href = `/Public/costomization/customize.html?illId=${currentItem.id}`;
                    };
                    if (customizeInfo) customizeInfo.style.display = 'none';
                } else {
                    customizeBtn.disabled = true;
                    customizeBtn.classList.add('disabled');
                    customizeBtn.style.opacity = '0.5';
                    customizeBtn.style.cursor = 'not-allowed';
                    customizeBtn.onclick = (e) => { e.preventDefault(); };
                    if (customizeInfo) {
                        customizeInfo.style.display = 'inline-flex';
                        customizeInfo.onclick = () => {
                            alert('This asset is not customizable. Some assets in the library are read-only and cannot be edited.');
                        };
                    }
                }
            }
            // Wire download button to fetch and save the current asset
            const downloadBtn = document.getElementById('download-btn');
            if (downloadBtn) {
                downloadBtn.onclick = async (e) => {
                    e.stopPropagation();
                    if (!currentItem || !currentItem.url) return;
                    const src = normalizeImageUrl(currentItem.url);
                    try {
                        const res = await fetch(src);
                        if (!res.ok) throw new Error('Network response was not ok');
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const extMatch = (src.split('?')[0].match(/\.([a-zA-Z0-9]+)$/) || []);
                        const ext = extMatch[1] || (blob.type === 'image/svg+xml' ? 'svg' : 'png');
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${(currentItem.title || 'asset').replace(/\s+/g, '-')}.${ext}`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        URL.revokeObjectURL(url);
                    } catch (err) {
                        alert('Failed to download asset.');
                    }
                };
            }

            // Wire any edit button (if present) to the editor as well
            const editBtn = document.getElementById('edit-btn');
            if (editBtn) {
                editBtn.onclick = () => { window.location.href = `/Public/costomization/customize.html?illId=${currentItem.id}`; };
            }

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
        
        // Modal loader: pulsing logo while image loads
        function showModalLoader(){
            let loader = document.getElementById('modal-loader');
            if(!loader){
                loader = document.createElement('div');
                loader.id = 'modal-loader';
                loader.style.position = 'absolute';
                loader.style.left = 0; loader.style.top = 0; loader.style.right = 0; loader.style.bottom = 0;
                loader.style.display = 'flex'; loader.style.alignItems = 'center'; loader.style.justifyContent = 'center';
                loader.style.background = 'rgba(255,255,255,0.85)'; loader.style.zIndex = 2200; loader.style.pointerEvents = 'auto';
                loader.innerHTML = `<div class="pulse-wrap"><img src="/Public/logo&favicon/logo192.png" alt="logo"/></div>`;
                const wrap = document.getElementById('modal-overlay');
                if(wrap) wrap.appendChild(loader);
                const s = document.createElement('style');
                s.id = 'modal-loader-style';
                s.innerHTML = `#modal-loader .pulse-wrap img{width:56px;height:56px;animation:logo-pulse 1.2s ease-in-out infinite}@keyframes logo-pulse{0%{transform:scale(0.9);opacity:0.75}50%{transform:scale(1.08);opacity:1}100%{transform:scale(0.9);opacity:0.75}}`;
                document.head.appendChild(s);
            } else {
                loader.style.display = 'flex';
            }
        }

        function hideModalLoader(){
            const loader = document.getElementById('modal-loader');
            if(loader) loader.style.display = 'none';
        }
        
        // Sponsor / Support Us: 30-minute hide with localStorage
        function initSponsorLogic(){
            const sponsorSection = document.getElementById('sponsor-section');
            const closeBtn = document.getElementById('sponsor-close-btn');
            const STORAGE_KEY = 'sponsor-hidden-until';
            const HIDE_DURATION = 30 * 60 * 1000; // 30 minutes in ms
            
            function checkAndHideSponsor(){
                const hiddenUntil = localStorage.getItem(STORAGE_KEY);
                if(hiddenUntil && Date.now() < parseInt(hiddenUntil)){
                    sponsorSection.classList.add('hidden');
                } else {
                    sponsorSection.classList.remove('hidden');
                    localStorage.removeItem(STORAGE_KEY);
                }
            }
            
            if(closeBtn){
                closeBtn.onclick = (e) => {
                    e.preventDefault();
                    const hideUntil = Date.now() + HIDE_DURATION;
                    localStorage.setItem(STORAGE_KEY, hideUntil.toString());
                    sponsorSection.classList.add('hidden');
                };
            }
            
            checkAndHideSponsor();
        }
        
        initSponsorLogic();
        
        // Fixed User Dropdown Logic
        document.getElementById('avatar-btn').onclick = (e) => { 
            e.stopPropagation(); 
            document.getElementById('user-popup').classList.toggle('active'); 
        };
        document.addEventListener('click', () => {
            document.getElementById('user-popup').classList.remove('active');
            const ss = document.getElementById('search-suggestions');
            if (ss) ss.style.display = 'none';
        });

        render();