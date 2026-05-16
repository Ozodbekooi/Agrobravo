/**
 * ShopUI - Agro do'kon overlay va savat tizimi
 * window 'openShop' eventini tinglaydi va UI ko'rsatadi
 */
export default class ShopUI
{
    constructor(_options = {})
    {
        this.auth = _options.auth || null
        // DOM elementlari
        this.$overlay   = document.querySelector('.js-shop-overlay')
        this.$backdrop  = document.querySelector('.js-shop-backdrop')
        this.$header    = document.querySelector('.js-shop-header')
        this.$emoji     = document.querySelector('.js-shop-emoji')
        this.$title     = document.querySelector('.js-shop-title')
        this.$products  = document.querySelector('.js-shop-products')
        this.$cartItems = document.querySelector('.js-cart-items')
        this.$cartCount = document.querySelector('.js-cart-count')
        this.$cartTotal = document.querySelector('.js-cart-total')
        this.$orderBtn  = document.querySelector('.js-order-btn')
        this.$closeBtn  = document.querySelector('.js-shop-close')
        this.$toast     = document.querySelector('.js-toast')
        this.$badge     = document.querySelector('.js-cart-badge')
        this.$badgeCount = document.querySelector('.js-cart-badge-count')

        // Holat
        this.cart = []          // { product, qty, shopId }
        this.currentShop = null

        this.bindEvents()
    }

    bindEvents()
    {
        // 3D dunyodan kelgan event
        window.addEventListener('openShop', (e) =>
        {
            this.openShop(e.detail)
        })

        // 3D dunyodan yopish eventi (mashina chiqib ketsa)
        window.addEventListener('closeShop', () =>
        {
            this.closeShop()
        })

        // Yopish
        this.$closeBtn.addEventListener('click', () => this.closeShop())
        this.$backdrop.addEventListener('click', () => this.closeShop())

        // Klaviatura Escape
        window.addEventListener('keydown', (e) =>
        {
            if(e.key === 'Escape' && this.$overlay.classList.contains('is-open'))
            {
                this.closeShop()
            }
        })

        // Buyurtma berish
        this.$orderBtn.addEventListener('click', () => this.placeOrder())

        // Savat badge bosish - oxirgi ochilgan do'konni qayta ochadi
        this.$badge.addEventListener('click', () =>
        {
            if(this.currentShop)
            {
                this.openShop(this.currentShop)
            }
        })
    }

    openShop(shopDetail)
    {
        this.currentShop = shopDetail

        const { shopData, name, color, emoji, floors, type } = shopDetail

        // Header rangini o'zgartir
        this.$header.style.setProperty('--shop-color', color)
        this.$header.style.background = color
        this.$overlay.style.setProperty('--shop-color', color)

        // Ma'lumotlarni to'ldir
        this.$emoji.textContent = emoji

        // Nom + qavat + tur
        let titleHtml = name
        if(floors) titleHtml += ` <span style="font-size:14px;opacity:0.7;font-weight:400">${floors} qavat</span>`
        if(type)
        {
            const typeLabels = {
                bozor:         '🏛️ Bozor',
                supermarket:   '🛒 Supermarket',
                savdo_markazi: '🏬 Savdo markazi',
                agro_markaz:   '🌾 Agro markaz',
                kiyim_markazi: '👖 Kiyim markazi'
            }
            titleHtml += ` <span style="font-size:12px;opacity:0.6;font-weight:400;display:block;margin-top:2px">${typeLabels[type] || type}</span>`
        }
        this.$title.innerHTML = titleHtml

        // Kategoriyalar bo'yicha mahsulotlarni render qil
        this.renderProducts(shopData.products, shopData.id, color)

        // Savatni yangilab ko'rsat
        this.renderCart()

        // Overlay ochish
        this.$overlay.classList.add('is-open')
        document.body.style.overflow = 'hidden'
    }

    closeShop()
    {
        this.$overlay.classList.remove('is-open')
        document.body.style.overflow = ''
    }

    renderProducts(products, shopId, color)
    {
        this.$products.innerHTML = ''

        // Kategoriyalar bo'yicha guruhlash
        const categories = {}
        for(const product of products)
        {
            const cat = product.cat || 'Boshqa'
            if(!categories[cat]) categories[cat] = []
            categories[cat].push(product)
        }

        for(const [catName, catProducts] of Object.entries(categories))
        {
            // Kategoriya sarlavhasi
            const catHeader = document.createElement('div')
            catHeader.className = 'product-cat-header'
            catHeader.textContent = catName
            catHeader.style.cssText = `
                grid-column: 1 / -1;
                font-size: 11px;
                font-weight: 700;
                color: ${color};
                text-transform: uppercase;
                letter-spacing: 1px;
                padding: 8px 0 4px;
                border-bottom: 1px solid ${color}44;
                margin-bottom: 4px;
            `
            this.$products.appendChild(catHeader)

            for(const product of catProducts)
            {
                const cartItem = this.cart.find(i => i.product.id === product.id && i.shopId === shopId)
                const qty      = cartItem ? cartItem.qty : 0

                const card = document.createElement('div')
                card.className = 'product-card'
                card.dataset.productId = product.id
                card.dataset.shopId    = shopId

                const stockClass = product.stock < 30 ? 'is-low' : ''
                const desc       = product.description || ''

                card.innerHTML = `
                    <div class="product-card__emoji">${product.emoji}</div>
                    <div class="product-card__name">${product.name}</div>
                    ${desc ? `<div class="product-card__desc">${desc}</div>` : ''}
                    <div class="product-card__price">${this.formatPrice(product.price)}</div>
                    <div class="product-card__unit">1 ${product.unit}</div>
                    <div class="product-card__stock ${stockClass}">
                        ${product.stock < 30 ? '⚠️ ' : '✅ '}${product.stock} ${product.unit}
                    </div>
                    <div class="product-card__actions">
                        <button class="product-card__qty-btn js-minus" ${qty === 0 ? 'disabled' : ''}>−</button>
                        <span class="product-card__qty js-qty">${qty}</span>
                        <button class="product-card__qty-btn js-plus">+</button>
                    </div>
                    <button class="product-card__add-btn js-add" style="background:${color}">
                        ${qty > 0 ? '✓ Savatda' : 'Savatga qo\'sh'}
                    </button>
                `

                card.querySelector('.js-minus').addEventListener('click', () =>
                {
                    this.updateCart(product, shopId, -1)
                    this.renderProducts(products, shopId, color)
                    this.renderCart()
                })

                card.querySelector('.js-plus').addEventListener('click', () =>
                {
                    this.updateCart(product, shopId, 1)
                    this.renderProducts(products, shopId, color)
                    this.renderCart()
                })

                card.querySelector('.js-add').addEventListener('click', () =>
                {
                    if(qty === 0)
                    {
                        this.updateCart(product, shopId, 1)
                        this.renderProducts(products, shopId, color)
                        this.renderCart()
                    }
                })

                this.$products.appendChild(card)
            }
        }
    }

