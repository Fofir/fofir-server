import { Prisma } from "@prisma/client";
import axios from "axios";
import cheerio from "cheerio";
import parseCurrency from "parsecurrency";

const LISTINGS_URL = "https://minoasestate.com/listings";

const PROVIDER = "MINOAS";

const log = (str: string) => {
  console.log(`==> ${PROVIDER}: ${str}`);
};

const getForPage = async (page = 1) => {
  const results: Prisma.StandardizedListingCreateInput[] = [];
  const response = await axios.get(LISTINGS_URL, {
    params: {
      lang: "en",
      category: "residential",
      listingType: "for sale",
      page,
    },
  });

  const $ = cheerio.load(response.data);
  const baseUrl = $("base").attr("href");
  const listingEls = $(".kf_listing_outer_wrap");
  const totalListingsEl = $(
    "body > div > div.kf_property_content_wrap > section > div > div > div.col-md-9 > div.row > div:nth-child(1)"
  );

  const totalListingsMatch = totalListingsEl.text().match(/\d+/g);

  listingEls.each((index, b) => {
    const matchedPrice = $(b).find(".kf_property_place > h5").text();
    const parsedPrice = parseCurrency(matchedPrice || "0");
    const priceNumber = parsedPrice ? parsedPrice.value : 0;
    const title = $(b).find(".kf_property_caption h5 a").text();

    const matchedTitle = title?.match(/(\d+)/);

    const url = $(b).find(".kf_property_caption h5 a").attr("href") || "";
    const sizeNumber = parseInt(matchedTitle ? matchedTitle[1] : "0", 10);
    const data = {
      listingId: url.replace("/", ""),
      name: title,
      pricePerM2: priceNumber / sizeNumber,
      price: priceNumber,
      sizeM2: sizeNumber,
      url: `${baseUrl}${url}?lang=en`,
      provider: PROVIDER,
    };

    results.push(data);
  });

  return {
    results,
    totalListings: totalListingsMatch ? parseInt(totalListingsMatch[0], 10) : 0,
  };
};

const getFromMinoas = async () => {
  try {
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
      results,
      totalListingsNum: totalListings,
      processedListingNum: results.length,
      provider: PROVIDER,
    };
  } catch (err) {
    console.error(err);
    if (err instanceof Error) {
      log(err.message);
    }
    return {
      results: [],
      totalListingsNum: 0,
      processedListingNum: 0,
      provider: PROVIDER,
    };
  }
};

export default getFromMinoas;
