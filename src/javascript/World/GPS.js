import * as THREE from 'three'

export default class GPS
{
    constructor(_options)
    {
        this.time = _options.time
        this.car = _options.car
        this.markets = _options.markets
        this.container = new THREE.Object3D()

        this.target = null

        this.setArrow()
        this.setUI()

        this.mmCanvas = document.getElementById('minimap-canvas')
        if(this.mmCanvas) {
            this.mmCtx = this.mmCanvas.getContext('2d')
        }
    }

    setArrow()
    {
        // 3D Strelka yashil rangda
        const geo = new THREE.ConeGeometry(0.5, 2, 8)
        geo.translate(0, 1, 0)
        // Strelkani X o'qiga (yerga parallel) yotqizamiz
        geo.rotateZ(-Math.PI / 2)

        const mat = new THREE.MeshBasicMaterial({ color: 0x00ff00, depthTest: false })
        this.arrow = new THREE.Mesh(geo, mat)
        this.arrow.renderOrder = 100 // doim ustda ko'rinadi
        this.arrow.visible = false
        this.container.add(this.arrow)

        this.time.on('tick', () => {
            if(!this.car || !this.car.chassis) return

            const cx = this.car.chassis.object.position.x
            const cy = this.car.chassis.object.position.y
            const cz = this.car.chassis.object.position.z

            // Minimap doim yangilanadi (manzil bo'lmasa ham)
            if(this.mmCtx) {
                this._drawMinimap(cx, cy)
            }

            if(!this.target) {
                this.arrow.visible = false
                return
            }

            this.arrow.visible = true

            // Strelkani mashina tepasiga qo'yish
            this.arrow.position.set(cx, cy, cz + 4)

            // Manzilga qaratish
            const tx = this.target.offsetX
            const ty = this.target.offsetY
            const dx = tx - cx
            const dy = ty - cy
            const angle = Math.atan2(dy, dx)
            this.arrow.rotation.z = angle

            // Masofani hisoblash va UI ga yozish
            const dist = Math.sqrt(dx*dx + dy*dy)
            if(this.uiDistance) {
                this.uiDistance.innerText = `Masofa: ${Math.round(dist)} m`
            }
        })
    }

    setUI()
    {
        const navEl = document.querySelector('.js-gps-navigator')
        const selectEl = document.querySelector('.js-gps-select')
        this.uiDistance = document.querySelector('.js-gps-distance')

        if(navEl) {
            navEl.classList.add('is-active')
        }

        if(selectEl) {
            selectEl.addEventListener('change', (e) => {
                const val = e.target.value
                if(!val) {
                    this.target = null
                    this.uiDistance.innerText = "Masofa: 0 m"
                    return
                }

                // Tanlangan marketni topish
                const market = this.markets.find(m => m.id === val)
                if(market) {
                    this.target = market
                }
            })
        }
    }

    _drawMinimap(cx, cy)
    {
        const ctx = this.mmCtx
        ctx.clearRect(0, 0, 140, 140)

        // Fon
        ctx.fillStyle = '#111'
        ctx.fillRect(0, 0, 140, 140)

        // O'lchov (1 piksel = y metr). Markaz (140)
        const scale = 0.4
        const offX = 50 // Dunyodagi 0 ni minimap markazidan biroz chaproqqa olamiz
        const offY = 70

        // Asosiy yo'llar
        ctx.fillStyle = '#444'
        ctx.fillRect(offX - 100 * scale, offY - 8 * scale, 300 * scale, 16 * scale) // Gorizontal yo'l
        ctx.fillRect(offX - 8 * scale, offY - 100 * scale, 16 * scale, 250 * scale) // Vertikal yo'l

        // Savdo markazlari
        this.markets.forEach(m => {
            const mx = offX + m.offsetX * scale
            const my = offY - m.offsetY * scale // Y o'qi HTML da pastga qarab o'sadi, 3D da tepaga

            ctx.fillStyle = m.color
            ctx.beginPath()
            ctx.arc(mx, my, 8, 0, Math.PI * 2)
            ctx.fill()
            
            // Border (Agar manzil bo'lsa miltillaydi yoki sariq bo'ladi)
            if(this.target && this.target.id === m.id) {
                ctx.strokeStyle = '#FFD700'
                ctx.lineWidth = 2
                ctx.beginPath(); ctx.arc(mx, my, 12, 0, Math.PI * 2); ctx.stroke()
            }
        })

        // Mashina nuqtasi
        const px = offX + cx * scale
        const py = offY - cy * scale // Y o'qini aylantiramiz

        ctx.fillStyle = '#00ffff'
        ctx.beginPath()
        ctx.arc(px, py, 4, 0, Math.PI * 2)
        ctx.fill()

        // Mashina yo'nalishi (nur)
        const rotZ = this.car.chassis.object.rotation.z
        ctx.strokeStyle = '#00ffff'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(px, py)
        // rotation.z + Math.PI/2 ni olish kerak, chunki mashina original modeli balki boshqa o'qda
        ctx.lineTo(px + Math.cos(rotZ + Math.PI/2) * 10, py - Math.sin(rotZ + Math.PI/2) * 10)
        ctx.stroke()
    }
}
