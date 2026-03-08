import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { Menu, ShoppingCart, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const Header = () => {
  const { totalItems } = useCart();
  const { isAuthenticated, logout, user } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isRudrakshaOpen, setIsRudrakshaOpen] = useState(false);
  const [isKarungaliOpen, setIsKarungaliOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Check if any dropdown is open
  const shouldShowWhiteBg = isScrolled || isMenuOpen || isRudrakshaOpen || isKarungaliOpen;
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAdminHeader = isAdminRoute && isAuthenticated && user?.role === "admin";

  if (isAdminHeader) {
    return (
      <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
        <div className="border-b border-orange-200">
          <div className="max-w-[1100px] mx-auto flex h-24 items-center justify-end px-4">
            <Button asChild variant="ghost" size="icon" className="bg-orange-100 hover:bg-orange-200 text-orange-700 hover:text-orange-800 rounded-full transition-all duration-300">
              <Link to="/profile">
                <User className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={`sticky top-0 z-50 w-full shadow-sm transition-all duration-300 ${shouldShowWhiteBg ? 'bg-white' : 'bg-transparent'
      }`}>
      <div className={`border-b transition-colors duration-300 ${shouldShowWhiteBg ? 'border-orange-200' : 'border-orange-200/30'
        }`}>
        <div className="max-w-[1100px] mx-auto flex h-24 items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center space-x-3 group">
              <div className="flex flex-col">
                <div className="relative h-10 flex items-center">
                  <span className="text-3xl font-bold bg-gradient-to-r from-black via-red-600 to-black bg-clip-text text-transparent animate-flash-hindi">
                    एकमा
                  </span>
                  <span className="absolute text-3xl font-bold bg-gradient-to-r from-black via-red-600 to-black bg-clip-text text-transparent animate-flash-english">
                    ekama
                  </span>
                </div>
                <span className="text-sm text-orange-600 font-medium tracking-wide">
                  यद् भावं तद् भवति
                </span>
              </div>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <div className="relative group flex items-center"
                onMouseEnter={() => setIsRudrakshaOpen(true)}
                onMouseLeave={() => setIsRudrakshaOpen(false)}>
                <a href="#rudraksha" className="text-base font-semibold text-orange-800 hover:text-orange-600 transition-all duration-300 cursor-pointer leading-none">
                  Rudraksha
                </a>
                <div className={`absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-orange-200 transition-all duration-300 z-50 ${isRudrakshaOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                  }`}>
                  <div className="py-2">
                    <a href="#rudraksha-bracelets" className="block px-4 py-2 text-sm text-orange-800 hover:bg-orange-50 hover:text-orange-600 transition-colors">Rudraksha Bracelets</a>
                    <a href="#silver-bracelet" className="block px-4 py-2 text-sm text-orange-800 hover:bg-orange-50 hover:text-orange-600 transition-colors">Silver Plated Modern Rudraksha Bracelet</a>
                    <a href="#gold-duotone-bracelet" className="block px-4 py-2 text-sm text-orange-800 hover:bg-orange-50 hover:text-orange-600 transition-colors">Gold Plated DuoTone Rudraksha Bracelet</a>
                    <a href="#gold-combo-bracelet" className="block px-4 py-2 text-sm text-orange-800 hover:bg-orange-50 hover:text-orange-600 transition-colors">Gold Plated Modern + Essential Rudraksha Bracelet Combo</a>
                    <a href="#gold-beads-bracelet" className="block px-4 py-2 text-sm text-orange-800 hover:bg-orange-50 hover:text-orange-600 transition-colors">Gold Plated Golden Beads Modern Rudraksha Bracelet</a>
                    <a href="#rudraksha-malas" className="block px-4 py-2 text-sm text-orange-800 hover:bg-orange-50 hover:text-orange-600 transition-colors">Rudraksha Malas</a>
                    <a href="#nepali-rudraksha" className="block px-4 py-2 text-sm text-orange-800 hover:bg-orange-50 hover:text-orange-600 transition-colors">Nepali Rudraksha</a>
                  </div>
                </div>
              </div>

              <div className="group relative flex items-center">
                <a href="#spiritual-jewellery" className="text-base font-semibold text-orange-800 hover:text-orange-600 transition-all duration-300 leading-none">
                  Spiritual Jewellery
                </a>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300 group-hover:w-full"></span>
              </div>

              <div className="relative group flex items-center"
                onMouseEnter={() => setIsKarungaliOpen(true)}
                onMouseLeave={() => setIsKarungaliOpen(false)}>
                <a href="#karungali" className="text-base font-semibold text-orange-800 hover:text-orange-600 transition-all duration-300 cursor-pointer leading-none">
                  Karungali
                </a>
                <div className={`absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-orange-200 transition-all duration-300 z-50 ${isKarungaliOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                  }`}>
                  <div className="py-2">
                    <a href="#energy-stones" className="block px-4 py-2 text-sm text-orange-800 hover:bg-orange-50 hover:text-orange-600 transition-colors">Energy Stones</a>
                    <a href="#bracelets" className="block px-4 py-2 text-sm text-orange-800 hover:bg-orange-50 hover:text-orange-600 transition-colors">Karungali Bracelets</a>
                    <a href="#malas" className="block px-4 py-2 text-sm text-orange-800 hover:bg-orange-50 hover:text-orange-600 transition-colors">Karungali Malas</a>
                  </div>
                </div>
              </div>

              <div className="group relative flex items-center">
                <a href="#gift-hampers" className="text-sm font-semibold text-orange-800 hover:text-orange-600 transition-all duration-300 leading-none">
                  Gift Hampers
                </a>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300 group-hover:w-full"></span>
              </div>

              <div className="group relative flex items-center">
                <a href="#support" className="text-base font-semibold text-orange-800 hover:text-orange-600 transition-all duration-300 leading-none">
                  Support
                </a>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300 group-hover:w-full"></span>
              </div>

              <div className="group relative flex items-center">
                <a href="#contact" className="text-base font-semibold text-orange-800 hover:text-orange-600 transition-all duration-300 leading-none">
                  Contact
                </a>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300 group-hover:w-full"></span>
              </div>
            </nav>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div onClick={() => setIsMenuOpen(false)}>
                <Button asChild variant="ghost" size="icon" className="bg-orange-100 hover:bg-orange-200 text-orange-700 hover:text-orange-800 rounded-full transition-all duration-300">
                  <Link to="/profile">
                    <User className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div onClick={() => setIsMenuOpen(false)}>
                <Button asChild variant="ghost" size="icon" className="bg-orange-100 hover:bg-orange-200 text-orange-700 hover:text-orange-800 rounded-full transition-all duration-300">
                  <Link to="/login">
                    <User className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="bg-orange-100 hover:bg-orange-200 text-orange-700 hover:text-orange-800 rounded-full transition-all duration-300"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>

      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-orange-200 bg-white">
          <div className="px-4 py-3 space-y-3">
            <div className="relative">
              <button className="w-full text-left flex items-center justify-between text-orange-800 hover:text-orange-600 hover:bg-orange-100 rounded-lg px-3 py-2 transition-all duration-300">
                <span>📿 Rudraksha</span>
                <span className="text-orange-600">▼</span>
              </button>
              <div className="ml-4 mt-2 space-y-2 border-l-2 border-orange-200 pl-4">
                <a href="#rudraksha-bracelets" className="block text-sm text-orange-700 hover:text-orange-600 py-1">Rudraksha Bracelets</a>
                <a href="#silver-bracelet" className="block text-sm text-orange-700 hover:text-orange-600 py-1">Silver Plated Bracelet</a>
                <a href="#gold-duotone-bracelet" className="block text-sm text-orange-700 hover:text-orange-600 py-1">Gold DuoTone Bracelet</a>
                <a href="#gold-combo-bracelet" className="block text-sm text-orange-700 hover:text-orange-600 py-1">Gold Combo Bracelet</a>
                <a href="#gold-beads-bracelet" className="block text-sm text-orange-700 hover:text-orange-600 py-1">Gold Beads Bracelet</a>
                <a href="#rudraksha-malas" className="block text-sm text-orange-700 hover:text-orange-600 py-1">Rudraksha Malas</a>
                <a href="#nepali-rudraksha" className="block text-sm text-orange-700 hover:text-orange-600 py-1">Nepali Rudraksha</a>
              </div>
            </div>

            <a href="#spiritual-jewellery" className="block text-orange-800 hover:text-orange-600 hover:bg-orange-100 rounded-lg px-3 py-2 transition-all duration-300">💎 Spiritual Jewellery</a>

            <div className="relative">
              <button className="w-full text-left flex items-center justify-between text-orange-800 hover:text-orange-600 hover:bg-orange-100 rounded-lg px-3 py-2 transition-all duration-300">
                <span>🌿 Karungali</span>
                <span className="text-orange-600">▼</span>
              </button>
              <div className="ml-4 mt-2 space-y-2 border-l-2 border-orange-200 pl-4">
                <a href="#energy-stones" className="block text-sm text-orange-700 hover:text-orange-600 py-1">Energy Stones</a>
                <a href="#bracelets" className="block text-sm text-orange-700 hover:text-orange-600 py-1">Karungali Bracelets</a>
                <a href="#malas" className="block text-sm text-orange-700 hover:text-orange-600 py-1">Karungali Malas</a>
              </div>
            </div>

            <a href="#gift-hampers" className="block text-orange-800 hover:text-orange-600 hover:bg-orange-100 rounded-lg px-3 py-2 transition-all duration-300">🎁 Gift Hampers</a>
            <a href="#idols" className="block text-base text-orange-800 hover:text-orange-600 hover:bg-orange-100 rounded-lg px-3 py-2 transition-all duration-300">🕉️ Idols</a>
            <a href="#support" className="block text-orange-800 hover:text-orange-600 hover:bg-orange-100 rounded-lg px-3 py-2 transition-all duration-300">📞 Support</a>
            {isAuthenticated && (
              <>
                {user?.role === "admin" && (
                  <Link to="/admin" className="block text-orange-800 hover:text-orange-600 hover:bg-orange-100 rounded-lg px-3 py-2 transition-all duration-300">
                    🛠️ Admin
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
