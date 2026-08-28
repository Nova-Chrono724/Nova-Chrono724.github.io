/**
 * WebAura.lb — Interactive Agency Experience Engine
 * Lightweight, hardware-accelerated, zero-dependency ES2024 JavaScript.
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* ==========================================================================
     0. Page Preloader Dismissal Handler
     ========================================================================== */
  const pageLoader = document.getElementById('page-loader');
  function dismissLoader() {
    if (pageLoader && !pageLoader.classList.contains('loaded')) {
      pageLoader.classList.add('loaded');
      setTimeout(() => {
        if (pageLoader) pageLoader.style.display = 'none';
      }, 550);
    }
  }

  // Dismiss loader on window load with immediate safety timeout
  if (document.readyState === 'complete') {
    dismissLoader();
  } else {
    window.addEventListener('load', dismissLoader);
    setTimeout(dismissLoader, 600); // Guarantees smooth dismissal in under 600ms
  }

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==========================================================================
     1. 3D Spatial Projection Engine & Fly-Through Canvas
     ========================================================================== */
  const canvas = document.getElementById('hero-canvas');
  const spatialHudText = document.getElementById('spatial-hud-text');
  
  const scrollState = {
    targetY: window.scrollY,
    currentY: window.scrollY,
    velocity: 0
  };

  const mouse = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2,
    normX: 0,
    normY: 0
  };

  let ctx = null;
  let width = window.innerWidth;
  let height = window.innerHeight;
  let stars = [];
  let polyhedra = [];
  const focalLength = 650;

  if (canvas && !prefersReducedMotion) {
    ctx = canvas.getContext('2d');
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    // 3D Depth Starfield Nodes
    const starCount = Math.min(Math.floor((width * height) / 11000), 130);

    class Star3D {
      constructor() {
        this.reset(true);
      }

      reset(initial = false) {
        this.x = (Math.random() - 0.5) * width * 2.8;
        this.y = (Math.random() - 0.5) * height * 2.8;
        this.z = initial ? Math.random() * 1400 - 300 : 1100 + Math.random() * 200;
        this.pz = this.z;
        this.size = Math.random() * 1.8 + 0.6;
        this.hue = Math.random() > 0.25 ? '0, 240, 255' : '139, 92, 246';
        this.baseAlpha = Math.random() * 0.55 + 0.3;
      }

      update(speed) {
        this.pz = this.z;
        this.z -= speed;

        if (this.z < -200) {
          this.reset(false);
        } else if (this.z > 1400) {
          this.z = -100;
        }
      }

      draw() {
        const scale = focalLength / (focalLength + this.z);
        if (scale <= 0) return;

        const camX = mouse.normX * 90;
        const camY = mouse.normY * 70;

        const screenX = width / 2 + (this.x - camX) * scale;
        const screenY = height / 2 + (this.y - camY) * scale;

        if (screenX < -20 || screenX > width + 20 || screenY < -20 || screenY > height + 20) return;

        const prevScale = focalLength / (focalLength + this.pz);
        const prevScreenX = width / 2 + (this.x - camX) * prevScale;
        const prevScreenY = height / 2 + (this.y - camY) * prevScale;

        const alpha = Math.min(Math.max((1 - this.z / 1300) * this.baseAlpha, 0.05), 1);

        // Warp speed streak on fast scroll
        if (Math.abs(scrollState.velocity) > 2.5) {
          ctx.beginPath();
          ctx.moveTo(prevScreenX, prevScreenY);
          ctx.lineTo(screenX, screenY);
          ctx.strokeStyle = `rgba(${this.hue}, ${alpha * 0.85})`;
          ctx.lineWidth = Math.max(this.size * scale * 1.4, 0.8);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(screenX, screenY, Math.max(this.size * scale, 0.6), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${this.hue}, ${alpha})`;
          ctx.fill();
        }
      }
    }

    for (let i = 0; i < starCount; i++) {
      stars.push(new Star3D());
    }

    // 3D Rotating Polyhedron (Icosahedron Crystal Mesh)
    class WireframePolyhedron3D {
      constructor(x, y, z, radius) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.radius = radius;
        this.rotX = Math.random() * Math.PI;
        this.rotY = Math.random() * Math.PI;
        this.rotZ = 0;

        const phi = (1 + Math.sqrt(5)) / 2;
        const rawVertices = [
          [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
          [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
          [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
        ];

        this.vertices = rawVertices.map(([vx, vy, vz]) => {
          const len = Math.sqrt(vx * vx + vy * vy + vz * vz);
          return [vx / len, vy / len, vz / len];
        });

        this.edges = [
          [0, 11], [0, 5], [0, 1], [0, 7], [0, 10],
          [1, 5], [5, 11], [11, 10], [10, 7], [7, 1],
          [3, 9], [3, 4], [3, 2], [3, 6], [3, 8],
          [9, 4], [4, 2], [2, 6], [6, 8], [8, 9],
          [4, 11], [11, 2], [2, 10], [10, 6], [6, 7],
          [7, 8], [8, 1], [1, 9], [9, 5], [5, 4]
        ];
      }

      update(deltaScroll) {
        this.rotX += 0.005 + deltaScroll * 0.0012;
        this.rotY += 0.008 + mouse.normX * 0.008;
        this.rotZ += 0.003;
      }

      draw() {
        const projected = [];
        const cosX = Math.cos(this.rotX), sinX = Math.sin(this.rotX);
        const cosY = Math.cos(this.rotY), sinY = Math.sin(this.rotY);
        const cosZ = Math.cos(this.rotZ), sinZ = Math.sin(this.rotZ);

        for (let i = 0; i < this.vertices.length; i++) {
          const [vx, vy, vz] = this.vertices[i];
          let rx = vx * this.radius;
          let ry = vy * this.radius;
          let rz = vz * this.radius;

          // Euler Rotation 3D
          let x1 = rx * cosY + rz * sinY;
          let y1 = ry;
          let z1 = -rx * sinY + rz * cosY;

          let x2 = x1;
          let y2 = y1 * cosX - z1 * sinX;
          let z2 = y1 * sinX + z1 * cosX;

          let x3 = x2 * cosZ - y2 * sinZ;
          let y3 = x2 * sinZ + y2 * cosZ;
          let z3 = z2;

          const worldX = this.x + x3 - mouse.normX * 70;
          const worldY = this.y + y3 - mouse.normY * 50;
          const worldZ = this.z + z3;

          const scale = focalLength / (focalLength + worldZ);
          const px = width / 2 + worldX * scale;
          const py = height / 2 + worldY * scale;

          projected.push({ x: px, y: py, scale, z: worldZ });
        }

        // Draw 3D Edges
        for (let i = 0; i < this.edges.length; i++) {
          const [i1, i2] = this.edges[i];
          const p1 = projected[i1];
          const p2 = projected[i2];

          const avgZ = (p1.z + p2.z) / 2;
          const alpha = Math.max((1 - avgZ / 950) * 0.26, 0.04);

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Draw Vertices Nodes
        for (let i = 0; i < projected.length; i++) {
          const p = projected[i];
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.2 * p.scale, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
          ctx.fill();
        }
      }
    }

    polyhedra = [
      new WireframePolyhedron3D(width * 0.32, -height * 0.16, 280, 110),
      new WireframePolyhedron3D(-width * 0.34, height * 0.22, 420, 90)
    ];

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      if (polyhedra.length >= 2) {
        polyhedra[0].x = width * 0.32;
        polyhedra[1].x = -width * 0.34;
      }
    }, { passive: true });
  }

  // Mouse vector tracking
  window.addEventListener('mousemove', (e) => {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
    mouse.normX = (e.clientX / window.innerWidth) - 0.5;
    mouse.normY = (e.clientY / window.innerHeight) - 0.5;
  }, { passive: true });

  window.addEventListener('scroll', () => {
    scrollState.targetY = window.scrollY;
  }, { passive: true });

  /* ==========================================================================
     2. 3D Scroll Matrix DOM Engine
     ========================================================================== */
  const scrollCards = document.querySelectorAll(
    '.service-card, .project-card, .process-step, .benefit-card, .testimonial-card'
  );

  function main3DLoop() {
    // Smooth Lerp Physics
    const prevY = scrollState.currentY;
    scrollState.currentY += (scrollState.targetY - scrollState.currentY) * 0.085;
    scrollState.velocity = scrollState.currentY - prevY;

    mouse.x += (mouse.targetX - mouse.x) * 0.06;
    mouse.y += (mouse.targetY - mouse.y) * 0.06;

    // Render 3D Canvas
    if (ctx) {
      ctx.clearRect(0, 0, width, height);

      const flightSpeed = 0.75 + scrollState.velocity * 0.4;
      for (let i = 0; i < stars.length; i++) {
        stars[i].update(flightSpeed);
        stars[i].draw();
      }

      for (let i = 0; i < polyhedra.length; i++) {
        polyhedra[i].update(scrollState.velocity);
        polyhedra[i].draw();
      }
    }

    // Scroll-Driven 3D Card Transforms
    if (!prefersReducedMotion && scrollCards.length > 0) {
      const windowHeight = window.innerHeight;
      const centerY = windowHeight / 2;

      scrollCards.forEach(card => {
        const rect = card.getBoundingClientRect();

        if (rect.bottom >= -120 && rect.top <= windowHeight + 120) {
          const cardCenterY = rect.top + rect.height / 2;
          const distNormalized = (cardCenterY - centerY) / centerY; // -1 to +1

          const isHovered = card.matches(':hover');
          const hoverZ = isHovered ? 24 : 0;

          // 3D Pitch, Yaw, and Depth calculations
          const pitch = (distNormalized * -7.5) + (scrollState.velocity * 0.06);
          const yaw = mouse.normX * 4.5;
          const depthZ = -Math.abs(distNormalized) * 40 + hoverZ;
          const scale = (1 - Math.abs(distNormalized) * 0.025) * (isHovered ? 1.02 : 1);

          card.style.transform = `perspective(1200px) translate3d(0, 0, ${depthZ.toFixed(1)}px) rotateX(${pitch.toFixed(2)}deg) rotateY(${yaw.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        }
      });
    }

    // Update 3D Telemetry HUD
    if (spatialHudText) {
      const zDepth = Math.round(scrollState.currentY * 0.75);
      const pitchAngle = (scrollState.velocity * 0.05).toFixed(1);
      spatialHudText.textContent = `3D SPATIAL // Z-DEPTH: -${zDepth}px | PITCH: ${pitchAngle}° | LERP: 60FPS`;
    }

    requestAnimationFrame(main3DLoop);
  }

  main3DLoop();

  /* ==========================================================================
     2. Sticky Navigation Bar & Mobile Menu Drawer
     ========================================================================== */
  const navbar = document.getElementById('navbar');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuIconBars = document.getElementById('menu-icon-bars');
  const menuIconClose = document.getElementById('menu-icon-close');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  // Sticky navbar shadow on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('navbar-scrolled');
    } else {
      navbar.classList.remove('navbar-scrolled');
    }
  }, { passive: true });

  // Mobile menu toggle
  function toggleMobileMenu(forceClose = false) {
    const isOpen = forceClose ? false : !mobileMenu.classList.contains('open');
    if (isOpen) {
      mobileMenu.classList.add('open');
      mobileMenuBtn.setAttribute('aria-expanded', 'true');
      menuIconBars.classList.add('hidden');
      menuIconClose.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    } else {
      mobileMenu.classList.remove('open');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
      menuIconBars.classList.remove('hidden');
      menuIconClose.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => toggleMobileMenu());
  }

  mobileLinks.forEach(link => {
    link.addEventListener('click', () => toggleMobileMenu(true));
  });

  /* ==========================================================================
     3. Spotlight Glow Tracker on Cards
     ========================================================================== */
  const spotlightCards = document.querySelectorAll('.spotlight-card');
  spotlightCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  /* ==========================================================================
     4. 3D Perspective Tilt Card & Interactive Showcase
     ========================================================================== */
  const tiltContainer = document.querySelector('.tilt-container');
  const tiltCard = document.getElementById('tilt-card');
  const tiltGlare = document.getElementById('tilt-glare');
  const showcaseViewport = document.getElementById('showcase-viewport');
  const viewDesktopBtn = document.getElementById('view-desktop-btn');
  const viewTabletBtn = document.getElementById('view-tablet-btn');
  const viewMobileBtn = document.getElementById('view-mobile-btn');
  const interactiveDemoBtn = document.getElementById('interactive-demo-btn');
  const demoStatusText = document.getElementById('demo-status-text');

  if (tiltContainer && tiltCard && !prefersReducedMotion) {
    tiltContainer.addEventListener('mousemove', (e) => {
      const rect = tiltContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -7; // Max tilt 7deg
      const rotateY = ((x - centerX) / centerX) * 7;

      tiltCard.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
      
      if (tiltGlare) {
        tiltGlare.style.opacity = '1';
        tiltGlare.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
      }
    });

    tiltContainer.addEventListener('mouseleave', () => {
      tiltCard.style.transform = 'rotateX(0deg) rotateY(0deg)';
      if (tiltGlare) {
        tiltGlare.style.opacity = '0';
      }
    });
  }

  // Device Viewport Mode Toggles
  const viewportBtns = [viewDesktopBtn, viewTabletBtn, viewMobileBtn];
  function setViewportMode(btn, maxWidth) {
    viewportBtns.forEach(b => b.classList.remove('active', 'bg-white/10', 'text-white'));
    viewportBtns.forEach(b => b.classList.add('text-slate-400'));
    btn.classList.add('active', 'bg-white/10', 'text-white');
    btn.classList.remove('text-slate-400');
    
    if (showcaseViewport) {
      showcaseViewport.style.maxWidth = maxWidth;
      showcaseViewport.style.margin = '0 auto';
    }
  }

  if (viewDesktopBtn) viewDesktopBtn.addEventListener('click', () => setViewportMode(viewDesktopBtn, '100%'));
  if (viewTabletBtn) viewTabletBtn.addEventListener('click', () => setViewportMode(viewTabletBtn, '768px'));
  if (viewMobileBtn) viewMobileBtn.addEventListener('click', () => setViewportMode(viewMobileBtn, '420px'));

  // Test Interaction Trigger inside Showcase
  if (interactiveDemoBtn && demoStatusText) {
    let clickCount = 0;
    const feedbackStates = [
      '⚡ Telemetry event fired: 100% Core Web Vitals pass rate validated.',
      '🚀 Conversion pathway triggered: Micro-interaction response time 12ms.',
      '🛡️ Instant localized checkout session verified. Ready for deployment.',
      '✨ Interactive state reset. Try hovering across the 3D plane.'
    ];

    interactiveDemoBtn.addEventListener('click', () => {
      interactiveDemoBtn.classList.add('scale-95');
      setTimeout(() => interactiveDemoBtn.classList.remove('scale-95'), 150);
      
      demoStatusText.textContent = feedbackStates[clickCount % feedbackStates.length];
      demoStatusText.classList.add('text-cyan');
      clickCount++;

      showToast('Interaction trigger executed successfully!');
    });
  }

  /* ==========================================================================
     5. Featured Work Project Case Studies Data & Modal Dialog
     ========================================================================== */
  const projectData = {
    noir: {
      title: 'NOIR FITNESS',
      subtitle: 'Luxury Boutique Athletic Club & Wellness Portal',
      industry: 'Fitness, Health & Luxury Lifestyle',
      timeline: '3 Weeks Delivery',
      url: 'https://noirfitness.club',
      challenge: 'NOIR needed a digital identity that reflected their high-ticket membership tier, elevated dark architectural branding, and automated real-time class bookings without third-party friction.',
      solution: 'We engineered a bespoke dark-mode interface with custom typography, fluid booking flows, localized WhatsApp concierge buttons, and zero-lag schedule filtering.',
      deliverables: ['Custom UI/UX Architecture', 'Interactive Booking Engine', 'Mobile-First Fluid Interface', 'SEO & Speed Optimization (99+ Lighthouse)'],
      metrics: '+180% Online Class Bookings within 45 Days • 0.8s Initial Load Time'
    },
    ember: {
      title: 'EMBER BISTRONOMY',
      subtitle: 'Wood-Fired Mediterranean Gastronomy & Cocktail Lounge',
      industry: 'Hospitality & Fine Dining',
      timeline: '2.5 Weeks Delivery',
      url: 'https://ember-dining.com',
      challenge: 'EMBER struggled with clunky PDF menus, lost reservation messages on Instagram, and outdated visual photography layouts.',
      solution: 'We designed a sensory digital experience with interactive dietary menu filters, VIP table reservations connected directly to staff WhatsApp/OpenTable, and an atmospheric cocktail showcase.',
      deliverables: ['Art-Directed Web Experience', 'Interactive Sensory Menu Explorer', 'Direct Reservation Engine', 'Local Schema & Event Calendar'],
      metrics: '+240% Direct Table Inquiries • 4x Higher Wine List Engagement'
    },
    velora: {
      title: 'VELORA ATELIER',
      subtitle: 'Minimalist High-Fashion E-Commerce & Runway Archive',
      industry: 'Luxury Fashion & Global Retail',
      timeline: '4 Weeks Delivery',
      url: 'https://velora-studio.store',
      challenge: 'VELORA needed an editorial lookbook storefront with international multi-currency pricing, rapid mobile checkout, and seamless inventory synchronization.',
      solution: 'Crafted an editorial-grade luxury storefront with silk-smooth lookbook carousels, dynamic size recommendations, and a 1-click accelerated checkout pipeline.',
      deliverables: ['Headless E-Commerce System', 'Editorial Lookbook & Video Integration', 'Localized Checkout & Multi-Currency', 'Automated Stock Notifications'],
      metrics: '3.2x Higher Average Order Value • 68% Increase in International Cart Completion'
    },
    apex: {
      title: 'APEX PARTNERS',
      subtitle: 'Cross-Border Strategic Capital & Institutional Advisory',
      industry: 'Financial Advisory & Corporate Strategy',
      timeline: '3 Weeks Delivery',
      url: 'https://apex-partners.global',
      challenge: 'APEX required a website that immediately conveyed institutional gravitas, security compliance, and thought leadership for high-net-worth corporate clients.',
      solution: 'Engineered a modern corporate website with bespoke data visualization modules, interactive sector case studies, and a secure client briefing portal.',
      deliverables: ['Corporate Brand Identity System', 'Interactive Data Visualizations', 'Encrypted Client Inquiry System', 'Thought Leadership Content Hub'],
      metrics: '+140% Qualified Inbound Institutional Inquiries • 100% Security & Audit Compliance'
    }
  };

  const projectModal = document.getElementById('project-modal');
  const modalBody = document.getElementById('modal-body');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  window.openProjectModal = function(projectId) {
    const data = projectData[projectId];
    if (!data || !projectModal || !modalBody) return;

    modalBody.innerHTML = `
      <div class="space-y-6">
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div class="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan mb-1">
              <span>${data.industry}</span> • <span>${data.timeline}</span>
            </div>
            <h3 class="font-display font-extrabold text-3xl sm:text-4xl text-white uppercase tracking-tight">${data.title}</h3>
            <p class="text-sm text-slate-300 mt-1">${data.subtitle}</p>
          </div>
          <a href="#contact" onclick="closeProjectModal()" class="px-5 py-2.5 rounded-full bg-cyan text-black font-bold text-xs uppercase tracking-wider hover:bg-white transition-all shadow-glow">
            Build Similar Project
          </a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 py-2">
          <div class="space-y-4">
            <h4 class="font-display font-bold text-base text-white uppercase tracking-wider flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-cyan"></span> The Challenge
            </h4>
            <p class="text-sm text-slate-400 leading-relaxed">${data.challenge}</p>

            <h4 class="font-display font-bold text-base text-white uppercase tracking-wider flex items-center gap-2 pt-2">
              <span class="w-1.5 h-1.5 rounded-full bg-cyan"></span> The WebAura Solution
            </h4>
            <p class="text-sm text-slate-400 leading-relaxed">${data.solution}</p>
          </div>

          <div class="p-6 rounded-2xl bg-surface-elevated border border-white/10 space-y-4">
            <h4 class="font-mono text-xs text-cyan uppercase tracking-widest">Key Deliverables</h4>
            <ul class="space-y-2 text-xs font-mono text-slate-300">
              ${data.deliverables.map(d => `<li class="flex items-center gap-2"><span class="text-cyan">✦</span> ${d}</li>`).join('')}
            </ul>

            <div class="pt-4 border-t border-white/10">
              <span class="block font-mono text-[11px] text-slate-400 uppercase">Impact Metric</span>
              <span class="text-xs font-bold text-emerald-400 mt-1 block font-mono">${data.metrics}</span>
            </div>
          </div>
        </div>

        <div class="pt-4 flex items-center justify-between border-t border-white/10 text-xs font-mono text-slate-400">
          <span>Live Demo Preview URL: <span class="text-white">${data.url}</span></span>
          <button onclick="closeProjectModal()" class="text-cyan hover:underline">Close Preview [ESC]</button>
        </div>
      </div>
    `;

    projectModal.classList.add('active');
    projectModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  window.closeProjectModal = function() {
    if (!projectModal) return;
    projectModal.classList.remove('active');
    projectModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', window.closeProjectModal);
  }

  if (projectModal) {
    projectModal.addEventListener('click', (e) => {
      if (e.target === projectModal) window.closeProjectModal();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && projectModal && projectModal.classList.contains('active')) {
      window.closeProjectModal();
    }
  });

  /* ==========================================================================
     6. FAQ Accordion Logic
     ========================================================================== */
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    const panel = item.querySelector('.faq-panel');

    if (trigger && panel) {
      trigger.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close all other accordions for clean UX
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
            const otherTrigger = otherItem.querySelector('.faq-trigger');
            const otherPanel = otherItem.querySelector('.faq-panel');
            if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
            if (otherPanel) otherPanel.style.maxHeight = '0px';
          }
        });

        // Toggle current item
        if (isActive) {
          item.classList.remove('active');
          trigger.setAttribute('aria-expanded', 'false');
          panel.style.maxHeight = '0px';
        } else {
          item.classList.add('active');
          trigger.setAttribute('aria-expanded', 'true');
          panel.style.maxHeight = panel.scrollHeight + 32 + 'px';
        }
      });
    }
  });

  /* ==========================================================================
     7. Scroll-Triggered Process Progression
     ========================================================================== */
  const processSteps = document.querySelectorAll('.process-step');
  if ('IntersectionObserver' in window && processSteps.length > 0) {
    const processObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('border-cyan/40', 'bg-surface-elevated');
        }
      });
    }, { threshold: 0.3 });

    processSteps.forEach(step => processObserver.observe(step));
  }

  /* ==========================================================================
     8. Project Inquiry Form & WhatsApp Generator
     ========================================================================== */
  const inquiryForm = document.getElementById('project-inquiry-form');
  const whatsappInquiryBtn = document.getElementById('whatsapp-inquiry-btn');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');

  function showToast(msg) {
    if (!toast || !toastMessage) return;
    toastMessage.textContent = msg;
    toast.classList.add('active');
    setTimeout(() => {
      toast.classList.remove('active');
    }, 4500);
  }

  function getFormData() {
    const name = document.getElementById('client-name')?.value.trim() || 'Valued Client';
    const business = document.getElementById('business-name')?.value.trim() || 'My Business';
    const email = document.getElementById('client-email')?.value.trim() || '';
    const phone = document.getElementById('client-phone')?.value.trim() || '';
    const industry = document.getElementById('business-industry')?.value.trim() || 'General Commerce';
    const message = document.getElementById('client-message')?.value.trim() || '';

    const selectedServices = Array.from(document.querySelectorAll('input[name="services"]:checked'))
      .map(cb => cb.value);
    const budget = document.querySelector('input[name="budget"]:checked')?.value || '$1,500 – $3,000';

    return {
      name,
      business,
      email,
      phone,
      industry,
      services: selectedServices.length > 0 ? selectedServices.join(', ') : 'Custom Website Project',
      budget,
      message
    };
  }

  // Handle Form Submission
  if (inquiryForm) {
    inquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Basic validation
      const nameInput = document.getElementById('client-name');
      const businessInput = document.getElementById('business-name');
      const emailInput = document.getElementById('client-email');

      if (!nameInput.value.trim() || !businessInput.value.trim() || !emailInput.value.trim()) {
        showToast('Please provide your name, business name, and email.');
        return;
      }

      const data = getFormData();
      console.log('WebAura Project Inquiry Payload:', data);

      // Show confirmation toast
      showToast(`Thank you, ${data.name}! Your project inquiry for "${data.business}" has been submitted.`);
      inquiryForm.reset();
    });
  }

  // Instant WhatsApp Inquiry Handler
  if (whatsappInquiryBtn) {
    whatsappInquiryBtn.addEventListener('click', () => {
      const data = getFormData();
      const text = `Hello WebAura.lb,\n\nI would like to start a website project for my business.\n\n• Name: ${data.name}\n• Business: ${data.business}\n• Industry: ${data.industry}\n• Requirements: ${data.services}\n• Budget Range: ${data.budget}\n• Email/Phone: ${data.email} | ${data.phone}\n\nProject Notes: ${data.message || 'Looking forward to discussing the design and timeline.'}`;
      
      const whatsappUrl = `https://wa.me/96181908649?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      showToast('Opening WhatsApp with your pre-filled project details...');
    });
  }

});
