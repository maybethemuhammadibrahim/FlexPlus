(function initLogin() {
  const currentPath = window.location.pathname.toLowerCase();
  if (!currentPath.includes("login") && window.location.pathname !== "/") {
    console.log("not a login page, exiting. Path was:", currentPath);
    return;
  }

  try {
    console.log("login script loaded");

    // Grab existing form fields before we nuke the DOM
    const usernameInput = document.querySelector('input[name="username"]');
    const passwordInput = document.querySelector('input[name="password"]');
    const rememberInput = document.querySelector('input[name="remember"]');
    const recaptchaEl   = document.querySelector(".g-recaptcha");
    const formAction    = document.querySelector("#frmlogin")?.action || "/Login/login";

    const savedUser    = usernameInput?.value || "";
    const savedPass    = passwordInput?.value || "";
    const savedRemember = rememberInput?.checked || false;

    // Clone recaptcha — Google needs the original DOM node to stay alive
    const recaptchaClone = recaptchaEl ? recaptchaEl.cloneNode(true) : null;

    const loginHTML = `
      <div class="fl-login-wrapper">
        <div class="fl-login-card">

          <!-- <div class="fl-login-brand">
            <img src="/Assets/demo/demo3/media/img/logo/flex-logo-blue.png"
                 onerror="this.style.display='none'"
                 alt="Flex Student" class="fl-logo">
            <p class="fl-brand-sub">FAST National University</p>
          </div> -->

          <h2 class="fl-heading">Welcome back</h2>
          <p class="fl-subheading">Sign in to your student portal</p>

          <form id="frmlogin" action="${formAction}" method="post" class="fl-form" autocomplete="on">

            <div class="fl-field">
              <label class="fl-label" for="fl_username">Roll Number</label>
              <div class="fl-input-wrap">
                <svg class="fl-input-icon" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <input class="fl-input" id="fl_username" name="username"
                       type="text" placeholder="e.g. 24K-0649"
                       value="${savedUser}" autocomplete="username" spellcheck="false">
              </div>
            </div>

            <div class="fl-field">
              <label class="fl-label" for="fl_password">Password</label>
              <div class="fl-input-wrap">
                <svg class="fl-input-icon" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                <input class="fl-input" id="fl_password" name="password"
                       type="password" placeholder="Password"
                       value="${savedPass}" autocomplete="current-password">
                <button type="button" class="fl-toggle-pass" aria-label="Toggle password visibility" tabindex="-1">
                  <svg class="eye-show" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  <svg class="eye-hide" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="display:none">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18"/>
                  </svg>
                </button>
              </div>
            </div>

            <div id="fl-recaptcha-mount" class="fl-recaptcha"></div>

            <div class="fl-form-footer">
              <label class="fl-checkbox">
                <input type="checkbox" name="remember" id="fl_remember" ${savedRemember ? "checked" : ""}>
                <span class="fl-checkbox-box"></span>
                Remember me
              </label>
              <button type="button" class="fl-link" id="fl_forgot">Forgot password?</button>
            </div>

            <button type="submit" id="m_login_signin_submit" class="fl-btn-primary">
              Sign In
            </button>

          </form>

          <div id="fl-forgot-panel" class="fl-forgot-panel" style="display:none">
            <p class="fl-forgot-desc">
              Enter your personal email registered in NeOn. Your password will be sent to that address.
            </p>
            <form action="/Login/ForgotPassword" method="post" class="fl-form">
              <div class="fl-field">
                <label class="fl-label" for="fl_email">Email address</label>
                <div class="fl-input-wrap">
                  <svg class="fl-input-icon" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  <input class="fl-input" id="fl_email" name="email" type="email" placeholder="your@email.com">
                </div>
              </div>
              <div class="fl-row-btns">
                <button type="submit" class="fl-btn-primary" style="flex:1">Send Reset</button>
                <button type="button" class="fl-btn-secondary" id="fl_forgot_cancel">Cancel</button>
              </div>
            </form>
          </div>

        </div>
      </div>
    `;

    const styles = `
      <style id="fl-login-styles">
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #f0f2f5 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          min-height: 100vh !important;
          font-family: 'Poppins', sans-serif !important;
        }

        .m-page, #m_login { display: none !important; }

        .fl-login-wrapper {
          width: 100%;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
        }

        .fl-login-card {
          background: #ffffff;
          border-radius: 20px;
          padding: 2.5rem 2rem;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,.06), 0 10px 40px -8px rgba(0,0,0,.1);
          border: 1px solid #e8edf3;
        }

        .fl-login-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 2rem;
        }

        .fl-logo { height: 36px; width: auto; }

        .fl-brand-sub {
          font-size: 12px;
          color: #8896a5;
          line-height: 1.3;
          font-weight: 500;
        }

        .fl-heading {
          font-size: 22px;
          font-weight: 600;
          color: #1a2332;
          margin-bottom: 4px;
        }

        .fl-subheading {
          font-size: 14px;
          color: #8896a5;
          margin-bottom: 1.75rem;
        }

        .fl-form { display: flex; flex-direction: column; gap: 1.1rem; }

        .fl-field { display: flex; flex-direction: column; gap: 6px; }

        .fl-label {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
        }

        .fl-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .fl-input-icon {
          position: absolute;
          left: 12px;
          color: #9ca3af;
          pointer-events: none;
          flex-shrink: 0;
        }

        .fl-input {
          width: 100%;
          height: 42px;
          padding: 0 40px 0 40px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          font-family: inherit;
          color: #1a2332;
          background: #f8fafc;
          transition: border-color .2s, background .2s, box-shadow .2s;
          outline: none;
        }

        .fl-input:focus {
          border-color: #4f63d2;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(79, 99, 210, 0.1);
        }

        .fl-toggle-pass {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          padding: 0;
          display: flex;
          align-items: center;
          transition: color .15s;
        }

        .fl-toggle-pass:hover { color: #4f63d2; }

        .fl-recaptcha { margin-top: 4px; }

        .fl-form-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .fl-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #4b5563;
          cursor: pointer;
          user-select: none;
        }

        .fl-checkbox input { display: none; }

        .fl-checkbox-box {
          width: 16px; height: 16px;
          border: 1.5px solid #d1d5db;
          border-radius: 4px;
          display: flex; align-items: center; justify-content: center;
          transition: border-color .15s, background .15s;
          flex-shrink: 0;
        }

        .fl-checkbox input:checked + .fl-checkbox-box {
          background: #4f63d2;
          border-color: #4f63d2;
        }

        .fl-checkbox input:checked + .fl-checkbox-box::after {
          content: '';
          width: 9px; height: 5px;
          border-left: 2px solid #fff;
          border-bottom: 2px solid #fff;
          transform: rotate(-45deg) translateY(-1px);
          display: block;
        }

        .fl-link {
          background: none;
          border: none;
          font-size: 13px;
          color: #4f63d2;
          cursor: pointer;
          font-family: inherit;
          padding: 0;
          transition: color .15s;
        }

        .fl-link:hover { color: #3a4fb8; text-decoration: underline; }

        .fl-btn-primary {
          width: 100%;
          height: 44px;
          background: #4f63d2;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: background .2s, transform .1s, box-shadow .2s;
          box-shadow: 0 4px 14px rgba(79,99,210,.3);
          margin-top: 4px;
        }

        .fl-btn-primary:hover {
          background: #3a4fb8;
          box-shadow: 0 6px 18px rgba(79,99,210,.35);
        }

        .fl-btn-primary:active { transform: scale(0.98); }

        .fl-btn-secondary {
          flex: 1;
          height: 44px;
          background: #f1f5f9;
          color: #374151;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          transition: background .15s;
        }

        .fl-btn-secondary:hover { background: #e2e8f0; }

        .fl-row-btns { display: flex; gap: 10px; }

        .fl-forgot-panel {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e8edf3;
        }

        .fl-forgot-desc {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 1rem;
        }
      </style>
    `;

    // Inject styles
    document.head.insertAdjacentHTML("beforeend", styles);

    // Replace body content (banner gone)
    document.body.innerHTML = loginHTML;

    // Re-mount recaptcha
    const recaptchaMount = document.getElementById("fl-recaptcha-mount");
    if (recaptchaMount && recaptchaClone) {
      recaptchaMount.appendChild(recaptchaClone);
    }

    // Password visibility toggle
    const passInput = document.getElementById("fl_password");
    const toggleBtn = document.querySelector(".fl-toggle-pass");
    const eyeShow   = toggleBtn?.querySelector(".eye-show");
    const eyeHide   = toggleBtn?.querySelector(".eye-hide");

    toggleBtn?.addEventListener("click", () => {
      const isPassword = passInput.type === "password";
      passInput.type   = isPassword ? "text" : "password";
      eyeShow.style.display = isPassword ? "none" : "";
      eyeHide.style.display = isPassword ? ""     : "none";
    });

    // Forgot password panel
    document.getElementById("fl_forgot")?.addEventListener("click", () => {
      document.getElementById("fl-forgot-panel").style.display = "block";
      document.querySelector(".fl-form").style.display = "none";
    });

    document.getElementById("fl_forgot_cancel")?.addEventListener("click", () => {
      document.getElementById("fl-forgot-panel").style.display = "none";
      document.querySelector(".fl-form").style.display = "flex";
    });

  } catch (e) {
    console.error("Login Module Error:", e);
  }
})();