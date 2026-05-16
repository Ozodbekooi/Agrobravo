/**
 * Auth.js — Login / Register / Logout tizimi
 * Ma'lumotlar localStorage da saqlanadi (demo uchun)
 */
export default class Auth
{
    constructor(_options = {})
    {
        this.onLogin  = _options.onLogin  || (() => {})
        this.onLogout = _options.onLogout || (() => {})

        // DOM
        this.$screen       = document.querySelector('.js-auth-screen')
        this.$tabs         = document.querySelectorAll('.js-tab')
        this.$loginForm    = document.querySelector('.js-login-form')
        this.$registerForm = document.querySelector('.js-register-form')
        this.$loginError   = document.querySelector('.js-login-error')
        this.$regError     = document.querySelector('.js-reg-error')
        this.$eye          = document.querySelector('.js-eye')
        this.$demoButtons  = document.querySelectorAll('.js-demo')

        // Topbar
        this.$topbar      = document.querySelector('.js-topbar')
        this.$topbarUser  = document.querySelector('.js-topbar-user')
        this.$sellerBtn   = document.querySelector('.js-seller-btn')
        this.$logoutBtn   = document.querySelector('.js-logout-btn')
        this.$cartBadge   = document.querySelector('.js-cart-badge')

        // Demo foydalanuvchilar (localStorage ga ham saqlanadi)
        this._seedDemoUsers()

        // Avvalgi sessiyani tekshir
        const saved = this._getSession()
        if(saved)
        {
            this._applyLogin(saved, false)   // sessiyadan — xabar yo'q
        }

        this._bindEvents()
    }

    // ─── Demo foydalanuvchilar ────────────────────────────────────────────────
    _seedDemoUsers()
    {
        const users = this._getUsers()
        const hasMijoz    = users.find(u => u.username === 'mijoz')
        const hasSotuvchi = users.find(u => u.username === 'sotuvchi')

        if(!hasMijoz)
        {
            users.push({
                id: 'demo-mijoz',
                name: 'Demo Mijoz',
                username: 'mijoz',
                phone: '+998901234567',
                password: '123456',
                role: 'mijoz',
                createdAt: new Date().toISOString()
            })
        }

        if(!hasSotuvchi)
        {
            users.push({
                id: 'demo-sotuvchi',
                name: 'Demo Sotuvchi',
                username: 'sotuvchi',
                phone: '+998907654321',
                password: '123456',
                role: 'sotuvchi',
                createdAt: new Date().toISOString()
            })
        }

        this._saveUsers(users)
    }

    // ─── Events ──────────────────────────────────────────────────────────────
    _bindEvents()
    {
        // Tab almashtirish
        this.$tabs.forEach(tab =>
        {
            tab.addEventListener('click', () => this._switchTab(tab.dataset.tab))
        })

        // Login form
        this.$loginForm.addEventListener('submit', (e) =>
        {
            e.preventDefault()
            this._handleLogin()
        })

        // Register form
        this.$registerForm.addEventListener('submit', (e) =>
        {
            e.preventDefault()
            this._handleRegister()
        })

        // Ko'z (parolni ko'rish)
        this.$eye.addEventListener('click', () =>
        {
            const inp = this.$loginForm.querySelector('.js-login-password')
            inp.type = inp.type === 'password' ? 'text' : 'password'
            this.$eye.textContent = inp.type === 'password' ? '👁' : '🙈'
        })

        // Demo tugmalar
        this.$demoButtons.forEach(btn =>
        {
            btn.addEventListener('click', () => this._loginAsDemo(btn.dataset.user))
        })

        // Logout
        this.$logoutBtn.addEventListener('click', () => this._handleLogout())

        // Escape bilan yopish (faqat login bo'lgan bo'lsa)
        window.addEventListener('keydown', (e) =>
        {
            if(e.key === 'Escape' && this.currentUser)
            {
                // Auth screen yopiq bo'lsa hech narsa qilma
            }
        })
    }

    // ─── Tab ─────────────────────────────────────────────────────────────────
    _switchTab(tab)
    {
        this.$tabs.forEach(t =>
        {
            t.classList.toggle('is-active', t.dataset.tab === tab)
        })

        this.$loginForm.style.display    = tab === 'login'    ? 'block' : 'none'
        this.$registerForm.style.display = tab === 'register' ? 'block' : 'none'

        this.$loginError.textContent = ''
        this.$regError.textContent   = ''
    }

    // ─── Login ───────────────────────────────────────────────────────────────
    _handleLogin()
    {
        const username = this.$loginForm.querySelector('.js-login-username').value.trim()
        const password = this.$loginForm.querySelector('.js-login-password').value

        if(!username || !password)
        {
            this.$loginError.textContent = 'Barcha maydonlarni to\'ldiring'
            return
        }

        const users = this._getUsers()
        const user  = users.find(u =>
            (u.username === username || u.phone === username) && u.password === password
        )

        if(!user)
        {
            this.$loginError.textContent = 'Login yoki parol noto\'g\'ri'
            return
        }

        this._applyLogin(user, true)   // yangi login — xabar ko'rsat
    }

