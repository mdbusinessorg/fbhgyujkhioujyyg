import Link from 'next/link'
import { 
  TrendingUp, Code, Scale, Heart, GraduationCap, 
  Megaphone, Building2, Droplets, HardHat, Users,
  Calculator, Truck, Hotel, Leaf, Palette, Settings
} from 'lucide-react'

const categories = [
  { name: 'Economia e Finanças', icon: TrendingUp, count: 45, color: 'bg-blue-50 text-blue-600' },
  { name: 'Tecnologia da Informação', icon: Code, count: 38, color: 'bg-purple-50 text-purple-600' },
  { name: 'Engenharia', icon: Settings, count: 32, color: 'bg-green-50 text-green-600' },
  { name: 'Direito', icon: Scale, count: 28, color: 'bg-orange-50 text-orange-600' },
  { name: 'Saúde', icon: Heart, count: 35, color: 'bg-red-50 text-red-600' },
  { name: 'Educação', icon: GraduationCap, count: 22, color: 'bg-cyan-50 text-cyan-600' },
  { name: 'Marketing e Comunicação', icon: Megaphone, count: 18, color: 'bg-pink-50 text-pink-600' },
  { name: 'Administração', icon: Building2, count: 40, color: 'bg-indigo-50 text-indigo-600' },
  { name: 'Petróleo e Gás', icon: Droplets, count: 15, color: 'bg-yellow-50 text-yellow-600' },
  { name: 'Construção Civil', icon: HardHat, count: 20, color: 'bg-amber-50 text-amber-600' },
  { name: 'Recursos Humanos', icon: Users, count: 25, color: 'bg-emerald-50 text-emerald-600' },
  { name: 'Contabilidade e Auditoria', icon: Calculator, count: 30, color: 'bg-teal-50 text-teal-600' },
  { name: 'Logística e Transportes', icon: Truck, count: 12, color: 'bg-slate-50 text-slate-600' },
  { name: 'Hotelaria e Turismo', icon: Hotel, count: 10, color: 'bg-rose-50 text-rose-600' },
  { name: 'Agricultura', icon: Leaf, count: 8, color: 'bg-lime-50 text-lime-600' },
  { name: 'Artes e Design', icon: Palette, count: 14, color: 'bg-violet-50 text-violet-600' },
]

export default function Categories() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl font-bold text-k10-primary mb-3">Categorias Populares</h2>
          <p className="text-gray-500 max-w-lg mx-auto">Explora vagas organizadas por área profissional</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon
            return (
              <Link key={cat.name} href={`/vagas/?area=${encodeURIComponent(cat.name)}`}>
                <div className="card p-4 text-center hover:-translate-y-1 cursor-pointer group">
                  <div className={`w-12 h-12 rounded-xl ${cat.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="font-medium text-sm text-gray-800 mb-1 leading-tight">{cat.name}</h3>
                  <p className="text-xs text-gray-400">{cat.count} vagas</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
