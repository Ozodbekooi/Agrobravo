import * as THREE from 'three'

export default class MarketBuilder
{
    constructor()
    {
        this.materials = {}
        this._initTextures()
    }

    _makeTex(size, fn) {
        const cv = document.createElement('canvas')
        cv.width = cv.height = size
        fn(cv.getContext('2d'), size)
        const t = new THREE.CanvasTexture(cv)
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        return t
    }

    _initTextures()
    {
        // --- Devor g'isht teksturasi ---
        const brickTex = this._makeTex(256, (x, s) => {
            x.fillStyle = '#C8A87A'; x.fillRect(0, 0, s, s)
            x.strokeStyle = 'rgba(80,50,20,0.45)'; x.lineWidth = 2
            for(let row = 0; row < 8; row++) {
                const off = row % 2 === 0 ? 0 : 16
                for(let col = 0; col < 9; col++) {
                    x.strokeRect(col * 32 + off - 16, row * 16, 30, 14)
                }
            }
        })
        brickTex.repeat.set(3, 3)

        // --- Beton/panel teksturasi ---
        const concreteTex = this._makeTex(256, (x, s) => {
            x.fillStyle = '#B0BEC5'; x.fillRect(0, 0, s, s)
            x.strokeStyle = 'rgba(70,90,100,0.3)'; x.lineWidth = 1
            for(let i = 0; i < 4; i++) {
                x.beginPath(); x.moveTo(i*64, 0); x.lineTo(i*64, s); x.stroke()
                x.beginPath(); x.moveTo(0, i*64); x.lineTo(s, i*64); x.stroke()
            }
        })
        concreteTex.repeat.set(4, 4)

        // --- Oyna fasad teksturasi ---
        const glassTex = this._makeTex(256, (x, s) => {
            const g = x.createLinearGradient(0, 0, s, s)
            g.addColorStop(0, '#1565C0'); g.addColorStop(0.4, '#1976D2'); g.addColorStop(1, '#0D47A1')
            x.fillStyle = g; x.fillRect(0, 0, s, s)
            x.strokeStyle = 'rgba(200,230,255,0.35)'; x.lineWidth = 2
            for(let col = 0; col < 8; col++) for(let row = 0; row < 8; row++) {
                x.strokeRect(col * 32 + 2, row * 32 + 2, 28, 28)
                if((col+row)%3===0) {
                    x.fillStyle = 'rgba(255,255,255,0.08)'; x.fillRect(col*32+4, row*32+4, 26, 26)
                }
            }
        })
        glassTex.repeat.set(3, 3)

        // --- Gumbaz (Chorsu uchun) ---
        const domeTex = this._makeTex(512, (x, s) => {
            const g = x.createLinearGradient(0, 0, 0, s)
            g.addColorStop(0, '#26C6A6'); g.addColorStop(0.5, '#00897B'); g.addColorStop(1, '#00695C')
            x.fillStyle = g; x.fillRect(0, 0, s, s)
            const r = 34
            for (let row = 0; row < 18; row++) {
                for (let col = 0; col < 18; col++) {
                    const px = col * r + (row % 2) * r / 2
                    const py = row * r * 0.75
                    x.beginPath(); x.arc(px, py, r * 0.5, 0, Math.PI * 2)
                    x.fillStyle = row % 2 === 0 ? 'rgba(18,180,140,0.3)' : 'rgba(28,210,160,0.25)'
                    x.fill()
                    x.strokeStyle = 'rgba(0,60,45,0.55)'; x.lineWidth = 1.5; x.stroke()
                    x.beginPath(); x.arc(px - 5, py - 5, r * 0.12, 0, Math.PI * 2)
                    x.fillStyle = 'rgba(200,255,230,0.15)'; x.fill()
                }
            }
        })
        domeTex.repeat.set(4, 4)

        // --- Yashil panel (Agro) ---
        const agriTex = this._makeTex(256, (x, s) => {
            x.fillStyle = '#4CAF50'; x.fillRect(0, 0, s, s)
            x.strokeStyle = 'rgba(255,255,255,0.15)'; x.lineWidth = 2
            for(let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(0, i*32); x.lineTo(s, i*32); x.stroke() }
        })
        agriTex.repeat.set(4, 2)

        // Materiallar
        this.mBrick    = new THREE.MeshStandardMaterial({map: brickTex, roughness: 0.85})
        this.mConcrete = new THREE.MeshStandardMaterial({map: concreteTex, roughness: 0.9})
        this.mGlass    = new THREE.MeshStandardMaterial({map: glassTex, roughness: 0.2, metalness: 0.5})
        this.mDome     = new THREE.MeshStandardMaterial({map: domeTex, roughness: 0.6})
        this.mGold     = new THREE.MeshStandardMaterial({color: 0xE8B830, roughness: 0.2, metalness: 0.8})
        this.mRed      = new THREE.MeshStandardMaterial({color: 0xC62828, roughness: 0.7})
        this.mYellow   = new THREE.MeshStandardMaterial({color: 0xF9A825, roughness: 0.6})
        this.mPurple   = new THREE.MeshStandardMaterial({color: 0x6A1B9A, roughness: 0.6})
        this.mWhite    = new THREE.MeshStandardMaterial({color: 0xECEFF1, roughness: 0.5})
        this.mGreen    = new THREE.MeshStandardMaterial({map: agriTex, roughness: 0.8})
        this.mDark     = new THREE.MeshStandardMaterial({color: 0x111111, roughness: 1.0})
        this.mBase     = new THREE.MeshStandardMaterial({color: 0xD7CCC8, roughness: 0.95})
    }

