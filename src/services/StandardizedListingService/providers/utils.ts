export const parseResults = (
  results: {
    pricePerM2: number;
    size: number;
  }[] = []
) => {
  let allPricePerM2 = 0;
  let countEligibleForPricePerM2 = 0;
  let allM2 = 0;

  results.forEach((result) => {
    if (!isNaN(result.pricePerM2)) {
      allM2 += result.size;
      allPricePerM2 += result.pricePerM2;
      countEligibleForPricePerM2 += 1;
    }
  });

  return {
    allPricePerM2,
    avgPricePerM2: allPricePerM2 / countEligibleForPricePerM2,
    avgM2: allM2 / countEligibleForPricePerM2,
  };
};
