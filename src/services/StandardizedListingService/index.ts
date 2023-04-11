import { Prisma, PrismaClient } from "@prisma/client";
import getFromEliazabeth from "./providers/elizabeth";
import getFromKtimatemporiki from "./providers/ktimatemporiki";
import getFromMinoas from "./providers/minoas";
import { randomUUID } from "crypto";

type Getters = Record<
  string,
  () => Promise<{
    provider: string;
    results: Prisma.StandardizedListingCreateInput[];
    totalListingsNum: number;
    processedListingNum: number;
  }>
>;

class StandardizedListingService {
  prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  getFromAll = async () => {
    const response = await Promise.all([
      getFromEliazabeth(),
      getFromKtimatemporiki(),
      getFromMinoas(),
    ]);

    await Promise.all(
      response.map(async (providerResponse) => {
        const data = providerResponse.results.map((listing) => ({
          listingId: `${listing.listingId || randomUUID()}`,
          name: listing.name,
          sizeM2: listing.sizeM2,
          price: listing.price,
          pricePerM2: parseInt(`${listing.pricePerM2}`, 10),
          url: listing.url,
          provider: listing.provider,
        }));

        return this.prisma.standardizedListing.createMany({
          data,
        });
      })
    );
  };

  getters: Getters = {
    elizabeth: getFromEliazabeth,
    ktimatemporiki: getFromKtimatemporiki,
    minoas: getFromMinoas,
  };

  getFromProvider = async (provider: string) => {
    if (!this.getters[provider]) {
      throw new Error("INVALID_PROVIDER");
    }
    const response = await this.getters[provider]();

    const data = response.results.map((listing) => ({
      listingId: `${listing.listingId || randomUUID()}`,
      name: listing.name,
      sizeM2: listing.sizeM2,
      price: listing.price,
      pricePerM2: parseInt(`${listing.pricePerM2}`, 10),
      url: listing.url,
      provider: listing.provider,
    }));

    return this.prisma.standardizedListing.createMany({
      data,
    });
  };
}

export default StandardizedListingService;
