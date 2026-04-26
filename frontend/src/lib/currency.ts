const xofFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XOF",
  maximumFractionDigits: 0,
});

export const formatXOF = (value: number): string => {
  const amount = Number(value) || 0;
  return xofFormatter.format(amount);
};

export const formatCompactXOF = (value: number): string => {
  const amount = Number(value) || 0;
  
  if (amount >= 1000000000) {
    return (amount / 1000000000).toFixed(1) + " Md FCFA";
  }
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1) + " M FCFA";
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(1) + " K FCFA";
  }
  
  return xofFormatter.format(amount);
};
