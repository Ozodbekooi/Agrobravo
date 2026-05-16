/**
 * SellerDashboard.js — Sotuvchi paneli
 * Mahsulotlarni qo'shish/o'chirish, buyurtmalarni ko'rish
 */
export default class SellerDashboard
{
    constructor(_options = {})
    {
        this.auth = _options.auth

        // DOM
        this.$panel       = document.querySelector('.js-seller-panel')
        this.$backdrop    = document.querySelector('.js-seller-backdrop')
        this.$closeBtn    = document.querySelector('.js-seller-close')
        this.$openBtn     = document.querySelector('.js-seller-btn')
        this.$tabs        = document.querySelectorAll('.js-seller-tab')
        this.$contents    = document.querySelectorAll('.js-seller-content')

        // Stats
        this.$statOrders   = document.querySelector('.js-stat-orders')
        this.$statRevenue  = document.querySelector('.js-stat-revenue')
        this.$statProducts = document.querySelector('.js-stat-products')

        // Products
        this.$addProductBtn  = document.querySelector('.js-add-product-btn')
        this.$productForm    = document.querySelector('.js-product-form')
        this.$productsList   = document.querySelector('.js-seller-products-list')
        this.$pfCancel       = document.querySelector('.js-pf-cancel')

        // Orders
        this.$ordersList = document.querySelector('.js-seller-orders-list')

        this._editingId = null

        this._bindEvents()
    }

    // ─── Events ──────────────────────────────────────────────────────────────
    _bindEvents()
    {
        // Ochish
        this.$openBtn.addEventListener('click', () => this.open())

        // Yopish
        this.$closeBtn.addEventListener('click', () => this.close())
        this.$backdrop.addEventListener('click', () => this.close())

        // Tabs
        this.$tabs.forEach(tab =>
        {
            tab.addEventListener('click', () => this._switchTab(tab.dataset.tab))
        })

        // Mahsulot qo'shish tugmasi
        this.$addProductBtn.addEventListener('click', () =>
        {
            this._editingId = null
            this._resetForm()
            this.$productForm.style.display = 'block'
            this.$addProductBtn.style.display = 'none'
        })

        // Bekor qilish
        this.$pfCancel.addEventListener('click', () =>
        {
            this.$productForm.style.display = 'none'
            this.$addProductBtn.style.display = 'block'
            this._editingId = null
        })

        // Form submit
        this.$productForm.addEventListener('submit', (e) =>
        {
            e.preventDefault()
            this._saveProduct()
        })

        // Escape
        window.addEventListener('keydown', (e) =>
        {
            if(e.key === 'Escape' && this.$panel.style.display !== 'none')
            {
                this.close()
            }
        })
    }

    // ─── Open / Close ────────────────────────────────────────────────────────
    open()
    {
        this.$panel.style.display = 'flex'
        this._renderStats()
        this._renderProducts()
        this._renderOrders()
    }

    close()
    {
        this.$panel.style.display = 'none'
        this.$productForm.style.display = 'none'
        this.$addProductBtn.style.display = 'block'
        this._editingId = null
    }

    // ─── Tabs ────────────────────────────────────────────────────────────────
    _switchTab(tab)
    {
        this.$tabs.forEach(t => t.classList.toggle('is-active', t.dataset.tab === tab))
        this.$contents.forEach(c => c.style.display = c.dataset.content === tab ? 'block' : 'none')
    }

    // ─── Stats ───────────────────────────────────────────────────────────────
    _renderStats()
    {
        const products = this._getMyProducts()
        const orders   = this._getAllOrders()

        const myOrders  = orders.filter(o => o.sellerId === this.auth.user.id)
        const revenue   = myOrders.reduce((s, o) => s + (o.total || 0), 0)

        this.$statOrders.textContent   = myOrders.length
        this.$statRevenue.textContent  = this._fmt(revenue)
        this.$statProducts.textContent = products.length
    }

    // ─── Products ────────────────────────────────────────────────────────────
    _renderProducts()
    {
        const products = this._getMyProducts()
        this.$productsList.innerHTML = ''

        if(products.length === 0)
        {
            this.$productsList.innerHTML = '<p class="seller-empty">Hali mahsulot qo\'shilmagan</p>'
            return
        }

        for(const p of products)
        {
            const el = document.createElement('div')
            el.className = 'seller-product-item'
            el.innerHTML = `
                <span class="seller-product-item__emoji">${p.emoji}</span>
                <div class="seller-product-item__info">
                    <div class="seller-product-item__name">${p.name}</div>
                    <div class="seller-product-item__meta">Zaxira: ${p.stock} ${p.unit} &nbsp;·&nbsp; ${p.description || ''}</div>
                </div>
                <span class="seller-product-item__price">${this._fmt(p.price)} so'm/${p.unit}</span>
                <div class="seller-product-item__actions">
                    <button class="seller-product-item__btn seller-product-item__btn--edit js-edit" data-id="${p.id}">✏️ Tahrir</button>
                    <button class="seller-product-item__btn seller-product-item__btn--del js-del" data-id="${p.id}">🗑 O'chir</button>
                </div>
            `

            el.querySelector('.js-edit').addEventListener('click', () => this._editProduct(p.id))
            el.querySelector('.js-del').addEventListener('click', () => this._deleteProduct(p.id))

            this.$productsList.appendChild(el)
        }
    }

