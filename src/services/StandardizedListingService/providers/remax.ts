// https://www.remax.gr/pwliseis-agora-katoikies/10981-kentro?asstype=2&prcat=3&lang=en&gclid=CjwKCAjwitShBhA6EiwAq3RqA31csfRRxoBp1wWcDZ-xjEkr-oFf0TKgnhxPxTGjwuNts2XS2WXmLBoCHjsQAvD_BwE&Property_page=2

import { Prisma } from "@prisma/client";
import axios from "axios";
import parseCurrency from "parsecurrency";
import { load } from "cheerio";

const log = (str: string) => {
  console.log(`==> REMAX: ${str}`);
};

const LISTINGS_URL =
  "https://www.remax.gr/pwliseis-agora-katoikies/10981-kentro";

const getForPage = async (page = 1) => {
  log(`Fetching page ${page}`);
  const results: Prisma.StandardizedListingCreateInput[] = [];
  const response = await axios.get(LISTINGS_URL, {
    params: {
      Property_page: page,
      assType: 2,
      prcat: 3,
      lang: "en",
      gclid:
        "CjwKCAjwitShBhA6EiwAq3RqA31csfRRxoBp1wWcDZ-xjEkr-oFf0TKgnhxPxTGjwuNts2XS2WXmLBoCHjsQAvD_BwE",
    },
  });

  const $ = load(response.data);
  const listingsContainer = $(".properties-list-main-container");
  const totalListingsEl = $(
    "#page > div.page-wrapper > main > div.infobar > div > div > span.matches"
  );

  const totalListingInt = totalListingsEl.text()
    ? parseInt(totalListingsEl.text(), 10)
    : 0;

  const listingEls = listingsContainer.children("div");
  listingEls.each((index, b) => {
    const el = $(b);
    const matchedTitle = el
      .find(".info-container > header > .category")
      .text()
      .trim();
    const matchedPrice = el.find(".price").first().text();
    const parsedPrice = parseCurrency(matchedPrice || "0");
    const priceNumber = parsedPrice ? parsedPrice.value : 0;
    const matchedMeta = el.find(".main-info > a > .features .sqrMeters .label");
    const matchedSize = el.find(".sqrMeters").first().text().trim();
    const size = matchedSize ? matchedSize.replace("m2", "") : matchedSize;
    const sizeNumber = size ? parseInt(size, 10) : NaN;

    const url = el.find(".main-info > a").first().attr("href");
    const listingId = el.find(".id-number").text().trim().replace("ID:", "");
    if (listingId) {
      const data = {
        listingId,
        name: matchedTitle,
        pricePerM2: priceNumber / sizeNumber,
        price: priceNumber,
        sizeM2: sizeNumber,
        url: url ? url.replace("/", "") : "",
        provider: "REMAX",
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

const getFromRemax = async () => {
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
    provider: "REMAX",
    results,
    totalListingsNum: totalListings,
    processedListingNum: results.length,
  };
};

export default getFromRemax;
