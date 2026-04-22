const xofFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XOF",
  maximumFractionDigits: 0,
});

export const formatXOF = (value: number): string => {
  const amount = Number(value) || 0;
  return xofFormatter.format(amount);
};