    // ─── Register ────────────────────────────────────────────────────────────
    _handleRegister()
    {
        const name     = this.$registerForm.querySelector('.js-reg-name').value.trim()
        const phone    = this.$registerForm.querySelector('.js-reg-phone').value.trim()
        const password = this.$registerForm.querySelector('.js-reg-password').value
        const roleInp  = this.$registerForm.querySelector('.js-role-input:checked')
        const role     = roleInp ? roleInp.value : 'mijoz'

        if(!name || !phone || !password)
        {
            this.$regError.textContent = 'Barcha maydonlarni to\'ldiring'
            return
        }

        if(password.length < 6)
        {
            this.$regError.textContent = 'Parol kamida 6 ta belgi bo\'lishi kerak'
            return
        }

        const users = this._getUsers()

        if(users.find(u => u.phone === phone))
        {
            this.$regError.textContent = 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan'
            return
        }

        const newUser = {
            id:        'user-' + Date.now(),
            name,
            username:  phone,
            phone,
            password,
            role,
            createdAt: new Date().toISOString()
        }

        users.push(newUser)
        this._saveUsers(users)

        this._applyLogin(newUser, true)   // ro'yxatdan o'tish — xabar ko'rsat
    }

    // ─── Demo login ──────────────────────────────────────────────────────────
    _loginAsDemo(type)
    {
        const users = this._getUsers()
        const user  = users.find(u => u.username === type)
        if(user) this._applyLogin(user, true)   // demo — xabar ko'rsat
    }

    // ─── Apply login ─────────────────────────────────────────────────────────
    _applyLogin(user, showWelcome = false)
    {
        this.currentUser = user
        this._saveSession(user)

        // Auth screen yashir
        this.$screen.classList.add('is-hidden')
        this.$topbar.style.display = 'flex'
        this.$topbarUser.textContent = `${user.role === 'sotuvchi' ? '🏪' : '👤'} ${user.name}`

        // Sotuvchi tugmasi
        if(user.role === 'sotuvchi')
        {
            this.$sellerBtn.style.display = 'inline-flex'
        }
        else
        {
            this.$sellerBtn.style.display = 'none'
        }

        // Savat badge (faqat mijoz uchun)
        if(this.$cartBadge)
        {
            this.$cartBadge.style.display = user.role === 'mijoz' ? 'flex' : 'none'
        }

        // Xush kelibsiz xabar (faqat yangi login da)
        if(showWelcome)
        {
            this._showWelcome(user)
        }

        this.onLogin(user)
    }

    // ─── Xush kelibsiz animatsiyasi ───────────────────────────────────────────
    _showWelcome(user)
    {
        const $w     = document.querySelector('.js-welcome')
        const $emoji = document.querySelector('.js-welcome-emoji')
        const $name  = document.querySelector('.js-welcome-name')
        const $sub   = document.querySelector('.js-welcome-sub')

        if(!$w) return

        // Rol bo'yicha emoji va matn
        const isSeller = user.role === 'sotuvchi'
        $emoji.textContent = isSeller ? '🏪' : '🛒'
        $name.textContent  = user.name
        $sub.textContent   = isSeller
            ? 'Sotuvchi sifatida kirdingiz — do\'konlaringizni boshqaring!'
            : 'Xarid qilishga tayyor — do\'konlarni kezing!'

        // Ko'rsat
        $w.classList.add('is-visible')

        // 5 soniyadan keyin silliq yashir
        setTimeout(() =>
        {
            $w.classList.remove('is-visible')
        }, 5000)
    }

    // ─── Logout ──────────────────────────────────────────────────────────────
    _handleLogout()
    {
        this.currentUser = null
        this._clearSession()

        // Auth screen ko'rsat
        this.$screen.classList.remove('is-hidden')

        // Topbar yashir
        this.$topbar.style.display = 'none'

        // Savat badge yashir
        if(this.$cartBadge) this.$cartBadge.style.display = 'none'

        // Formlarni tozala
        this.$loginForm.reset()
        this.$registerForm.reset()
        this.$loginError.textContent = ''
        this.$regError.textContent   = ''

        this.onLogout()
    }

    // ─── localStorage helpers ────────────────────────────────────────────────
    _getUsers()
    {
        try { return JSON.parse(localStorage.getItem('agro_users') || '[]') }
        catch { return [] }
    }

    _saveUsers(users)
    {
        localStorage.setItem('agro_users', JSON.stringify(users))
    }

    _getSession()
    {
        try { return JSON.parse(localStorage.getItem('agro_session')) }
        catch { return null }
    }

    _saveSession(user)
    {
        // Parolni sessiyaga saqlamaymiz
        const { password, ...safe } = user
        localStorage.setItem('agro_session', JSON.stringify(safe))
    }

    _clearSession()
    {
        localStorage.removeItem('agro_session')
    }

    // ─── Public ──────────────────────────────────────────────────────────────
    get user()   { return this.currentUser }
    get isLoggedIn() { return !!this.currentUser }
    get isSeller()   { return this.currentUser?.role === 'sotuvchi' }
    get isBuyer()    { return this.currentUser?.role === 'mijoz' }
}
