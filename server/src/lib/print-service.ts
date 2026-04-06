export type PrintTemplatePayload = Record<string, string | number | null | undefined>;

export class PrintService {
  buildBoardingPassTicket(payload: PrintTemplatePayload) {
    return [
      "\u001B@\n",
      "SKYBRIDGE ATLANTIC\n",
      "BOARDING PASS\n",
      "-----------------------------\n",
      `PAX: ${payload.passenger}\n`,
      `FLT: ${payload.flightNumber}  ${payload.origin}-${payload.destination}\n`,
      `DATE: ${payload.date}  GATE: ${payload.gate}\n`,
      `SEAT: ${payload.seat}  CLASS: ${payload.cabinClass}\n`,
      `LOC: ${payload.locator}\n`,
      `STATUS: CHECK-IN COMPLETE\n`,
      "-----------------------------\n",
      "VALID FOR BOARDING\n",
      "\n\n\n",
      "\u001DV\u0001",
    ].join("");
  }

  buildBaggageReceiptTicket(payload: PrintTemplatePayload) {
    return [
      "\u001B@\n",
      "SKYBRIDGE ATLANTIC\n",
      "BAGGAGE RECEIPT\n",
      "-----------------------------\n",
      `PAX: ${payload.passenger}\n`,
      `FLT: ${payload.flightNumber}\n`,
      `BAG TAG: ${payload.bagTag}\n`,
      `PCS: ${payload.pieces}  KG: ${payload.weight}\n`,
      `EXCESS EUR: ${payload.excessFee}\n`,
      `BARCODE: ${payload.barcode}\n`,
      "-----------------------------\n",
      "KEEP THIS RECEIPT\n",
      "\n\n\n",
      "\u001DV\u0001",
    ].join("");
  }

  preview(type: "boarding-pass" | "baggage-receipt", payload: PrintTemplatePayload) {
    return {
      type,
      escpos:
        type === "boarding-pass"
          ? this.buildBoardingPassTicket(payload)
          : this.buildBaggageReceiptTicket(payload),
      windowsPrintableText:
        type === "boarding-pass"
          ? `BOARDING PASS\n${payload.passenger}\n${payload.flightNumber}\n${payload.seat}`
          : `BAGGAGE RECEIPT\n${payload.passenger}\n${payload.bagTag}\n${payload.weight} KG`,
    };
  }
}

export const printService = new PrintService();
