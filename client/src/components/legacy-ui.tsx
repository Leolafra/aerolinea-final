import type { ReactNode } from "react";
import { formatDateTime, translateSeatState } from "../formatters";
import type { BarcodeSegment, DocumentPayload, FlightDetail } from "../types";

type DenseCell = string | number | ReactNode;

export function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <div className="section-heading"><span>{eyebrow}</span><h2>{title}</h2></div>;
}

export function Window({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="window">
      <div className="window-title">
        <span>{title}</span>
        {actions ? <div className="window-actions">{actions}</div> : null}
      </div>
      <div className="panel-content">{children}</div>
    </section>
  );
}

export function DenseTable({ columns, rows, emptyMessage = "Sin datos disponibles." }: { columns: string[]; rows: DenseCell[][]; emptyMessage?: string }) {
  return (
    <table className="dense-table">
      <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
      <tbody>
        {rows.length > 0 ? (
          rows.map((row, index) => (
            <tr key={`${columns.join("-")}-${index}`}>
              {row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`}>{cell}</td>)}
            </tr>
          ))
        ) : (
          <tr><td colSpan={columns.length} className="empty-table">{emptyMessage}</td></tr>
        )}
      </tbody>
    </table>
  );
}

export function FlightDetailPanel({ flight }: { flight: FlightDetail }) {
  return (
    <div className="detail-stack">
      <div className="detail-grid">
        <div><strong>Ruta:</strong> {flight.origin?.code}-{flight.destination?.code}</div>
        <div><strong>Terminal:</strong> {flight.terminal?.code ?? "-"}</div>
        <div><strong>Puerta:</strong> {flight.gate?.code ?? "-"}</div>
        <div><strong>Aeronave:</strong> {flight.aircraft?.model ?? "-"}</div>
        <div><strong>Tripulación:</strong> {flight.crew.join(", ")}</div>
      </div>
      <DenseTable columns={["Evento", "Hora"]} rows={flight.timeline.map((item) => [item.label, formatDateTime(item.at)])} />
      <DenseTable columns={["Incidencia", "Prioridad", "Estado"]} rows={flight.incidents.map((item) => [item.type, item.severity, item.status])} />
    </div>
  );
}

export function SeatMapView({ detail, onAssignSeat }: { detail: FlightDetail; onAssignSeat: (bookingId: string, seatNumber: string) => void }) {
  const grouped = new Map<number, Array<(typeof detail.seatAssignments)[number]>>();
  for (const seat of detail.seatAssignments) {
    const row = Number(seat.seatNumber.replace(/[A-Z]/g, ""));
    grouped.set(row, [...(grouped.get(row) ?? []), seat].sort((a, b) => a.seatNumber.localeCompare(b.seatNumber)));
  }
  const pendingBooking = detail.bookings.find((booking) => !booking.seatNumber) ?? detail.bookings[0];

  return (
    <div className="seat-map">
      <div className="seat-legend">
        <span className="legend free">Libre</span>
        <span className="legend occupied">Ocupado</span>
        <span className="legend exit">Salida</span>
        <span className="legend premium">Premium</span>
      </div>
      <div className="seat-grid">
        {[...grouped.entries()].sort((a, b) => a[0] - b[0]).map(([row, seats]) => (
          <div key={row} className="seat-row">
            <div className="row-label">{row}</div>
            {seats.map((seat) => (
              <button
                key={seat.id}
                className={`seat ${seat.state.toLowerCase()}`}
                disabled={Boolean(seat.bookingId)}
                title={seat.passenger ? `${seat.passenger.firstName} ${seat.passenger.lastName}` : `${seat.position} · ${translateSeatState(seat.state)}`}
                onClick={() => pendingBooking && onAssignSeat(pendingBooking.id, seat.seatNumber)}
              >
                {seat.seatNumber}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function BarcodeVisual({ value, segments }: { value: string; segments: BarcodeSegment[] }) {
  return (
    <div className="barcode-visual" aria-label={`Código de barras ${value}`}>
      <div className="barcode-bars">
        {segments.map((segment) => (
          <span
            key={segment.id}
            className={segment.dark ? "barcode-bar dark" : "barcode-bar light"}
            style={{ width: `${Math.max(1, segment.width) * 2}px` }}
          />
        ))}
      </div>
      <div className="barcode-line">{value}</div>
    </div>
  );
}

export function DocumentPreviewCard({ documentPreview }: { documentPreview: DocumentPayload }) {
  return (
    <div className="document-preview-card">
      <div className="document-summary">
        <div><strong>Pasajero:</strong> {documentPreview.boardingPass.passenger}</div>
        <div><strong>Vuelo:</strong> {documentPreview.boardingPass.vuelo}</div>
        <div><strong>Localizador:</strong> {documentPreview.boardingPass.localizador}</div>
        <div><strong>Asiento:</strong> {documentPreview.boardingPass.asiento}</div>
        <div><strong>Puerta:</strong> {documentPreview.boardingPass.puerta}</div>
        <div><strong>Terminal:</strong> {documentPreview.boardingPass.terminal}</div>
      </div>
      <div className="document-visual-grid">
        <img src={documentPreview.boardingPass.qrDataUrl} alt="QR de embarque" className="qr-image" />
        <div className="document-paper">
          <div className="document-paper-title">{documentPreview.boardingPass.a4Preview.titulo}</div>
          <div className="document-paper-subtitle">{documentPreview.boardingPass.a4Preview.subtitulo}</div>
          <BarcodeVisual value={documentPreview.boardingPass.barcodeValue} segments={documentPreview.boardingPass.barcodeSegments} />
        </div>
      </div>
      <pre className="thermal-box">{documentPreview.boardingPass.thermalPreview.escpos}</pre>
      {documentPreview.baggageReceipt?.length ? (
        <div className="baggage-preview-list">
          {documentPreview.baggageReceipt.map((item) => (
            <div key={item.id} className="baggage-preview-card">
              <div><strong>Etiqueta:</strong> {item.bagTag}</div>
              <div><strong>Piezas:</strong> {item.pieces}</div>
              <div><strong>Peso:</strong> {item.totalWeightKg} kg</div>
              <div><strong>Exceso:</strong> {item.excessFee} EUR</div>
              <BarcodeVisual value={item.barcode} segments={item.barcodeSegments} />
              <pre className="thermal-box compact">{item.thermalPreview.escpos}</pre>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
