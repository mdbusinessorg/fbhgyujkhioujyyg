import Link from "next/link";
import { HeartPulse } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-ink py-12 text-white/80">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
                <HeartPulse size={18} />
              </span>
              <span className="font-display text-lg font-bold text-white">
                Clínica Bem Estar
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Cuidados de saúde de excelência, centrados em si. Desde 2003 ao
              serviço da comunidade.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white">Navegação</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a href="#inicio" className="hover:text-white">Início</a></li>
              <li><a href="#servicos" className="hover:text-white">Especialidades</a></li>
              <li><a href="#sobre" className="hover:text-white">Sobre</a></li>
              <li><a href="#contacto" className="hover:text-white">Contacto</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white">Conta</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/login" className="hover:text-white">Entrar</Link></li>
              <li><Link href="/register" className="hover:text-white">Criar conta</Link></li>
              <li><Link href="/patient" className="hover:text-white">Portal do Paciente</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white">Contacto</h4>
            <ul className="mt-4 space-y-2 text-sm text-white/60">
              <li>Av. da Liberdade 154, Lisboa</li>
              <li>+351 211 234 567</li>
              <li>geral@clinicabemestar.pt</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-white/50">
          © {new Date().getFullYear()} Clínica Bem Estar. Todos os direitos
          reservados.
        </div>
      </div>
    </footer>
  );
}
