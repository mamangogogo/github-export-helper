import { createFileRoute } from "@tanstack/react-router";
import { GoogleGenAI } from "@google/genai";

function getVehicleLabelMalay(v?: string) {
  switch (v) {
    case "MOTORCYCLE": return "Motorsikal (Yamaha Y15)";
    case "CAR": return "Kereta (Perodua Myvi)";
    case "PICKUP": return "Pickup Truck (Toyota Hilux)";
    case "LORRY": return "Lori (Isuzu 3 Tan)";
    default: return "Motorsikal (Yamaha Y15)";
  }
}

function getFallbackResponse(status: string, message: string): string {
  const msg = (message || "").toLowerCase();
  if (msg.includes("hello") || msg.includes("hi") || msg.includes("assalam")) {
    return "Wsalam, ya bro. Tolong belikan ikut list ye. Terima kasih!";
  }
  if (status === "ACCEPTED") return "Cun bos! Nanti dah sampai kedai roger ye.";
  if (status === "ARRIVED_STORE") {
    if (msg.includes("habis") || msg.includes("tiada") || msg.includes("tukar")) {
      return "Alamak yeke... Kalau macam tu, tukar dengan apa-apa yang ada jelah bro, janji halal. Haha.";
    }
    return "Okey, baik. Take your time bro, jangan kalut. Drive safely.";
  }
  if (status === "DELIVERING") {
    if (msg.includes("on the way") || msg.includes("otw") || msg.includes("jalan")) {
      return "Baik bossku. Saya tunggu kat depan rumah ni.";
    }
    return "Orait bro, gantung kat pagar atau letak atas rak kasut pun boleh nanti.";
  }
  if (status === "ARRIVED_DESTINATION") {
    return "Okey jap saya keluar! Terima kasih banyak ye tolong hantarkan. Terbaik!";
  }
  const fallbacks = [
    "Okey cun bro, tq!",
    "Baik bos, roger nanti.",
    "Beres bro, roger nnt dkt mana.",
    "Hati-hati bawa motor tu bro, tgh mendung ni.",
    "Sorrry lambat balas, okey orait gantung je kat gate ya.",
    "Mantap runner! Tq tolong belikan.",
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

export const Route = createFileRoute("/api/customer/reply")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({}));
        const { orderDetails, runnerStatus, chatHistory, latestMessage } = body ?? {};

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
          return Response.json({
            reply: getFallbackResponse(runnerStatus, latestMessage),
            source: "simulation_engine",
          });
        }

        try {
          const ai = new GoogleGenAI({ apiKey });
          const formattedHistory = (chatHistory || [])
            .map((m: any) => `${m.sender === "runner" ? "Runner" : "Pelanggan"}: ${m.text}`)
            .join("\n");

          const systemInstruction = `
Anda adalah simulasi Pelanggan (Customer) di Malaysia yang sedang menggunakan aplikasi penghantaran runner "Rengit Runner".
Tugasan pesanan: "${orderDetails?.title || "Beli makanan"}" (Butiran: ${orderDetails?.items || "Tiada butiran"}).
Jenis kenderaan runner: "${getVehicleLabelMalay(orderDetails?.vehicleType)}".
Status penghantaran semasa: "${runnerStatus}".

Balas mesej terbaru daripada runner dengan gaya santai, ringkas, bahasa sembang rakyat Malaysia (Manglish).
Gunakan terma seperti 'bro', 'sis', 'boss', 'tq', 'okay baik', 'jap', 'cun', 'orait'.
1-2 baris sahaja. Jangan letak label penutur atau tanda petikan.
          `;

          const prompt = `Sejarah perbualan:\n${formattedHistory}\n\nMesej terbaharu daripada Runner: "${latestMessage}"\n\nBalasan anda sebagai pelanggan:`;

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { systemInstruction, temperature: 0.8 },
          });

          const replyText = response.text?.trim() || "Okey baik, tq!";
          return Response.json({ reply: replyText, source: "gemini_api" });
        } catch (error: any) {
          console.error("Gemini API error:", error);
          return Response.json({
            reply: getFallbackResponse(runnerStatus, latestMessage),
            source: "error_fallback",
            error: error?.message,
          });
        }
      },
    },
  },
});
