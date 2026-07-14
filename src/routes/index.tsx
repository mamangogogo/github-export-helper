import { createFileRoute } from "@tanstack/react-router";
import RengitApp from "../RengitApp";

export const Route = createFileRoute("/")({
  component: RengitApp,
  head: () => ({
    meta: [
      { title: "Rengit Runner - Servis Penghantaran Mudah & Pantas" },
      {
        name: "description",
        content:
          "Aplikasi runner untuk penghantaran makanan dan barangan dengan simulasi peta interaktif dan pelanggan pintar bertenaga AI.",
      },
      { property: "og:title", content: "Rengit Runner" },
      {
        property: "og:description",
        content:
          "Aplikasi runner untuk penghantaran makanan dan barangan di Rengit.",
      },
    ],
  }),
});
