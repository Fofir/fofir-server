import axios, { AxiosPromise } from "axios";
import parseCurrency from "parsecurrency";
import { keyBy } from "lodash";
import { Prisma } from "@prisma/client";

const basePayload = {
  "data[offer-type][slug]": "offer-type",
  "data[offer-type][baseSlug]": "offer_type",
  "data[offer-type][key]": "offer-type",
  "data[offer-type][units]": "",
  "data[offer-type][compare]": "=",
  "data[offer-type][values][0][name]": "For Sale",
  "data[offer-type][values][0][value]": "sale",
  "data[property-type][slug]": "property-type",
  "data[property-type][baseSlug]": "property_type",
  "data[property-type][key]": "property-type",
  "data[property-type][units]": "",
  "data[property-type][compare]": "=",
  "data[property-type][values][0][name]": "Apartment",
  "data[property-type][values][0][value]": "apartment",
  "data[prefecture][slug]": "prefecture",
  "data[prefecture][baseSlug]": "",
  "data[prefecture][key]": "prefecture",
  "data[prefecture][units]": "",
  "data[prefecture][compare]": "=",
  "data[prefecture][values][0][name]": "Chania",
  "data[prefecture][values][0][value]": "chania",
  limit: 999,
};

const headers = {
  accept: "application/json, text/plain, */*",
  "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
  "cache-control": "no-cache",
  "content-type": "application/x-www-form-urlencoded",
  pragma: "no-cache",
  "sec-ch-ua":
    '"Not_A Brand";v="99", "Google Chrome";v="109", "Chromium";v="109"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "x-requested-with": "XMLHttpRequest",
  cookie:
    "_gcl_au=1.1.1065555605.1673437495; pys_start_session=true; PHPSESSID=p3lbbqphag8pvbqh2dq9gmgpc1; pys_session_limit=true; _gid=GA1.2.497557915.1674059772; pys_first_visit=true; pysTrafficSource=google.com; pys_landing_page=https://ktimatoemporiki.gr/; last_pysTrafficSource=google.com; last_pys_landing_page=https://ktimatoemporiki.gr/; AppoGN=%7B%22pv%22%3A1%2C%22exp%22%3A2073600%7D; Appo_55cb=%7B%22v%22%3A1%2C%22exp%22%3A%2286400%22%7D; _ga=GA1.2.2006084093.1673437495; _gat_gtag_UA_1351794_1=1; mh_results=https://ktimatoemporiki.gr/real_estate_for_sale_chania/?offer-type=sale&property-type=apartment&prefecture=chania&price_to=200000; _ga_GPM73RNNLM=GS1.1.1674059771.2.1.1674059876.50.0.0",
  Referer:
    "https://ktimatoemporiki.gr/real_estate_for_sale_chania/?offer-type=sale&property-type=apartment&prefecture=chania&price_to=200000",
  "Referrer-Policy": "no-referrer-when-downgrade",
};

type Response = {
  found_results: number;
  results: {
    id: string;
    name: string;
    link: string;
    price: {
      price: string | null;
    }[];
    attributes: {
      values: {
        value: any;
      }[];
      slug: string;
    }[];
  }[];
};

const getFromKtimatemporiki = async () => {
  const { data } = await axios.post<object, AxiosPromise<Response>>(
    "https://ktimatoemporiki.gr/wp-json/myhome/v1/estates?currency=any&limit=999&page=1",
    { ...basePayload },
    {
      headers,
    }
  );

  let results: Prisma.StandardizedListingCreateInput[] = [];

  data.results.forEach((result) => {
    const attsBySlug = keyBy(result.attributes, "slug");
    const sizeString = attsBySlug["property-size"]?.values[0]?.value;
    const sizeNumber = parseInt(sizeString, 10);
    if (result.price) {
      const priceString = result.price[0]?.price;
      const priceNumber = parseCurrency(priceString || "0");
      const priceNumberInt = priceNumber ? priceNumber.value : 0;
      const pricePerM2 = priceNumberInt / sizeNumber;

      if (isNaN(pricePerM2)) {
        console.error("NaN price");
      } else {
        results.push({
          listingId: result.id,
          name: result.name,
          price: priceNumberInt,
          sizeM2: sizeNumber,
          url: result.link,
          pricePerM2,
          provider: "KTIMATEMPORIKI",
        });
      }
    }
  });

  const response = {
    provider: "KTIMATEMPORIKI",
    results,
    totalListingsNum: data.found_results,
    processedListingNum: data.results.length,
  };

  return response;
};

export default getFromKtimatemporiki;
