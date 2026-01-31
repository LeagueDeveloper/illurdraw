        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, onAuthStateChanged, updateProfile, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

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
        
        // Expanded DiceBear Seeds for the Picker
        const seeds = [
            "Felix", "Aria", "Leo", "Maya", "Zoe", "Jasper", "Luna", "Kai", "Sasha", "Finn",
            "Nova", "Remi", "Eli", "Ava", "Noah", "Ivy", "Ezra", "Eve", "Ash", "Quinn",
            "Rowan", "Sage", "Phoenix", "River", "Sky", "Storm", "Blaze", "Coral", "Dawn",
            "Ember", "Frost", "Gale", "Haze", "Indigo", "Jolt", "Kestrel", "Lumen", "Mist",
            "Nebula", "Orion", "Pulse", "Quasar", "Ripple", "Solar", "Terra", "Vega", "Wisp",
            "Xylem", "Yara", "Zephyr","Aeron", "Briar", "Cinder", "Drift", "Emberly", "Flint", "Glint",
            "Hollow", "Isle", "Jinx", "Kairo", "Lyric", "Mistral", "Nixie", "Onyx", "Peregrine", "Quill",
            "Rune", "Sylph", "Talon", "Umbra", "Vortex", "Wren", "Xenon", "Yonder", "Zinnia"
        ];
        let tempAvatar = "";

        const toast = document.getElementById('toast');
        const showToast = (msg) => {
            toast.querySelector('span').innerText = msg;
            toast.classList.add('active');
            setTimeout(() => toast.classList.remove('active'), 3000);
        };

        onAuthStateChanged(auth, (user) => {
            if (user) {
                document.getElementById('field-email').value = user.email;
                document.getElementById('field-name').value = user.displayName || "";
                // Fixed DiceBear URL logic with proper parameters for gradient avatars
                const photo = user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.email.split('@')[0])}&backgroundColor=b6e3f4&size=100`;
                document.getElementById('header-avatar-img').src = photo;
                document.getElementById('display-avatar-img').src = photo;
            }
        });

        // Modal Controls
        const toggleModal = (id, show) => {
            document.getElementById(id).classList.toggle('active', show);
        };

        document.getElementById('btn-open-picker').onclick = () => {
            const grid = document.getElementById('picker-grid');
            grid.innerHTML = seeds.map(s => {
                const url = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(s)}&backgroundColor=b6e3f4&size=100`;
                return `<div class="picker-item" data-url="${url}"><img src="${url}"></div>`;
            }).join('');

            // Add click events to new items
            grid.querySelectorAll('.picker-item').forEach(item => {
                item.onclick = function() {
                    tempAvatar = this.dataset.url;
                    grid.querySelectorAll('.picker-item').forEach(i => i.classList.remove('selected'));
                    this.classList.add('selected');
                };
            });
            
            toggleModal('modal-avatar', true);
        };

        document.getElementById('btn-confirm-avatar').onclick = async () => {
            if (!tempAvatar) return;
            const user = auth.currentUser;
            try {
                await updateProfile(user, { photoURL: tempAvatar });
                document.getElementById('header-avatar-img').src = tempAvatar;
                document.getElementById('display-avatar-img').src = tempAvatar;
                toggleModal('modal-avatar', false);
                showToast("Profile identity updated.");
            } catch (e) { alert(e.message); }
        };

        document.getElementById('btn-save-profile').onclick = async () => {
            const user = auth.currentUser;
            const newName = document.getElementById('field-name').value;
            try {
                await updateProfile(user, { displayName: newName });
                showToast("Public profile updated.");
            } catch (e) { alert(e.message); }
        };

        document.getElementById('btn-open-delete').onclick = () => toggleModal('modal-delete', true);
        document.getElementById('btn-close-delete').onclick = () => toggleModal('modal-delete', false);
        document.getElementById('btn-close-picker').onclick = () => toggleModal('modal-avatar', false);

        document.getElementById('btn-final-delete').onclick = async () => {
            const user = auth.currentUser;
            const email = document.getElementById('del-verify-email').value;
            const pass = document.getElementById('del-verify-pass').value;

            if (email !== user.email) return alert("Email does not match current account.");
            
            try {
                const cred = EmailAuthProvider.credential(user.email, pass);
                await reauthenticateWithCredential(user, cred);
                await deleteUser(user);
                window.location.reload();
            } catch (e) { alert("Security check failed: " + e.message); }
        };  