    _editProduct(id)
    {
        const products = this._getMyProducts()
        const p = products.find(x => x.id === id)
        if(!p) return

        this._editingId = id
        this.$productForm.querySelector('.js-pf-name').value  = p.name
        this.$productForm.querySelector('.js-pf-emoji').value = p.emoji
        this.$productForm.querySelector('.js-pf-price').value = p.price
        this.$productForm.querySelector('.js-pf-unit').value  = p.unit
        this.$productForm.querySelector('.js-pf-stock').value = p.stock
        this.$productForm.querySelector('.js-pf-desc').value  = p.description || ''

        this.$productForm.style.display   = 'block'
        this.$addProductBtn.style.display = 'none'
        this.$productForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }

    _deleteProduct(id)
    {
        if(!confirm('Mahsulotni o\'chirishni tasdiqlaysizmi?')) return

        const all = this._getAllProducts()
        const updated = all.filter(p => p.id !== id)
        this._saveAllProducts(updated)
        this._renderProducts()
        this._renderStats()

        // Marketni yangilash uchun event
        window.dispatchEvent(new CustomEvent('productsUpdated'))
    }

    _saveProduct()
    {
        const name  = this.$productForm.querySelector('.js-pf-name').value.trim()
        const emoji = this.$productForm.querySelector('.js-pf-emoji').value.trim() || '📦'
        const price = parseInt(this.$productForm.querySelector('.js-pf-price').value)
        const unit  = this.$productForm.querySelector('.js-pf-unit').value
        const stock = parseInt(this.$productForm.querySelector('.js-pf-stock').value)
        const desc  = this.$productForm.querySelector('.js-pf-desc').value.trim()

        if(!name || !price || !stock)
        {
            alert('Nom, narx va miqdorni to\'ldiring')
            return
        }

        const all = this._getAllProducts()

        if(this._editingId)
        {
            // Tahrirlash
            const idx = all.findIndex(p => p.id === this._editingId)
            if(idx !== -1)
            {
                all[idx] = { ...all[idx], name, emoji, price, unit, stock, description: desc }
            }
        }
        else
        {
            // Yangi mahsulot
            all.push({
                id:          'prod-' + Date.now(),
                sellerId:    this.auth.user.id,
                sellerName:  this.auth.user.name,
                name, emoji, price, unit, stock,
                description: desc,
                createdAt:   new Date().toISOString()
            })
        }

        this._saveAllProducts(all)
        this._resetForm()
        this.$productForm.style.display   = 'none'
        this.$addProductBtn.style.display = 'block'
        this._editingId = null
        this._renderProducts()
        this._renderStats()

        // Marketni yangilash uchun event
        window.dispatchEvent(new CustomEvent('productsUpdated'))
    }

    _resetForm()
    {
        this.$productForm.reset()
    }

    // ─── Orders ──────────────────────────────────────────────────────────────
    _renderOrders()
    {
        const orders   = this._getAllOrders()
        const myOrders = orders.filter(o => o.sellerId === this.auth.user.id)

        this.$ordersList.innerHTML = ''

        if(myOrders.length === 0)
        {
            this.$ordersList.innerHTML = '<p class="seller-empty">Hali buyurtma yo\'q</p>'
            return
        }

        // Eng yangi buyurtmalar birinchi
        const sorted = [...myOrders].reverse()

        for(const order of sorted)
        {
            const el = document.createElement('div')
            el.className = 'seller-order-item'

            const tags = order.items.map(i =>
                `<span class="seller-order-item__tag">${i.emoji || ''} ${i.name} × ${i.qty}</span>`
            ).join('')

            el.innerHTML = `
                <div class="seller-order-item__head">
                    <span class="seller-order-item__id">Buyurtma #${order.id.toString().slice(-5)}</span>
                    <span class="seller-order-item__total">${this._fmt(order.total)} so'm</span>
                </div>
                <div class="seller-order-item__products">${tags}</div>
                <div class="seller-order-item__date">${order.date}</div>
            `

            this.$ordersList.appendChild(el)
        }
    }

    // ─── localStorage helpers ────────────────────────────────────────────────
    _getMyProducts()
    {
        return this._getAllProducts().filter(p => p.sellerId === this.auth.user.id)
    }

    _getAllProducts()
    {
        try { return JSON.parse(localStorage.getItem('agro_products') || '[]') }
        catch { return [] }
    }

    _saveAllProducts(products)
    {
        localStorage.setItem('agro_products', JSON.stringify(products))
    }

    _getAllOrders()
    {
        try { return JSON.parse(localStorage.getItem('agro_orders') || '[]') }
        catch { return [] }
    }

    _fmt(n)
    {
        return (n || 0).toLocaleString('uz-UZ')
    }
}
