import { Prisma } from "@prisma/client";
import axios from "axios";
import parseCurrency from "parsecurrency";
import { load } from "cheerio";

const log = (str: string) => {
  console.log(`==> ELIZABETH: ${str}`);
};

const LISTINGS_URL =
  "https://www.elizabethestateagency.com/en/akinita/Chania_City/";

const getForPage = async (page = 1) => {
  log(`Fetching page ${page}`);
  const results: Prisma.StandardizedListingCreateInput[] = [];
  const response = await axios.get(LISTINGS_URL, {
    params: {
      pno: page,
    },
  });

  const $ = load(response.data);
  const listingEls = $("#cont > a");
  const totalListingsEl = $("#intro > h1");
  const match = totalListingsEl.text().match(/\d+/g);

  const totalListingInt = match && match[0] ? parseInt(match[0], 10) : 0;
  log(`Listing ELs found ${listingEls.length}`);

  listingEls.each((index, b) => {
    const matchedTitle = $(b).find(".details_head > h2").text();
    const matchedPrice = $(b).find(".listing_right > p").text();
    const parsedPrice = parseCurrency(matchedPrice || "0");
    const priceNumber = parsedPrice ? parsedPrice.value : 0;
    const matchedMeta = $(b).find(".listing_left > ul > li");

    let size: string | null = null;
    matchedMeta.each((i, m) => {
      const matches = $(m)
        .text()
        .match(/(House|Building) area: ([\d,]+) m²/);
      if (matches && matches[2]) {
        size = matches[2];
      }
    });

    log(`Listing: ${matchedTitle}`);
    log(`Size: ${size}`);

    const url = $(b).attr("href");
    const sizeNumber = size ? parseInt(size, 10) : NaN;
    const listingId = url ? new URL(url).searchParams.get("id") : "";
    if (listingId) {
      const data = {
        listingId,
        name: matchedTitle,
        pricePerM2: priceNumber / sizeNumber,
        price: priceNumber,
        sizeM2: sizeNumber,
        url: url ? url.replace("/", "") : "",
        provider: "ELIZABETH",
      };

      if (isNaN(sizeNumber)) {
        console.error("NaN Size");
      } else if (sizeNumber < 10) {
        console.error("size < 10");
      } else {
        results.push(data);
      }
    }
  });

  return { results, totalListings: totalListingInt };
};

const getFromEliazabeth = async () => {
  const { results: firstPageResults, totalListings } = await getForPage(1);
  const pageSize = firstPageResults.length;
  const totalResults = [firstPageResults];

  let pagesToGet = Math.ceil(totalListings / pageSize) + 1;
  for (let i = 2; i < pagesToGet; i += 1) {
    const { results: pageReults } = await getForPage(i);
    totalResults.push(pageReults);
  }

  const results = totalResults.flat();

  return {
    provider: "ELIZABETH",
    results,
    totalListingsNum: totalListings,
    processedListingNum: results.length,
  };
};

export default getFromEliazabeth;
