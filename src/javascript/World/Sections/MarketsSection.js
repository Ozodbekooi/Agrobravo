import * as THREE from 'three'
import ProjectBoardMaterial from '../../Materials/ProjectBoard.js'
import gsap from 'gsap'
import MarketBuilder from './MarketBuilder.js'

export default class MarketsSection
{
    constructor(_options)
    {
        this.time      = _options.time
        this.resources = _options.resources
        this.objects   = _options.objects
        this.zones     = _options.zones
        this.tiles     = _options.tiles
        this.debug     = _options.debug
        this.car       = _options.car || window.carInstance
        this.x         = _options.x
        this.y         = _options.y

        this.container = new THREE.Object3D()
        // matrixAutoUpdate = true (default) kerak, chunki ichiga dinamik ob'ektlar qo'shamiz

        // Atrofni yoritish uchun kuchliroq chiroqlar
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
        this.container.add(ambientLight)
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5)
        dirLight.position.set(50, 100, 50)
        this.container.add(dirLight)

        this.marketBuilder = new MarketBuilder()

        // 5 ta savdo markazi (Kvartallar bo'yicha)
        this.markets = [
            {
                id: 'chorsu', name: "Chorsu Bozor", emoji: '🕌', color: '#0288d1',
                offsetX: -50, offsetY: 50, // Shimoliy-G'arb
            },
            {
                id: 'korzinka', name: "Korzinka", emoji: '🛒', color: '#d32f2f',
                offsetX: 50, offsetY: 50, // Shimoliy-Sharq
            },
            {
                id: 'erkin', name: "Erkin Savdo", emoji: '🏬', color: '#388e3c',
                offsetX: -50, offsetY: -50, // Janubiy-G'arb
            },
            {
                id: 'indenim', name: "Indenim", emoji: '🏢', color: '#7b1fa2',
                offsetX: 50, offsetY: -50, // Janubiy-Sharq
            },
            {
                id: 'agro', name: "Agro Bravo", emoji: '🌾', color: '#fbc02d',
                offsetX: 130, offsetY: 50, // Uzoq Sharq
            }
        ]

        this.parkingSpots = []
        this.parkPrompt = document.querySelector('.js-park-prompt')
        this.isPromptVisible = false
        this.readySpot = null
        this.isPersonWalking = false

