export const site = {
  name: "Clínica Bem Estar",
  foundedYear: 2003,
  phone: "+244 934 859 497",
  phoneRaw: "244934859497",
  whatsapp: "https://wa.me/244934859497",
  whatsappBooking:
    "https://wa.me/244934859497?text=" +
    encodeURIComponent(
      "Olá! Gostaria de agendar uma consulta na Clínica Bem Estar.",
    ),
  email: "geral@clinicabemestar.ao",
  address: "Rua Amílcar Cabral, 154 — Maianga",
  city: "Luanda, Angola",
};

export function whatsappFor(subject: string) {
  return (
    "https://wa.me/244934859497?text=" +
    encodeURIComponent(
      `Olá! Gostaria de marcar uma consulta de ${subject} na Clínica Bem Estar.`,
    )
  );
}
