import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CRM Tupiniquim",
    short_name: "Tupiniquim CRM",
    description: "Gestão comercial da Tupiniquim Tech Solutions",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f5f5f2",
    theme_color: "#020617",
    lang: "pt-BR",
    categories: ["business", "productivity"],
  };
}
