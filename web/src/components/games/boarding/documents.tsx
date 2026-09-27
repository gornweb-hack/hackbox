import type { ReactNode } from "react";
import type { Passenger } from "@/games/boarding/rules";
import { cn } from "@/lib/utils";

// Билет и паспорт пассажира у двери. В разборе поле с несоответствием подсвечивается красным

// «27.09» для сегодняшнего дня со сдвигом: в билете хранится сдвиг, а не дата
export function formatDay(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function Documents({ passenger, reveal }: { passenger: Passenger | null; reveal: boolean }) {
  const flawed = (field: Passenger["flaw"]) => reveal && passenger?.flaw === field;
  const ticket = passenger?.ticket;

  return (
    <div className="grid grid-cols-[1.4fr_1fr] gap-2 px-3 pt-3">
      <Card title="Билет · ВСМ">
        {ticket ? (
          <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-1.5">
            <Field label="Дата" value={formatDay(ticket.day)} mono flawed={flawed("date")} />
            <Field label="Отправление" value={ticket.time} mono flawed={flawed("time")} />
            <Field label="Вагон, место" value={`${ticket.car}, ${ticket.seat}`} mono />
            <Field label="Пассажир" value={ticket.name} />
          </dl>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {passenger?.kind === "deadPhone" ? "Билет в телефоне, а телефон разряжен" : passenger ? "Билета нет" : "—"}
          </p>
        )}
      </Card>
      <Card title="Паспорт">
        {passenger?.document ? (
          <div className="flex flex-col gap-1.5">
            <span className={cn("text-[15px] leading-snug", flawed("document") && "font-semibold text-zone-red")}>{passenger.document}</span>
            <span className="text-[12px] text-muted-foreground">Серия и номер</span>
            <span className="font-mono text-sm">45 ** ******</span>
          </div>
        ) : (
          <p className={cn("py-6 text-center text-sm text-muted-foreground", flawed("document") && "font-semibold text-zone-red")}>
            {passenger ? "Документа нет" : "—"}
          </p>
        )}
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex min-h-[150px] flex-col gap-2 rounded-xl border bg-card p-3 shadow-card">
      <h3 className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, value, mono, flawed }: { label: string; value: string; mono?: boolean; flawed?: boolean }) {
  return (
    <>
      <dt className="text-[12px] text-muted-foreground">{label}</dt>
      <dd className={cn("text-[15px] leading-snug", mono && "font-mono", flawed && "font-semibold text-zone-red")}>{value}</dd>
    </>
  );
}