    buildMarket(id, x, y)
    {
        const group = new THREE.Group()
        group.position.set(x, y, 0)

        if(id === 'chorsu')       this._buildChorsu(group)
        else if(id === 'korzinka') this._buildKorzinka(group)
        else if(id === 'erkin')   this._buildErkin(group)
        else if(id === 'agro')    this._buildAgro(group)
        else if(id === 'indenim') this._buildIndenim(group)

        group.traverse(child => {
            if(child.isMesh) { child.castShadow = true; child.receiveShadow = true }
        })

        // Kichikroq (ixcham) hajm
        group.scale.set(0.38, 0.38, 0.38)
        return group
    }

    // ─── 1. CHORSU BOZOR ─ Klassik sharq gumbazli bozor ───────────────────────
    _buildChorsu(g)
    {
        const R = 14, archH = 8, drumH = 4

        // Platforma
        g.add(this._cyl(R + 1, R + 2, 1.5, 32, this.mBase, 0, 0, 0.75))

        // 12 ta arka ustunlari
        for(let i = 0; i < 12; i++) {
            const ang = (i / 12) * Math.PI * 2
            const cx = Math.cos(ang) * (R - 1.5), cy = Math.sin(ang) * (R - 1.5)
            // Ustun
            g.add(this._box(1.8, 2.5, archH, this.mBrick, cx, cy, 1.5 + archH/2))
            // Arka tepasi
            g.add(this._box(2.5, 2.5, 1.5, this.mBrick, cx, cy, 1.5 + archH))
            // Kichik gumbazcha uchida
            const capM = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 6, 0, Math.PI*2, 0, Math.PI/2), this.mDome)
            capM.rotation.x = Math.PI / 2
            capM.position.set(cx, cy, 1.5 + archH + 1.4)
            g.add(capM)
        }

        // Ichki devor
        g.add(this._cyl(R - 3, R - 2, archH, 32, this.mBrick, 0, 0, 1.5 + archH/2))

        // Baraban
        g.add(this._cyl(R - 4, R - 3, drumH, 32, this.mBrick, 0, 0, 1.5 + archH + drumH/2))

        // Asosiy gumbaz
        const dome = new THREE.Mesh(new THREE.SphereGeometry(R - 2, 32, 20, 0, Math.PI*2, 0, Math.PI/2), this.mDome)
        dome.rotation.x = Math.PI / 2
        dome.position.z = 1.5 + archH + drumH
        g.add(dome)

        // Yuqori kichik gumbazcha + shpil
        const dome2 = new THREE.Mesh(new THREE.SphereGeometry(2.5, 16, 10, 0, Math.PI*2, 0, Math.PI/2), this.mDome)
        dome2.rotation.x = Math.PI / 2
        dome2.position.z = 1.5 + archH + drumH + (R-2) - 1
        g.add(dome2)

        const spire = new THREE.Mesh(new THREE.ConeGeometry(0.35, 3, 8), this.mGold)
        spire.rotation.x = Math.PI / 2
        spire.position.z = 1.5 + archH + drumH + (R-2) + 1.5 + 2.5
        g.add(spire)

        // Old kirish darvozasi
        g.add(this._box(4, 1.5, 5, this.mBrick, 0, -(R+1), 3.5))
        g.add(this._box(3, 1, 3, this.mDome, 0, -(R+1), 6.5))
    }

    // ─── 2. KORZINKA ─ Zamonaviy 3 qavatli supermarket ────────────────────────
    _buildKorzinka(g)
    {
        const W = 18, D = 14, flH = 4

        // Asos platforma
        g.add(this._box(W + 3, D + 3, 1, this.mBase, 0, 0, 0.5))

        // 3 qavat
        const colors = [this.mConcrete, this.mGlass, this.mRed]
        for(let fl = 0; fl < 3; fl++) {
            const z0 = 1 + fl * flH
            // Asosiy blok
            const m = fl === 1 ? this.mGlass : (fl === 0 ? this.mConcrete : this.mRed)
            g.add(this._box(W, D, flH - 0.3, m, 0, 0, z0 + (flH - 0.3)/2))
            // Qavat sathi plita
            g.add(this._box(W + 0.5, D + 0.5, 0.3, this.mConcrete, 0, 0, z0 + flH - 0.15))
        }

        // Yuqori "K" logo paneli
        g.add(this._box(W + 0.5, 0.8, 2, this.mRed, 0, -(D/2 + 0.4), 1 + 3*flH + 1))
        this._addText3D(g, 'KORZINKA', W, 0, -(D/2 + 0.5), 1 + 3*flH + 1.8, 0xffffff)

        // Old vitrina ustunlari
        for(let i = -1; i <= 1; i++) {
            g.add(this._box(0.8, 1, flH * 3, this.mWhite, i * 7, -(D/2), 1 + flH*1.5))
        }

        // Kirish eshik ayvoni
        g.add(this._box(8, 3, 0.4, this.mConcrete, 0, -(D/2 + 1.5), 1 + flH - 0.5))
        g.add(this._box(7.5, 0.3, flH - 0.5, this.mGlass, 0, -(D/2 + 0.15), 1 + (flH-0.5)/2))

        // Yonboshda tovar qabul eshigi
        g.add(this._box(0.4, 4, flH - 1, this.mDark, W/2, 3, 1 + (flH-1)/2))
    }

    // ─── 3. ERKIN SAVDO ─ L-shaklda 2 qavatli bozor ───────────────────────────
    _buildErkin(g)
    {
        const flH = 5

        // L shaklining 2 qo'li
        // Gorizontal qo'l
        g.add(this._box(20, 8, flH, this.mBrick, 0, -3, flH/2))
        g.add(this._box(20, 8, flH - 0.4, this.mGlass, 0, -3, flH + (flH-0.4)/2))
        g.add(this._box(20.5, 8.5, 0.5, this.mConcrete, 0, -3, flH + flH - 0.15))

        // Vertikal qo'l
        g.add(this._box(8, 10, flH, this.mBrick, -6, 5, flH/2))
        g.add(this._box(8, 10, flH - 0.4, this.mGlass, -6, 5, flH + (flH-0.4)/2))
        g.add(this._box(8.5, 10.5, 0.5, this.mConcrete, -6, 5, flH + flH - 0.15))

        // Burchak qo'riqchi minora
        g.add(this._cyl(1.2, 1.4, flH * 2 + 2, 8, this.mConcrete, -10, -7, (flH*2+2)/2))
        const towerCap = new THREE.Mesh(new THREE.ConeGeometry(2, 2, 8), this.mGold)
        towerCap.rotation.x = Math.PI / 2
        towerCap.position.set(-10, -7, flH*2 + 2 + 1)
        g.add(towerCap)

        // "ERKIN SAVDO" belgisi
        g.add(this._box(16, 0.5, 2, this.mGold, 0, -7.25, flH*2 + 1.5))

        // Asos platforma
        g.add(this._box(24, 20, 0.8, this.mBase, -2, 0, 0.4))
    }

    // ─── 4. AGRO BRAVO ─ Katta omborlik + do'kon ───────────────────────────────
    _buildAgro(g)
    {
        const W = 22, D = 12

        // Asos
        g.add(this._box(W + 2, D + 2, 0.8, this.mBase, 0, 0, 0.4))

        // Asosiy ombor binosi (yumaloq tom)
        const bodyH = 8
        g.add(this._box(W, D, bodyH, this.mConcrete, 0, 0, 0.8 + bodyH/2))

        // Yumaloq tom (CylinderGeometry - yarim silindr ombor turi)
        const roofGeo = new THREE.CylinderGeometry(D/2, D/2, W, 20, 1, false, 0, Math.PI)
        const roof = new THREE.Mesh(roofGeo, this.mGreen)
        roof.rotation.z = Math.PI / 2
        roof.rotation.y = Math.PI / 2
        roof.position.set(0, 0, 0.8 + bodyH + D/2 - 1)
        g.add(roof)

        // Old qism - do'kon fasadi
        g.add(this._box(W, 1, bodyH, this.mGlass, 0, -(D/2), 0.8 + bodyH/2))

        // Logo panel
        g.add(this._box(W, 0.3, 2.5, this.mYellow, 0, -(D/2 + 0.15), 0.8 + bodyH + 1.2))
        this._addText3D(g, 'AGRO BRAVO', W - 2, 0, -(D/2 + 0.3), 0.8 + bodyH + 2, 0x111111)

        // Yon yuk eshiklarini chizish (beton plitkalar)
        for(let i = -1; i <= 1; i += 2) {
            g.add(this._box(4, 0.5, 4, this.mDark, i * 7, -(D/2), 0.8 + 2))
        }

        // Kichik xodimlar uchun kirish
        g.add(this._box(3, 0.4, bodyH, this.mDark, -9, D/2, 0.8 + bodyH/2))
    }

    // ─── 5. INDENIM ─ Minorali zamonaviy savdo markazi ─────────────────────────
    _buildIndenim(g)
    {
        const W = 14, D = 10, fl = 4, floors = 4

        // Asos
        g.add(this._box(W + 4, D + 4, 0.8, this.mBase, 0, 0, 0.4))

        // Asosiy bino bloki
        for(let i = 0; i < floors; i++) {
            const z0 = 0.8 + i * fl
            const shrink = i * 0.5 // Yuqoriga ko'tarilganda torayadi
            g.add(this._box(W - shrink*2, D - shrink, fl - 0.3, i % 2 === 0 ? this.mConcrete : this.mGlass,
                0, 0, z0 + (fl - 0.3)/2))
            g.add(this._box(W - shrink*2 + 0.5, D - shrink + 0.5, 0.3, this.mPurple, 0, 0, z0 + fl - 0.15))
        }

        // 2 ta yonbosh minora
        const tH = floors * fl + 6
        ;[-1, 1].forEach(side => {
            const tx = side * (W/2 + 1.5)
            // Minora tanasi
            g.add(this._cyl(1.8, 2.2, tH, 12, this.mConcrete, tx, 0, 0.8 + tH/2))
            // Minora ko'k belbog'i
            for(let b = 1; b <= 4; b++) {
                g.add(this._box(0.3, 0.3, 0.5, this.mPurple, tx + Math.cos(b*1.57)*1.85, Math.sin(b*1.57)*1.85, 0.8 + tH*0.65))
            }
            // Minora qalpoqchasi
            const cap = new THREE.Mesh(new THREE.ConeGeometry(2, 3.5, 12), this.mPurple)
            cap.rotation.x = Math.PI / 2
            cap.position.set(tx, 0, 0.8 + tH + 1.75)
            g.add(cap)
            // Minora shpili
            const sp = new THREE.Mesh(new THREE.ConeGeometry(0.2, 2, 6), this.mGold)
            sp.rotation.x = Math.PI / 2
            sp.position.set(tx, 0, 0.8 + tH + 3.5 + 1)
            g.add(sp)
        })

        // "INDENIM" logo paneli
        g.add(this._box(W, 0.4, 2, this.mPurple, 0, -(D/2 + 0.2), 0.8 + floors*fl + 1.5))
    }

    // ─── Yordamchi qurilish funksiyalari ──────────────────────────────────────
    _box(w, d, h, mat, x=0, y=0, z=0) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, d, h), mat)
        m.position.set(x, y, z)
        return m
    }

    _cyl(rTop, rBot, h, seg, mat, x=0, y=0, z=0) {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), mat)
        m.rotation.x = Math.PI / 2
        m.position.set(x, y, z)
        return m
    }

    _addText3D(g, text, maxW, x, y, z, color) {
        const cv = document.createElement('canvas')
        cv.width = 512; cv.height = 64
        const ctx = cv.getContext('2d')
        ctx.clearRect(0, 0, 512, 64)
        ctx.fillStyle = '#' + color.toString(16).padStart(6, '0')
        ctx.font = 'bold 44px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(text, 256, 32)
        const tex = new THREE.CanvasTexture(cv)
        const m = new THREE.Mesh(new THREE.PlaneGeometry(maxW * 0.9, 1.4),
            new THREE.MeshBasicMaterial({ map: tex, transparent: true }))
        m.position.set(x, y, z)
        g.add(m)
    }
}
