"use client";

import { useState, useEffect, useRef } from "react";



// Grid Background Component
function GridBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let lastUpdate = 0;
    const throttle = 16;

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastUpdate < throttle) return;
      lastUpdate = now;
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const gridSize = 50;
    const maxDistance = 150;
    const maxDistanceSq = maxDistance * maxDistance;
    let dots: { x: number; y: number; baseX: number; baseY: number }[] = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      dots = [];
      for (let x = 0; x < canvas.width; x += gridSize) {
        for (let y = 0; y < canvas.height; y += gridSize) {
          dots.push({ x, y, baseX: x, baseY: y });
        }
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let lastMousePos = { ...mousePos };
    let isAnimating = true;

    const animate = () => {
      if (!isAnimating) return;

      const mouseMoved = Math.abs(mousePos.x - lastMousePos.x) > 1 || 
                        Math.abs(mousePos.y - lastMousePos.y) > 1;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
      }
      
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
      }
      ctx.stroke();

      const affectedDots: typeof dots = [];
      const normalDots: typeof dots = [];
      
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        const dx = mousePos.x - dot.baseX;
        const dy = mousePos.y - dot.baseY;
        const distanceSq = dx * dx + dy * dy;

        if (distanceSq < maxDistanceSq) {
          affectedDots.push(dot);
          if (mouseMoved) {
            const distance = Math.sqrt(distanceSq);
            const force = (maxDistance - distance) / maxDistance;
            dot.x = dot.baseX + dx * force * 0.2;
            dot.y = dot.baseY + dy * force * 0.2;
          }
        } else {
          normalDots.push(dot);
          if (Math.abs(dot.x - dot.baseX) > 0.1 || Math.abs(dot.y - dot.baseY) > 0.1) {
            dot.x += (dot.baseX - dot.x) * 0.15;
            dot.y += (dot.baseY - dot.y) * 0.15;
          } else {
            dot.x = dot.baseX;
            dot.y = dot.baseY;
          }
        }
      }

      ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
      ctx.beginPath();
      for (let i = 0; i < normalDots.length; i++) {
        ctx.moveTo(normalDots[i].x + 1.5, normalDots[i].y);
        ctx.arc(normalDots[i].x, normalDots[i].y, 1.5, 0, Math.PI * 2);
      }
      ctx.fill();

      for (let i = 0; i < affectedDots.length; i++) {
        const dot = affectedDots[i];
        const dx = mousePos.x - dot.baseX;
        const dy = mousePos.y - dot.baseY;
        const distanceSq = dx * dx + dy * dy;
        const distance = Math.sqrt(distanceSq);
        const force = (maxDistance - distance) / maxDistance;
        
        const opacity = 0.2 + force * 0.5;
        const radius = 1.5 + force * 2;

        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      lastMousePos = { ...mousePos };
      rafRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      isAnimating = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [mousePos]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: "transparent" }}
    />
  );
}

// Floating Particles Component
function FloatingParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    interface Particle {
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      opacity: number;
    }

    const particles: Particle[] = [];
    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 136, ${p.opacity})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-40" />;
}

function useInView(options = {}): [React.RefObject<HTMLElement | null>, boolean] {
  const ref = useRef<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
      }
    }, { threshold: 0.1, ...options });

    if (ref.current) {
      observer.observe(ref.current);
    }

    const currentRef = ref.current;

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [options]);

  return [ref, isInView];
}

function Countdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 9,
    hours: 9,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prevTime) => {
        let { days, hours, minutes, seconds } = prevTime;
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else if (days > 0) {
          days--;
          hours = 23;
          minutes = 59;
          seconds = 59;
        }
        return { days, hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-center gap-6 md:gap-12 mb-20">
      {[
        { label: "days", value: timeLeft.days },
        { label: "hours", value: timeLeft.hours },
        { label: "minutes", value: timeLeft.minutes },
        { label: "seconds", value: timeLeft.seconds },
      ].map((item, idx) => (
        <div key={idx} className="flex flex-col items-center group">
          <div className="text-4xl md:text-6xl lg:text-7xl font-bold tabular-nums text-white mb-3 relative">
            <span className="relative z-10">{String(item.value).padStart(2, "0")}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-cyan-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
          <div className="text-xs uppercase tracking-[0.2em] text-gray-600">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// Gallery Component with Auto-Switching Images
function Gallery() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [nextImageIndex, setNextImageIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Local images from public folder
  const images = [
    "/1.jpg",
    "/2.jpg",
    "/3.jpg",
    "/4.jpg",
    "/5.jpg",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setNextImageIndex((currentImageIndex + 1) % images.length);
      
      setTimeout(() => {
        setCurrentImageIndex((currentImageIndex + 1) % images.length);
        setIsTransitioning(false);
      }, 800);
    }, 4000);

    return () => clearInterval(interval);
  }, [currentImageIndex, images.length]);

  const [galleryRef, galleryInView] = useInView();

  return (
    <section ref={galleryRef} id="gallery" className="py-32 px-6 lg:px-12 relative">
      <div className="absolute inset-0 backdrop-blur-xl bg-black/40 border-y border-white/10" style={{
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      }} />
      <div className="max-w-6xl mx-auto relative z-10">
        <h2 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-20 tracking-tight bg-gradient-to-r from-white via-green-100 to-cyan-100 bg-clip-text text-transparent transition-all duration-1000 ${galleryInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          Event Gallery
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Main Featured Image with Auto-Switch */}
          <div className={`md:col-span-2 relative overflow-hidden border border-white/20 aspect-[21/9] group transition-all duration-1000 ${galleryInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="absolute inset-0">
              <img
                src={images[currentImageIndex]}
                alt={`Gallery ${currentImageIndex + 1}`}
                className="w-full h-full object-cover transition-opacity duration-800"
                style={{ opacity: isTransitioning ? 0 : 1 }}
              />
              <img
                src={images[nextImageIndex]}
                alt={`Gallery ${nextImageIndex + 1}`}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-800"
                style={{ opacity: isTransitioning ? 1 : 0 }}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute bottom-6 left-6 flex gap-2">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    idx === currentImageIndex ? 'w-12 bg-green-400' : 'w-8 bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Smaller Gallery Grid */}
          {images.slice(0, 4).map((img, idx) => (
            <div
              key={idx}
              className={`relative overflow-hidden border border-white/20 aspect-[4/3] group hover:scale-105 transition-all duration-500 hover:border-green-400/50 hover:shadow-[0_0_30px_rgba(0,255,136,0.2)] ${galleryInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: `${(idx + 1) * 100}ms` }}
            >
              <img
                src={img}
                alt={`Gallery thumbnail ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>

        {/* Image Counter */}
        <div className={`mt-12 text-center transition-all duration-1000 delay-500 ${galleryInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <p className="text-sm text-gray-400 tracking-[0.2em] uppercase">
            <span className="text-green-400 font-bold">{currentImageIndex + 1}</span>
            <span className="mx-2 text-white/30">/</span>
            <span className="text-white/60">{images.length}</span>
          </p>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((prev) => [...prev, { x, y, id }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  };

  const faqs = [
    { q: "Who can participate?", a: "All students passionate about quantum computing are welcome to participate, regardless of their experience level." },
    { q: "What's the focus of the hackathon's project themes?", a: "Projects focus on quantum algorithms, quantum machine learning, quantum cryptography, and real-world quantum computing applications." },
    { q: "Is the hackathon virtual or in-person?", a: "This is an in-person event held at TP-1 Turing Hall (8th Floor), SRM University campus." },
    { q: "What should I bring?", a: "Bring your laptop, charger, enthusiasm, and creativity! All other materials will be provided." },
    { q: "Will food and drinks be provided?", a: "Yes, meals and refreshments will be provided throughout the hackathon." },
    { q: "How do I form or join a team?", a: "You can form teams of up to 4 members. Solo participation is also welcome, and we'll help you find teammates." },
    { q: "How do I register for the hackathon? Is there a fee?", a: "Registration is free! Simply fill out the registration form on our website." },
    { q: "What if I can't code?", a: "No problem! We welcome participants from all backgrounds. Our mentors will guide you through the basics." },
    { q: "Is there a code of conduct?", a: "Yes, we maintain a respectful and inclusive environment. All participants must follow our code of conduct." },
  ];

  const sponsors = {
    platinum: ["Kwantum Research Labs", "Quentangle"],
    gold: ["Devfolio", "Polygon", "ETH"],
    silver: ["Replit"],
  };

  const chiefGuests = [
    { name: "Jagan Narayan Natarajan", role: "IBM Research Labs", bio: "Master's in Opto Electronics from IIT Delhi and Physics from IIT Madras. Mainframe developer and architect at IBM, now in quantum support team." },
    { name: "Sreekuttan LS", role: "CEO of Bloq Quantum", bio: "Leading innovations in quantum computing solutions across finance, healthcare, and cybersecurity." },
    { name: "Jayakumar Vaithiyashankar", role: "Quantum Computing Advocate", bio: "Senior IEEE Member dedicated to quantum computing education and outreach, actively mentoring new developers." },
  ];

  const timeline = [
    { date: "5th February 2025", event: "Last Date for Registration", time: "", icon: "📅" },
    { date: "8th February 2025", event: "Quantization Begins", time: "10:00 AM", icon: "🚀" },
    { date: "9th February 2025", event: "Final Presentations", time: "Throughout the day", icon: "🎤" },
    { date: "9th February 2025", event: "Winner Announcement", time: "Evening", icon: "🏆" },
  ];

  const whyParticipate = [
    { icon: "🧠", title: "Learn from Experts", desc: "Hands-on mentorship from quantum computing professionals" },
    { icon: "🤝", title: "Network", desc: "Connect with like-minded quantum enthusiasts and industry leaders" },
    { icon: "💡", title: "Innovation", desc: "Work on cutting-edge quantum computing challenges" },
    { icon: "🎁", title: "Prizes & Perks", desc: "Win exciting prizes and exclusive swag from sponsors" },
    { icon: "👥", title: "Learn Together", desc: "Collaborative learning through peer discussions, guided sessions, and shared problem-solving" },
  ];

  const judgingCriteria = [
    { title: "Innovation", weight: "30%", desc: "Originality and creativity of the solution" },
    { title: "Technical Implementation", weight: "30%", desc: "Quality of code and quantum algorithms used" },
    { title: "Impact", weight: "25%", desc: "Real-world applicability and potential impact" },
    { title: "Presentation", weight: "15%", desc: "Clarity and effectiveness of project demonstration" },
  ];

  const [aboutRef, aboutInView] = useInView();
  const [tracksRef, tracksInView] = useInView();
  const [whyRef, whyInView] = useInView();
  const [sponsorsRef, sponsorsInView] = useInView();
  const [guestsRef, guestsInView] = useInView();
  const [criteriaRef, criteriaInView] = useInView();
  const [timelineRef, timelineInView] = useInView();
  const [faqRef, faqInView] = useInView();

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ripple {
          to {
            width: 300px;
            height: 300px;
            opacity: 0;
            transform: translate(-50%, -50%);
          }
        }
        .animate-ripple {
          animation: ripple 0.6s ease-out;
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}} />
      
      <GridBackground />
      <FloatingParticles />

      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/10" style={{
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <div className="text-lg font-bold tracking-wide relative group">
              QUANTATHON
              <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-green-400 to-cyan-400 group-hover:w-full transition-all duration-300" />
            </div>
            <div className="hidden md:flex items-center gap-12 text-sm">
              {["About", "Tracks", "Gallery", "Timeline", "FAQ"].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="relative text-gray-400 hover:text-white transition-colors group">
                  {item}
                  <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-green-400 to-cyan-400 group-hover:w-full transition-all duration-300" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center justify-center px-6">
        <div className="absolute inset-0 opacity-20" style={{
          background: `radial-gradient(circle at 50% ${50 + scrollY * 0.05}%, rgba(0, 255, 136, 0.15) 0%, transparent 60%)`,
        }} />
        
        <div className="relative z-10 max-w-6xl mx-auto text-center pt-20">
          <div className="mb-16 space-y-6">
            <h1 className="text-[clamp(3rem,12vw,10rem)] font-bold leading-none tracking-tighter animate-fade-in">
              QUANTATHON
            </h1>
            <div className="text-[clamp(2rem,6vw,4.5rem)] font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-cyan-400 to-blue-500 animate-gradient">
              3.0
            </div>
          </div>

          <div className="mb-12 space-y-4">
            <p className="text-xl md:text-2xl text-green-400 font-bold tracking-wide">
              8-9 FEBRUARY 2025
            </p>
            <p className="text-lg md:text-xl text-gray-400 tracking-wide">
              TP-1 TURING HALL (8TH FLOOR)
            </p>
          </div>

          <Countdown />

          <button onClick={createRipple} className="group relative px-10 py-4 border border-white/20 hover:border-white/40 text-sm uppercase tracking-[0.2em] font-bold overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(0,255,136,0.3)]">
            <span className="relative z-10">Register Now</span>
            <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-cyan-400/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            {ripples.map((ripple) => (
              <span key={ripple.id} className="absolute bg-white/30 rounded-full animate-ripple" style={{ left: ripple.x, top: ripple.y, width: 0, height: 0 }} />
            ))}
          </button>
        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-[1px] h-16 bg-gradient-to-b from-white/20 to-transparent" />
        </div>
      </section>

      <section ref={whyRef} className="py-32 px-6 lg:px-12 relative">
        <div className="absolute inset-0 backdrop-blur-xl bg-black/40 border-y border-white/10" style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }} />
        <div className="max-w-6xl mx-auto relative z-10">
          <h2 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-20 tracking-tight bg-gradient-to-r from-white via-green-100 to-cyan-100 bg-clip-text text-transparent transition-all duration-1000 ${whyInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            Why Participate?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
            {whyParticipate.map((item, idx) => (
              <div key={idx} className={`border border-white/20 p-8 hover:border-green-400/50 transition-all duration-500 backdrop-blur-md bg-white/5 group hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,136,0.2)] ${whyInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${idx * 100}ms` }}>
                <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={aboutRef} id="about" className="py-32 px-6 lg:px-12 relative">
        <div className="absolute inset-0 backdrop-blur-xl bg-black/40 border-y border-white/10" style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }} />
        <div className="max-w-5xl mx-auto relative z-10">
          <h2 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-20 tracking-tight bg-gradient-to-r from-white via-green-100 to-cyan-100 bg-clip-text text-transparent transition-all duration-1000 ${aboutInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            About Quantathon
          </h2>
          <p className={`text-lg md:text-xl text-gray-300 leading-relaxed transition-all duration-1000 delay-200 ${aboutInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            The SRM Quantum Computing Club is a dynamic student organization at SRM University, 
            united by a passion for quantum computing. Through engaging workshops and interactive 
            sessions, we explore quantum mechanics, algorithms, and practical applications. 
            Hands-on learning with cutting-edge platforms like Qiskit and Cirq enhances our 
            problem-solving skills and understanding. Guest lectures and industry interactions 
            keep us updated with the latest advancements. Our inclusive environment welcomes 
            students from all disciplines, fostering lasting friendships and professional connections.
          </p>
        </div>
      </section>

      <section ref={tracksRef} id="tracks" className="py-32 px-6 lg:px-12 relative">
        <div className="absolute inset-0 backdrop-blur-xl bg-black/40 border-y border-white/10" style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }} />
        <div className="max-w-6xl mx-auto relative z-10">
          <h2 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-20 tracking-tight bg-gradient-to-r from-white via-green-100 to-cyan-100 bg-clip-text text-transparent transition-all duration-1000 ${tracksInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            Competition Tracks
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-32">
            {[
              { 
                icon: "🧠", 
                title: "Quantum Intelligence", 
                subtitle: "(Quantum ML)",
                desc: "Fuse quantum computing with machine learning to design next-generation intelligent systems. Explore quantum neural networks, variational quantum algorithms, and hybrid quantum-classical models that push the limits of AI performance, optimization, and data representation.", 
                gradient: "from-purple-400 to-pink-500" 
              },
              { 
                icon: "📡", 
                title: "Quantum Communication", 
                subtitle: "& Cryptography",
                desc: "Engineer the future of secure communication using quantum principles. Explore quantum key distribution (QKD), entanglement-based protocols, and post-quantum security models to design robust, tamper-resistant communication systems for real-world deployment.", 
                gradient: "from-blue-400 to-indigo-500" 
              },
              { 
                icon: "⚙️", 
                title: "Quantum Optimization", 
                subtitle: "& Error Mitigation",
                desc: "Focus on making quantum algorithms practical and scalable on noisy intermediate-scale quantum (NISQ) devices. Explore quantum optimization algorithms (VQE, QAOA), noise modeling, error mitigation techniques, and hardware-aware circuit optimization to improve performance under real-world constraints.", 
                gradient: "from-green-400 to-cyan-500" 
              },
            ].map((track, idx) => (
              <div key={idx} className={`border border-white/20 p-8 hover:border-white/30 transition-all duration-500 backdrop-blur-md bg-white/5 group hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,136,0.2)] ${tracksInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${idx * 150}ms` }}>
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${track.gradient} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`}>
                  <span className="text-2xl">{track.icon}</span>
                </div>
                <h3 className="text-2xl font-bold mb-1 tracking-tight">{track.title}</h3>
                <p className="text-sm text-gray-400 mb-4 font-bold">{track.subtitle}</p>
                <p className="text-base text-gray-300 leading-relaxed">{track.desc}</p>
              </div>
            ))}
          </div>

          <h3 className="text-3xl md:text-4xl font-bold mb-16 tracking-tight">Prizes</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { place: "Winner", amount: "15,000", color: "from-yellow-400 to-yellow-500", shadow: "shadow-yellow-500/50" },
              { place: "Runner Up", amount: "10,000", color: "from-gray-400 to-gray-500", shadow: "shadow-gray-500/50" },
              { place: "Second Runner Up", amount: "5,000", color: "from-orange-400 to-orange-500", shadow: "shadow-orange-500/50" },
            ].map((prize, idx) => (
              <div key={idx} className={`border border-white/20 p-10 hover:border-white/30 transition-all duration-500 backdrop-blur-md bg-white/5 group hover:scale-105 hover:shadow-2xl ${prize.shadow} ${tracksInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${600 + idx * 100}ms` }}>
                <div className={`text-5xl font-bold bg-gradient-to-r ${prize.color} bg-clip-text text-transparent mb-6 group-hover:scale-110 transition-transform`}>
                  {idx + 1}
                </div>
                <h4 className="text-lg font-bold mb-3">{prize.place}</h4>
                <p className="text-2xl font-bold">₹{prize.amount}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <Gallery />

      <section ref={criteriaRef} className="py-32 px-6 lg:px-12 relative">
        <div className="absolute inset-0 backdrop-blur-xl bg-black/40 border-y border-white/10" style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }} />
        <div className="max-w-6xl mx-auto relative z-10">
          <h2 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-20 tracking-tight bg-gradient-to-r from-white via-green-100 to-cyan-100 bg-clip-text text-transparent transition-all duration-1000 ${criteriaInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            Judging Criteria
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {judgingCriteria.map((criterion, idx) => (
              <div key={idx} className={`border border-white/20 p-8 hover:border-cyan-400/50 transition-all duration-500 backdrop-blur-md bg-white/5 group hover:scale-105 ${criteriaInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${idx * 100}ms` }}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-bold">{criterion.title}</h3>
                  <span className="text-lg font-bold text-cyan-400">{criterion.weight}</span>
                </div>
                <p className="text-gray-300">{criterion.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={timelineRef} id="timeline" className="py-32 px-6 lg:px-12 relative">
        <div className="absolute inset-0 backdrop-blur-xl bg-black/40 border-y border-white/10" style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }} />
        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-20 tracking-tight bg-gradient-to-r from-white via-green-100 to-cyan-100 bg-clip-text text-transparent transition-all duration-1000 ${timelineInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            Event Timeline
          </h2>
          <div className="space-y-12">
            {timeline.map((item, idx) => (
              <div key={idx} className={`border-l-2 border-white/30 pl-8 hover:border-cyan-400/70 transition-all duration-500 backdrop-blur-md bg-white/5 p-6 -ml-6 group hover:scale-[1.02] ${timelineInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`} style={{ transitionDelay: `${idx * 100}ms` }}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl group-hover:scale-125 transition-transform">{item.icon}</span>
                  <div className="text-sm text-cyan-400 font-bold">{item.date}</div>
                </div>
                <div className="text-xl font-bold mb-1 group-hover:text-cyan-400 transition-colors">{item.event}</div>
                {item.time && (
                  <div className="text-sm text-gray-500 font-bold">{item.time}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={faqRef} id="faq" className="py-32 px-6 lg:px-12 relative">
        <div className="absolute inset-0 backdrop-blur-xl bg-black/40 border-y border-white/10" style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }} />
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-20 tracking-tight bg-gradient-to-r from-white via-green-100 to-cyan-100 bg-clip-text text-transparent transition-all duration-1000 ${faqInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            FAQs
          </h2>
          <div className="space-y-0">
            {faqs.map((faq, idx) => (
              <div key={idx} className={`border-b border-white/20 ${faqInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${idx * 50}ms` }}>
                <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} className="w-full py-8 text-left flex justify-between items-start gap-8 group">
                  <span className="text-lg font-bold group-hover:text-green-400 transition-colors">
                    {faq.q}
                  </span>
                  <span className="text-2xl font-bold text-gray-600 group-hover:text-white flex-shrink-0 transition-all" 
                    style={{
                      transform: openFaq === idx ? 'rotate(45deg)' : 'rotate(0deg)',
                    }}>
                    +
                  </span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === idx ? 'max-h-96 pb-8' : 'max-h-0'}`}>
                  <div className="text-gray-300 leading-relaxed">
                    {faq.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-20 px-6 lg:px-12 relative">
        <div className="absolute inset-0 backdrop-blur-xl bg-black/40 border-t border-white/10" style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }} />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-16 mb-16">
            <div>
              <h4 className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-6 font-bold">Contact</h4>
              <div className="space-y-2 text-sm text-gray-300">
                <p>srmqcc@gmail.com</p>
                <p>+91 7995738255</p>
                <p>+91 8011922099</p>
              </div>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-6 font-bold">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block text-gray-300 hover:text-white transition-colors">Home</a>
                <a href="#tracks" className="block text-gray-300 hover:text-white transition-colors">Tracks</a>
                <a href="#gallery" className="block text-gray-300 hover:text-white transition-colors">Gallery</a>
                <a href="#timeline" className="block text-gray-300 hover:text-white transition-colors">Timeline</a>
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-600 font-bold">
            © 2025 Quantum Computing Club SRM
          </div>
        </div>
      </footer>
    </div>
  );
}