import './style/main.css'
import Application from './javascript/Application.js'
import Auth from './javascript/Auth.js'
import ShopUI from './javascript/ShopUI.js'
import SellerDashboard from './javascript/SellerDashboard.js'

// ─── Auth ────────────────────────────────────────────────────────────────────
const auth = new Auth({
    onLogin(user)
    {
        if(!window.application)
        {
            window.application = new Application({
                $canvas: document.querySelector('.js-canvas'),
                useComposer: true
            })
        }

        const $badge = document.querySelector('.js-cart-badge')
        if($badge) $badge.style.display = user.role === 'mijoz' ? 'flex' : 'none'
    },
    onLogout()
    {
        window.dispatchEvent(new CustomEvent('closeShop'))
    }
})

// ─── Shop UI ──────────────────────────────────────────────────────────────────
window.shopUI = new ShopUI({ auth })

// ─── Sotuvchi paneli ──────────────────────────────────────────────────────────
window.sellerDashboard = new SellerDashboard({ auth })

// ─── openShop ─────────────────────────────────────────────────────────────────
window.addEventListener('openShop', (e) =>
{
    if(!auth.isLoggedIn) return
    if(auth.isSeller) { window.sellerDashboard.open(); return }
    window.shopUI.openShop(e.detail)
})
