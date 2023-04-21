import { Prisma, PrismaClient } from "@prisma/client";
import getFromEliazabeth, {
  getFromSingleListingPage,
} from "./providers/elizabeth";
import getFromKtimatemporiki from "./providers/ktimatemporiki";
import getFromMinoas from "./providers/minoas";
import { randomUUID } from "crypto";
import getFromRemax from "./providers/remax";

type Getters = Record<
  string,
  () => Promise<{
    provider: string;
    results: Prisma.StandardizedListingCreateInput[];
    totalListingsNum: number;
    processedListingNum: number;
  }>
>;

type SingleListingPageGetters = Record<string, (url: string) => Promise<{}>>;

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
      getFromRemax(),
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
    remax: getFromRemax,
  };

  singleListingGetters: SingleListingPageGetters = {
    ELIZABETH: getFromSingleListingPage,
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

  getDetailsForStandardizedListing = async (listingId: string) => {
    const { url, provider } =
      await this.prisma.standardizedListing.findFirstOrThrow({
        where: {
          listingId,
        },
      });

    if (!this.singleListingGetters[provider]) {
      throw new Error("INVALID_PROVIDER");
    }

    console.log(url, provider);

    const result = await this.singleListingGetters[provider](url);

    return result;
  };
}

export default StandardizedListingService;
