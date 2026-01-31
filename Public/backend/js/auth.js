          import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
        import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendEmailVerification, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

        const firebaseConfig = {
            apiKey: "AIzaSyAujjzX5uNYAkMcoWMkaBJ5FtXvkSbSbkk",
            authDomain: "illurdraw.firebaseapp.com",
            projectId: "illurdraw",
            storageBucket: "illurdraw.firebasestorage.app",
            messagingSenderId: "105766754419",
            appId: "1:105766754419:web:2006d15005cf4efc8a7206",
            measurementId: "G-X9VNFR7HEC"
        };

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const provider = new GoogleAuthProvider();

       
       // UI Logic
        window.showScreen = (id) => {
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById(id).classList.add('active');
        };

        const showMsg = (text, type = 'error') => {
            const box = document.getElementById('msg-box');
            box.innerText = text;
            box.className = 'show ' + type;
            setTimeout(() => box.classList.remove('show'), 4000);
        };

        const translateError = (code) => {
            switch(code) {
                // Login Errors
                case 'auth/user-not-found': 
                case 'auth/invalid-credential':
                    return "Oops! That email or password doesn't seem right. Please double-check.";
                case 'auth/wrong-password': 
                    return "That password doesn't match our records. Try again?";
                
                // Signup Errors
                case 'auth/email-already-in-use': 
                    return "This email is already registered! Try signing in instead.";
                case 'auth/invalid-email': 
                    return "That doesn't look like a valid email address.";
                case 'auth/weak-password': 
                    return "Your password is too simple. Please follow the security guide.";
                
                // General
                case 'auth/too-many-requests':
                    return "Too many failed attempts. Please wait a few minutes before trying again.";
                case 'auth/popup-closed-by-user': 
                    return "Sign-in was interrupted. Let's try that again!";
                default: 
                    return "Something went wrong on our end. Please try again in a moment.";
            }
        };

        // Password Validation
        window.validatePassword = (val) => {
            const checks = {
                upper: /[A-Z]/.test(val),
                lower: /[a-z]/.test(val),
                num: /[0-9]/.test(val),
                spec: /[!@#$%^&*(),.?":{}|<>]/.test(val)
            };

            document.getElementById('req-upper').className = checks.upper ? 'req valid' : 'req';
            document.getElementById('req-lower').className = checks.lower ? 'req valid' : 'req';
            document.getElementById('req-num').className = checks.num ? 'req valid' : 'req';
            document.getElementById('req-spec').className = checks.spec ? 'req valid' : 'req';

            document.getElementById('signup-btn').disabled = !(checks.upper && checks.lower && checks.num && checks.spec && val.length >= 8);
        };

        // Auth Observer for verification
        onAuthStateChanged(auth, (user) => {
            if (user) {
                if (user.emailVerified) {
                    window.location.href = "home.html"; // Go to main site
                } else {
                    document.getElementById('user-email-display').innerText = user.email;
                    showScreen('verify-screen');
                }
            }
        });

        // Auth Handlers
        window.handleGoogleAuth = async () => {
            try {
                await signInWithPopup(auth, provider);
                // Google users are usually auto-verified by Google
            } catch (e) {
                showMsg(translateError(e.code));
            }
        };

        window.handleLogin = async () => {
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            const btn = document.getElementById('login-btn');

            if(!email || !pass) return showMsg("Please fill in both your email and password.");

            btn.classList.add('loading');
            try {
                await signInWithEmailAndPassword(auth, email, pass);
            } catch (e) {
                btn.classList.remove('loading');
                showMsg(translateError(e.code));
            }
        };

        window.handleSignup = async () => {
            const email = document.getElementById('signup-email').value;
            const pass = document.getElementById('signup-password').value;
            const btn = document.getElementById('signup-btn');

            btn.classList.add('loading');
            try {
                const cred = await createUserWithEmailAndPassword(auth, email, pass);
                await sendEmailVerification(cred.user);
                showMsg("Verification email sent! Check your inbox.", "success");
            } catch (e) {
                btn.classList.remove('loading');
                showMsg(translateError(e.code));
            }
        };

        window.resendVerification = async () => {
            const user = auth.currentUser;
            if (user) {
                try {
                    await sendEmailVerification(user);
                    showMsg("A fresh link has been sent to your inbox!", "success");
                } catch (e) {
                    showMsg(translateError(e.code));
                }
            }
        };