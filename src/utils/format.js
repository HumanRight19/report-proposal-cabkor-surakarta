export function formatRupiah(value) {
  const number = Number(value) || 0;

  return `Rp${new Intl.NumberFormat("id-ID").format(number)}`;
}

export function parseMoney(value) {
  return Number(String(value ?? "").replace(/\D/g, "")) || 0;
}

export function formatMoneyInput(value) {
  const number = parseMoney(value);

  if (!number) {
    return "";
  }

  return number.toLocaleString("id-ID");
}
