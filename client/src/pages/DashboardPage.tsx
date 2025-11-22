import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import { Search, Camera, Settings, Infinity } from "lucide-react";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Plan limits mapping
  const planLimits: Record<string, number> = {
    free: 3,
    premium: 30,
    plus: -1, // unlimited
    pro: -1, // unlimited
  };

  // Get user plan data (with fallbacks)
  const plan = user?.subscriptionPlan || 'free';
  const searchesLimit = planLimits[plan] || 3;
  const searchesUsed = 0; // TODO: Fetch from API if available
  const isUnlimited = searchesLimit === -1;
  const usagePercentage = isUnlimited ? 0 : (searchesUsed / searchesLimit) * 100;

  // Plan badge colors
  const planColors: Record<string, string> = {
    pro: 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-yellow-100',
    plus: 'bg-gradient-to-r from-blue-600 to-blue-500 text-blue-100',
    premium: 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-cyan-100',
    free: 'bg-gradient-to-r from-gray-600 to-gray-500 text-gray-100',
  };

  // Popular car brands
  const popularBrands = ['Toyota', 'Chevrolet', 'Ford', 'Nissan', 'Honda', 'Hyundai', 'Kia', 'Mazda'];

  const handleBrandClick = (brand: string) => {
    setLocation(`/search?make=${brand}`);
  };

  return (
    <div className="min-h-screen bg-[#0F0F14] relative">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Hero Card - Estado del Usuario */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl border border-white/10 p-6 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white">
                    Hola, <span className="text-cyan-400">{user?.username || "Usuario"}</span>
                  </h1>
                  {plan && (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${planColors[plan] || planColors.free}`}>
                      Plan {plan.charAt(0).toUpperCase() + plan.slice(1)}
                    </span>
                  )}
                </div>
                
                {/* Barra de Consumo */}
                <div className="space-y-2">
                  {isUnlimited ? (
                    <div className="flex items-center gap-2">
                      <Infinity className="w-8 h-8 text-cyan-400 animate-pulse" />
                      <span className="text-sm text-slate-300 font-medium">Búsquedas Ilimitadas</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Búsquedas utilizadas</span>
                        <span className="text-cyan-400 font-medium">
                          {searchesUsed} / {searchesLimit}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Barra de Búsqueda Central */}
          <div
            onClick={() => setLocation("/search")}
            className="bg-gray-800 border border-gray-700 rounded-xl p-4 cursor-pointer hover:border-cyan-500/50 transition-colors shadow-lg"
          >
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <span className="text-slate-400 text-lg">
                🔍 Ingresa VIN, Marca, Modelo o Código DTC...
              </span>
            </div>
          </div>

          {/* Grid de Marcas Frecuentes */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-300 uppercase tracking-wide">
              Marcas Frecuentes
            </h2>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {popularBrands.map((brand) => (
                <button
                  key={brand}
                  onClick={() => handleBrandClick(brand)}
                  className="bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg p-4 transition-all hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 text-center group"
                >
                  <span className="text-sm font-medium text-slate-300 group-hover:text-cyan-400 transition-colors">
                    {brand}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Accesos de Herramientas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Escáner VIN */}
            <button
              onClick={() => setLocation("/scan-vin")}
              className="bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-xl p-6 transition-all hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                  <Camera className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                    📷 Escáner VIN
                  </h3>
                  <p className="text-sm text-slate-400">
                    Escanea códigos VIN con la cámara
                  </p>
                </div>
              </div>
            </button>

            {/* Panel Admin - Solo visible para admins */}
            {user?.role === 'admin' && (
              <button
                onClick={() => setLocation("/admin")}
                className="bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-xl p-6 transition-all hover:border-yellow-500/50 hover:shadow-lg hover:shadow-yellow-500/10 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                    <Settings className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-white group-hover:text-yellow-400 transition-colors">
                      ⚙️ Panel Admin
                    </h3>
                    <p className="text-sm text-slate-400">
                      Administración del sistema
                    </p>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