    updateCart(product, shopId, delta)
    {
        const idx = this.cart.findIndex(i => i.product.id === product.id && i.shopId === shopId)

        if(idx === -1)
        {
            if(delta > 0)
            {
                this.cart.push({ product, shopId, qty: 1 })
            }
        }
        else
        {
            this.cart[idx].qty += delta
            if(this.cart[idx].qty <= 0)
            {
                this.cart.splice(idx, 1)
            }
        }

        this.updateBadge()
    }

    renderCart()
    {
        this.$cartItems.innerHTML = ''

        if(this.cart.length === 0)
        {
            this.$cartItems.innerHTML = '<div class="cart__empty">Savat bo\'sh</div>'
            this.$cartTotal.textContent = '0'
            this.$cartCount.textContent = '0 ta mahsulot'
            this.$orderBtn.disabled = true
            return
        }

        this.$orderBtn.disabled = false

        let total = 0
        let totalQty = 0

        for(const item of this.cart)
        {
            const itemTotal = item.product.price * item.qty
            total += itemTotal
            totalQty += item.qty

            const el = document.createElement('div')
            el.className = 'cart__item'
            el.innerHTML = `
                <span class="cart__item-emoji">${item.product.emoji}</span>
                <span class="cart__item-name">${item.product.name}</span>
                <span class="cart__item-qty">${item.qty} ${item.product.unit}</span>
                <span class="cart__item-price">${this.formatPrice(itemTotal)} so'm</span>
                <button class="cart__item-remove js-remove" aria-label="O'chirish">✕</button>
            `

            el.querySelector('.js-remove').addEventListener('click', () =>
            {
                const idx = this.cart.findIndex(i => i.product.id === item.product.id && i.shopId === item.shopId)
                if(idx !== -1) this.cart.splice(idx, 1)
                this.updateBadge()
                this.renderCart()
                if(this.currentShop)
                {
                    this.renderProducts(this.currentShop.shopData.products, this.currentShop.shopData.id, this.currentShop.color)
                }
            })

            this.$cartItems.appendChild(el)
        }

        this.$cartTotal.textContent = this.formatPrice(total)
        this.$cartCount.textContent = `${totalQty} ta mahsulot`
    }

    updateBadge()
    {
        const total = this.cart.reduce((sum, i) => sum + i.qty, 0)
        this.$badgeCount.textContent = total
        this.$badge.style.borderColor = total > 0 ? '#ffd700' : 'rgba(255,255,255,0.15)'
    }

    placeOrder()
    {
        if(this.cart.length === 0) return

        // Buyurtmani localStorage ga saqlash
        const orders = this._getOrders()

        // Har bir sotuvchi uchun alohida buyurtma
        const bySeller = {}
        for(const item of this.cart)
        {
            const sid = item.product.sellerId || 'market'
            if(!bySeller[sid]) bySeller[sid] = []
            bySeller[sid].push(item)
        }

        for(const [sellerId, items] of Object.entries(bySeller))
        {
            const order = {
                id:       Date.now() + Math.random(),
                sellerId,
                buyerId:  this.auth ? this.auth.user?.id : 'guest',
                buyerName: this.auth ? this.auth.user?.name : 'Mehmon',
                items: items.map(i => ({
                    name:  i.product.name,
                    emoji: i.product.emoji,
                    qty:   i.qty,
                    unit:  i.product.unit,
                    price: i.product.price,
                    total: i.product.price * i.qty
                })),
                total: items.reduce((s, i) => s + i.product.price * i.qty, 0),
                date:  new Date().toLocaleString('uz-UZ')
            }
            orders.push(order)
        }

        localStorage.setItem('agro_orders', JSON.stringify(orders))

        // Savatni tozala
        this.cart = []
        this.updateBadge()
        this.renderCart()
        this.closeShop()
        this.showToast('✅ Buyurtmangiz qabul qilindi!')
    }

    _getOrders()
    {
        try { return JSON.parse(localStorage.getItem('agro_orders') || '[]') }
        catch { return [] }
    }

    showToast(message)
    {
        this.$toast.textContent = message
        this.$toast.classList.add('is-visible')
        setTimeout(() =>
        {
            this.$toast.classList.remove('is-visible')
        }, 3500)
    }

    formatPrice(price)
    {
        return price.toLocaleString('uz-UZ')
    }
}
