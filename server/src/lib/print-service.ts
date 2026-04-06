export type PrintTemplatePayload = Record<string, string | number | null | undefined>;

export class PrintService {
  buildBoardingPassTicket(payload: PrintTemplatePayload) {
    return [
      "\u001B@\n",
      "SKYBRIDGE ATLANTIC\n",
      "TARJETA DE EMBARQUE\n",
      "-----------------------------\n",
      `PAX: ${payload.passenger}\n`,
      `VLO: ${payload.flightNumber}  ${payload.origin}-${payload.destination}\n`,
      `FEC: ${payload.date}  PTA: ${payload.gate}\n`,
      `ASI: ${payload.seat}  CAB: ${payload.cabinClass}\n`,
      `LOC: ${payload.locator}  ZONA: ${payload.terminal ?? "N/D"}\n`,
      `EST: CHECK-IN COMPLETADO\n`,
      "-----------------------------\n",
      `BARCODE: ${payload.barcode ?? payload.locator}\n`,
      "VALIDO PARA EMBARQUE\n",
      "\n\n\n",
      "\u001DV\u0001",
    ].join("");
  }

  buildBaggageReceiptTicket(payload: PrintTemplatePayload) {
    return [
      "\u001B@\n",
      "SKYBRIDGE ATLANTIC\n",
      "RESGUARDO DE EQUIPAJE\n",
      "-----------------------------\n",
      `PAX: ${payload.passenger}\n`,
      `VLO: ${payload.flightNumber}\n`,
      `ETIQUETA: ${payload.bagTag}\n`,
      `PZS: ${payload.pieces}  KG: ${payload.weight}\n`,
      `EXCESO EUR: ${payload.excessFee}\n`,
      `BARCODE: ${payload.barcode}\n`,
      "-----------------------------\n",
      "CONSERVE ESTE RESGUARDO\n",
      "\n\n\n",
      "\u001DV\u0001",
    ].join("");
  }

  buildUpgradeReceiptTicket(payload: PrintTemplatePayload) {
    return [
      "\u001B@\n",
      "SKYBRIDGE ATLANTIC\n",
      "DOCUMENTO DE UPGRADE\n",
      "-----------------------------\n",
      `PAX: ${payload.passenger}\n`,
      `VLO: ${payload.flightNumber}\n`,
      `DESDE: ${payload.fromClass}\n`,
      `HACIA: ${payload.toClass}\n`,
      `ASIENTO: ${payload.seat}\n`,
      `MOTIVO: ${payload.reason}\n`,
      "-----------------------------\n",
      "ACTUALIZACION REGISTRADA\n",
      "\n\n\n",
      "\u001DV\u0001",
    ].join("");
  }

  preview(type: "boarding-pass" | "baggage-receipt" | "upgrade-receipt", payload: PrintTemplatePayload) {
    return {
      type,
      escpos:
        type === "boarding-pass"
          ? this.buildBoardingPassTicket(payload)
          : type === "upgrade-receipt"
            ? this.buildUpgradeReceiptTicket(payload)
            : this.buildBaggageReceiptTicket(payload),
      windowsPrintableText:
        type === "boarding-pass"
          ? `TARJETA DE EMBARQUE\n${payload.passenger}\n${payload.flightNumber}\n${payload.seat}`
          : type === "upgrade-receipt"
            ? `DOCUMENTO DE UPGRADE\n${payload.passenger}\n${payload.flightNumber}\n${payload.toClass}`
            : `RESGUARDO DE EQUIPAJE\n${payload.passenger}\n${payload.bagTag}\n${payload.weight} KG`,
    };
  }
}

export const printService = new PrintService();
