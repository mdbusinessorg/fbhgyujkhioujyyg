import Link from "next/link";
import { HeartPulse } from "lucide-react";
import { site } from "@/lib/site";

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
              Cuidados de saúde de excelência, centrados em si. Desde {site.foundedYear}
              {" "}ao serviço da comunidade em {site.city}.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white">Navegação</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white">Início</Link></li>
              <li><Link href="/especialidades" className="hover:text-white">Especialidades</Link></li>
              <li><Link href="/sobre" className="hover:text-white">Sobre</Link></li>
              <li><Link href="/contacto" className="hover:text-white">Contacto</Link></li>
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
              <li>{site.address}</li>
              <li>{site.city}</li>
              <li><a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-white">{site.phone}</a></li>
              <li>{site.email}</li>
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
