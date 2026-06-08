import { prisma } from "@/lib/prisma";
import { PageHeader, Card, EmptyState } from "@/components/dashboard/ui";
import { formatDateTime } from "@/lib/utils";
import { Prisma } from "@prisma/client";
import { Search } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAudit({
  searchParams,
}: {
  searchParams: { q?: string; from?: string; to?: string };
}) {
  const where: Prisma.AuditLogWhereInput = {};
  if (searchParams.q) {
    where.OR = [
      { actorName: { contains: searchParams.q, mode: "insensitive" } },
      { action: { contains: searchParams.q, mode: "insensitive" } },
      { targetEntity: { contains: searchParams.q, mode: "insensitive" } },
    ];
  }
  if (searchParams.from || searchParams.to) {
    where.timestamp = {};
    if (searchParams.from) where.timestamp.gte = new Date(searchParams.from);
    if (searchParams.to) {
      const to = new Date(searchParams.to);
      to.setHours(23, 59, 59);
      where.timestamp.lte = to;
    }
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader
        title="Registo de Auditoria"
        subtitle="Histórico completo de ações no sistema"
      />

      <Card className="mb-4">
        <form className="flex flex-wrap items-end gap-3" method="get">
          <div className="flex-1 min-w-[200px]">
            <label className="label">Pesquisar</label>
            <input name="q" defaultValue={searchParams.q} className="input" placeholder="Utilizador, ação ou entidade..." />
          </div>
          <div>
            <label className="label">De</label>
            <input name="from" type="date" defaultValue={searchParams.from} className="input" />
          </div>
          <div>
            <label className="label">Até</label>
            <input name="to" type="date" defaultValue={searchParams.to} className="input" />
          </div>
          <button type="submit" className="btn-primary"><Search size={16} /> Filtrar</button>
        </form>
      </Card>

      <Card>
        {logs.length === 0 ? (
          <EmptyState message="Sem registos de auditoria." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-th">Data/Hora</th>
                  <th className="table-th">Ator</th>
                  <th className="table-th">Ação</th>
                  <th className="table-th">Entidade</th>
                  <th className="table-th">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-gray-50">
                    <td className="table-td text-body">{formatDateTime(l.timestamp)}</td>
                    <td className="table-td font-medium">{l.actorName || "Sistema"}</td>
                    <td className="table-td">{l.action}</td>
                    <td className="table-td text-body">{l.targetEntity}{l.targetId ? ` #${l.targetId.slice(-6)}` : ""}</td>
                    <td className="table-td text-body">{l.ipAddress || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