        this._buildMarkets()
        this._buildMainRoad()
        this._buildRoadSigns()
        this._setParkingLogic()
    }

    _buildMarkets()
    {
        for(const market of this.markets)
        {
            const mx = this.x + market.offsetX
            const my = this.y + market.offsetY

            // 1. Yangi Protsedurali Binoni qurish (MarketBuilder orqali)
            const buildingMesh = this.marketBuilder.buildMarket(market.id, mx, my)
            this.container.add(buildingMesh)

            // 2. Peshlavha (Board)
            // Binoning oldiga qo'yish uchun Y o'qi bo'ylab biroz suramiz (markazga qarab)
            const boardY = market.offsetY > 0 ? my - 25 : my + 25
            
            this.objects.add({
                base:               this.resources.items.projectsBoardStructure.scene,
                collision:          this.resources.items.projectsBoardCollision.scene,
                floorShadowTexture: this.resources.items.projectsBoardStructureFloorShadowTexture,
                offset:     new THREE.Vector3(mx, boardY, 0),
                rotation:   new THREE.Euler(0, 0, market.offsetY > 0 ? 0 : Math.PI), // Yuzini yo'lga qaratamiz
                duplicated: true,
                mass:       0
            })

            const plane = this.resources.items.projectsBoardPlane.scene.children[0].clone()
            plane.position.set(mx, boardY, 0)
            plane.rotation.y = market.offsetY > 0 ? 0 : Math.PI
            plane.matrixAutoUpdate = false
            plane.updateMatrix()

            const bmat = new ProjectBoardMaterial()
            bmat.uniforms.uColor.value = new THREE.Color(market.color)
            bmat.uniforms.uTexture.value = this._makeTitleTexture(market)
            bmat.uniforms.uTextureAlpha.value = 1
            plane.material = bmat

            this.container.add(plane)

            // 3. 20 talik parkovka
            const parkY = market.offsetY > 0 ? boardY - 10 : boardY + 10
            this._draw20ParkingSpots(mx, parkY, market)
        }
    }

    _draw20ParkingSpots(cx, cy, market)
    {
        const cols = 10
        const rows = 2
        const spotW = 3 
        const spotH = 5 
        
        const totalW = cols * spotW
        const totalH = rows * spotH

        const S = 1024
        const canvas = document.createElement('canvas')
        canvas.width  = S
        canvas.height = S
        const ctx = canvas.getContext('2d')

        const scaleX = S / totalW
        const scaleY = S / totalH

        ctx.fillStyle = market.color + '33'
        ctx.fillRect(0, 0, S, S)

        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 4

        const startX = cx - totalW / 2
        const startY = cy - totalH / 2

        for(let r = 0; r < rows; r++) {
            for(let c = 0; c < cols; c++) {
                const px = c * spotW * scaleX
                const py = r * spotH * scaleY
                const psw = spotW * scaleX
                const psh = spotH * scaleY

                ctx.strokeRect(px, py, psw, psh)

                ctx.fillStyle = 'rgba(255,255,255,0.4)'
                ctx.font = 'bold 36px Arial'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText('P', px + psw/2, py + psh/2)

                const spotCenterX = startX + c * spotW + spotW / 2
                const spotCenterY = startY + r * spotH + spotH / 2

                this.parkingSpots.push({
                    market: market,
                    x: spotCenterX,
                    y: spotCenterY,
                    w: spotW,
                    h: spotH
                })
            }
        }

        const tex = new THREE.CanvasTexture(canvas)
        tex.needsUpdate = true

        const mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(totalW, totalH),
            new THREE.MeshBasicMaterial({
                map:         tex,
                transparent: true,
                depthWrite:  false,
                opacity:     0.9
            })
        )
        mesh.position.set(cx, cy, 0.05)
        mesh.matrixAutoUpdate = false
        mesh.updateMatrix()
        this.container.add(mesh)
    }

    _buildMainRoad()
    {
        // ─── Yo'l materiallari ───────────────────────────────────────────────────
        const asphaltTex = (() => {
            const cv = document.createElement('canvas')
            cv.width = 512; cv.height = 512
            const ctx = cv.getContext('2d')
            // Asfalt rang
            ctx.fillStyle = '#2C2C2C'; ctx.fillRect(0, 0, 512, 512)
            // Mayda chiziqlar
            ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1
            for(let i = 0; i < 40; i++) {
                ctx.beginPath(); ctx.moveTo(0, i*13); ctx.lineTo(512, i*13); ctx.stroke()
            }
            const t = new THREE.CanvasTexture(cv)
            t.wrapS = t.wrapT = THREE.RepeatWrapping
            t.repeat.set(4, 20)
            return t
        })()
        const asphaltMat = new THREE.MeshStandardMaterial({
            map: asphaltTex, roughness: 0.95, color: 0x303030
        })

        // ─── 2 tomonlama yo'l ─────────────────────────────────────────────────
        const ROAD_W  = 16   // Yo'l kengligi (ikki shart)
        const ROAD_LEN_H = 300  // Gorizontal yo'l uzunligi
        const ROAD_LEN_V = 250  // Vertikal yo'l uzunligi

        // Gorizontal yo'l
        const hRoad = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_LEN_H, ROAD_W), asphaltMat)
        hRoad.position.set(this.x + 30, this.y, 0.05)
        this.container.add(hRoad)

        // Vertikal yo'l
        const vRoad = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, ROAD_LEN_V), asphaltMat)
        vRoad.position.set(this.x, this.y, 0.05)
        this.container.add(vRoad)

        // ─── Chiziqlar (Lane markings) ─────────────────────────────────────────
        this._drawLaneMarkings(this.x + 30, this.y, ROAD_LEN_H, ROAD_W, false)
        this._drawLaneMarkings(this.x, this.y, ROAD_W, ROAD_LEN_V, true)

        // ─── Yo'l yon boshqirmalari (Qirg'oqchalar) ───────────────────────────
        const curbMat = new THREE.MeshStandardMaterial({color: 0x9E9E9E, roughness: 1})
        // Gorizontal yo'l qirg'oqlari
        ;[-1, 1].forEach(s => {
            const c = new THREE.Mesh(new THREE.BoxGeometry(ROAD_LEN_H, 0.8, 0.25), curbMat)
            c.position.set(this.x + 30, this.y + s * (ROAD_W / 2 + 0.4), 0.12)
            this.container.add(c)
        })
        // Vertikal yo'l qirg'oqlari
        ;[-1, 1].forEach(s => {
            const c = new THREE.Mesh(new THREE.BoxGeometry(0.8, ROAD_LEN_V, 0.25), curbMat)
            c.position.set(this.x + s * (ROAD_W / 2 + 0.4), this.y, 0.12)
            this.container.add(c)
        })

        // ─── Daraxtlar ─────────────────────────────────────────────────────────
        // Gorizontal yo'l bo'ylab daraxtlar
        const hStart = this.x + 30 - ROAD_LEN_H / 2 + 10
        for(let i = 0; i < 20; i++) {
            const tx = hStart + i * 14
            this._addTree(tx, this.y + ROAD_W / 2 + 2.5)   // yuqori tomon
            this._addTree(tx, this.y - ROAD_W / 2 - 2.5)   // pastki tomon
        }

        // Vertikal yo'l bo'ylab daraxtlar
        const vStart = this.y - ROAD_LEN_V / 2 + 10
        for(let i = 0; i < 16; i++) {
            const ty = vStart + i * 14
            this._addTree(this.x + ROAD_W / 2 + 2.5, ty)   // o'ng tomon
            this._addTree(this.x - ROAD_W / 2 - 2.5, ty)   // chap tomon
        }
    }

    _drawLaneMarkings(cx, cy, lenX, lenY, vertical)
    {
        // Markaziy sariq qator chiziqlar (ikki tomonlama belgisi)
        const dashLen = vertical ? lenY / 16 : lenX / 16
        const dashW   = 0.25
        const cnt     = 20
        const yellowMat = new THREE.MeshStandardMaterial({color: 0xFFD600, roughness: 0.9, emissive: 0xFFD600, emissiveIntensity: 0.08})
        const whiteMat  = new THREE.MeshStandardMaterial({color: 0xFFFFFF, roughness: 0.9, emissive: 0xFFFFFF, emissiveIntensity: 0.05})

        for(let i = 0; i < cnt; i++) {
            const t = (i / cnt - 0.5)
            const px = vertical ? cx : cx + t * lenX
            const py = vertical ? cy + t * lenY : cy

            // Markaziy sariq chiziq (xavafsizlik zonasi - ikkita parallel)
            ;[-0.35, 0.35].forEach(off => {
                const dash = new THREE.Mesh(
                    vertical
                        ? new THREE.BoxGeometry(dashW, dashLen * 0.65, 0.02)
                        : new THREE.BoxGeometry(dashLen * 0.65, dashW, 0.02),
                    yellowMat
                )
                dash.position.set(
                    vertical ? cx + off : px,
                    vertical ? py : cy + off,
                    0.07
                )
                this.container.add(dash)
            })

            // Oq yo'l chiziqlar (har bir yo'l chizig'i uchun - to'qima)
            ;[-lenY/4, lenY/4].forEach(laneOff => {
                if(Math.abs(laneOff) < 1) return
                const wDash = new THREE.Mesh(
                    vertical
                        ? new THREE.BoxGeometry(dashW * 0.7, dashLen * 0.5, 0.02)
                        : new THREE.BoxGeometry(dashLen * 0.5, dashW * 0.7, 0.02),
                    whiteMat
                )
                wDash.position.set(
                    vertical ? cx + laneOff : px,
                    vertical ? py : cy + laneOff,
                    0.07
                )
                this.container.add(wDash)
            })
        }
    }

    _addTree(x, y)
    {
        // Daraxt tanasi
        const trunkMat = new THREE.MeshStandardMaterial({color: 0x5D4037, roughness: 1.0})
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 2, 6), trunkMat)
        trunk.rotation.x = Math.PI / 2
        trunk.position.set(x, y, 1.2)
        this.container.add(trunk)

        // Barg qismi (ikki katlamalı)
        const leafMat = new THREE.MeshStandardMaterial({color: 0x2E7D32, roughness: 0.95})
        const leaf1 = new THREE.Mesh(new THREE.ConeGeometry(2.2, 3, 7), leafMat)
        leaf1.rotation.x = Math.PI / 2
        leaf1.position.set(x, y, 3.5)
        this.container.add(leaf1)

        const leaf2 = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2.5, 7), leafMat)
        leaf2.rotation.x = Math.PI / 2
        leaf2.position.set(x, y, 5.2)
        this.container.add(leaf2)
    }

    _buildRoadSigns()
    {
        // Chorrahada 4 yo'nalishga ishorat
        const signs = [
            { text: '← Chorsu Bozor', x: this.x - 2, y: this.y + 10, rot: 0 },
            { text: 'Korzinka →',     x: this.x + 2, y: this.y + 10, rot: 0 },
            { text: '← Erkin Savdo', x: this.x - 2, y: this.y - 10, rot: 0 },
            { text: 'Indenim →',      x: this.x + 2, y: this.y - 10, rot: 0 },
            { text: 'Agro Bravo →',   x: this.x + 2, y: this.y,      rot: Math.PI/2 },
        ]

        signs.forEach(s => {
            // Yog'och ustun
            const pillar = new THREE.Mesh(
                new THREE.CylinderGeometry(0.12, 0.15, 4.5, 6),
                new THREE.MeshStandardMaterial({color: 0x5D4037, roughness: 1})
            )
            pillar.rotation.x = Math.PI / 2
            pillar.position.set(s.x, s.y, 2.25)
            this.container.add(pillar)

            // Belgi taxtasi
            this._createSignBoard(s.text, s.x, s.y, 4.5, s.rot)
        })
    }

    _createSignBoard(text, x, y, z, rotationZ)
    {
        const canvas = document.createElement('canvas')
        canvas.width = 512
        canvas.height = 128
        const ctx = canvas.getContext('2d')
        
        ctx.fillStyle = '#1565c0'
        ctx.fillRect(0,0,512,128)
        
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 36px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(text, 256, 64)

        const tex = new THREE.CanvasTexture(canvas)
        const geo = new THREE.BoxGeometry(6, 1.5, 0.2)
        const mat = new THREE.MeshBasicMaterial({ map: tex })
        const mesh = new THREE.Mesh(geo, mat)

        mesh.position.set(x, y, z)
        mesh.rotation.x = Math.PI / 2
        mesh.rotation.y = rotationZ
        
        this.container.add(mesh)
    }

    _setParkingLogic()
    {
        this.time.on('tick', () => {
            if(!window.carInstance || !window.carInstance.chassis) return;
            
            const carX = window.carInstance.chassis.object.position.x
            const carY = window.carInstance.chassis.object.position.y
            
            const carW = 2.0
            const carH = 4.0

            let isFullyInsideAnySpot = false;
            let currentSpot = null;

            for(const spot of this.parkingSpots) {
                const distanceX = Math.abs(carX - spot.x);
                const distanceY = Math.abs(carY - spot.y);

                if(distanceX < (spot.w - carW)/2 && distanceY < (spot.h - carH)/2) {
                    isFullyInsideAnySpot = true;
                    currentSpot = spot;
                    break;
                }
            }

            const speed = window.carInstance.movement.speed.length()

            if(isFullyInsideAnySpot && speed < 0.1) {
                if(!this.isPromptVisible && !this.isPersonWalking) {
                    if(this.parkPrompt) this.parkPrompt.style.display = 'block';
                    this.isPromptVisible = true;
                    this.readySpot = currentSpot;
                }
            } else {
                if(this.isPromptVisible) {
                    if(this.parkPrompt) this.parkPrompt.style.display = 'none';
                    this.isPromptVisible = false;
                    this.readySpot = null;
                }
            }
        })

        // ENTER tugmasi bosilganda
        window.addEventListener('keydown', (e) => {
            if(e.code === 'Enter' && this.isPromptVisible && this.readySpot && !this.isPersonWalking) {
                if(this.parkPrompt) this.parkPrompt.style.display = 'none';
                this.isPromptVisible = false;
                this.isPersonWalking = true;
                this._triggerParkAnimation(this.readySpot);
            }
        })
    }

    _triggerParkAnimation(spot)
    {
        window.dispatchEvent(new CustomEvent('openShop', {
            detail: { shopData: spot.market }
        }))

        const carZ = window.carInstance.chassis.object.position.z
        
        const personGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8)
        const personMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
        const person = new THREE.Mesh(personGeo, personMat)
        
        person.position.set(spot.x - 1.5, spot.y, carZ + 0.75)
        person.rotation.x = Math.PI / 2
        this.container.add(person)

        const doorX = spot.market.offsetX
        const doorY = spot.market.offsetY

        gsap.to(person.position, {
            x: doorX,
            y: doorY,
            duration: 3,
            ease: "power1.inOut",
            onComplete: () => {
                gsap.to(person.material, { opacity: 0, transparent: true, duration: 0.5 })
                setTimeout(() => {
                    this.isPersonWalking = false; // keyingi safar yana kirish uchun ochamiz
                    // alert(`${spot.market.name} ichiga xush kelibsiz! (Odamcha kirdi)`)
                }, 500)
            }
        })
    }

    _makeTitleTexture(market)
    {
        const canvas = document.createElement('canvas')
        canvas.width  = 512
        canvas.height = 256
        const ctx = canvas.getContext('2d')

        const grad = ctx.createLinearGradient(0, 0, 0, 256)
        grad.addColorStop(0, market.color)
        grad.addColorStop(1, '#111')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, 512, 256)

        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 48px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(market.emoji + " " + market.name, 256, 128)

        const tex = new THREE.CanvasTexture(canvas)
        tex.needsUpdate = true
        return tex
    }
}
