import { Router } from "express";
import QRCode from "qrcode";
import { requireAuth, requireCustomerAuth } from "../../middleware/auth.js";
import { printService } from "../../lib/print-service.js";
import { store } from "../../lib/store.js";

export const documentsRouter = Router();

function buildBarcodePattern(value: string) {
  return value.split("").map((character, index) => ({
    id: `${character}-${index}`,
    width: ((character.charCodeAt(0) + index) % 4) + 1,
    dark: index % 2 === 0 || /[A-Z0-9]/.test(character),
  }));
}

async function buildDocumentResponse(bookingId: string, actorId: string) {
  const docs = store.getDocumentsForBooking(bookingId);
  if (!docs) {
    return null;
  }
  const qrDataUrl = await QRCode.toDataURL(docs.boardingPass.qrValue, { margin: 1, width: 180 });
  await store.registerPrint(actorId, "BOARDING_PASS_PREVIEW", bookingId, 1, "SIMULACION");
  return {
    ...docs,
    boardingPass: {
      ...docs.boardingPass,
      qrDataUrl,
      barcodeSegments: buildBarcodePattern(docs.boardingPass.barcodeValue),
      thermalPreview: printService.preview("boarding-pass", {
        passenger: docs.boardingPass.passenger,
        flightNumber: docs.boardingPass.vuelo,
        origin: docs.boardingPass.vuelo.slice(0, 2),
        destination: docs.boardingPass.vuelo.slice(-2),
        date: new Date().toLocaleString("es-ES"),
        gate: docs.boardingPass.puerta,
        seat: docs.boardingPass.asiento,
        cabinClass: "SEGUN BILLETE",
        locator: docs.boardingPass.localizador,
        terminal: docs.boardingPass.terminal,
        barcode: docs.boardingPass.barcodeValue,
      }),
      a4Preview: {
        titulo: "Tarjeta de embarque",
        subtitulo: "Documento operativo listo para impresion A4 o descarga PDF.",
      },
    },
    baggageReceipt: docs.baggageReceipt.map((item) => ({
      ...item,
      barcodeSegments: buildBarcodePattern(item.barcode),
      thermalPreview: printService.preview("baggage-receipt", {
        passenger: docs.boardingPass.passenger,
        flightNumber: docs.boardingPass.vuelo,
        bagTag: item.bagTag,
        pieces: item.pieces,
        weight: item.totalWeightKg,
        excessFee: item.excessFee,
        barcode: item.barcode,
      }),
    })),
  };
}

documentsRouter.get("/booking/:bookingId", requireAuth, async (req, res) => {
  const payload = await buildDocumentResponse(String(req.params.bookingId), req.session.user!.id);
  if (!payload) {
    return res.status(404).json({ message: "Documento no encontrado." });
  }
  res.json(payload);
});

documentsRouter.get("/customer/booking/:bookingId", requireCustomerAuth, async (req, res) => {
  const payload = await buildDocumentResponse(String(req.params.bookingId), req.session.customer!.id);
  if (!payload) {
    return res.status(404).json({ message: "Documento no encontrado." });
  }
  res.json(payload);
});
