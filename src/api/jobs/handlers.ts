import { IRequest } from "../../interfaces";

export const nadlanAll = async (request: IRequest) => {
  const {
    server: {
      plugins: {
        services: { standardizedListing },
      },
    },
  } = request;

  try {
    await standardizedListing.getFromAll();
    return { success: true };
  } catch (err) {
    console.error(err);
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }

    throw err;
  }
};

export const madlanSingleProvider = async (request: IRequest) => {
  const {
    params: { provider },
    server: {
      plugins: {
        services: { standardizedListing },
      },
    },
  } = request;

  try {
    await standardizedListing.getFromProvider(provider);
    return { success: true };
  } catch (err) {
    console.error(err);
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }

    throw err;
  }
};

export const madlanSingleListing = async (request: IRequest) => {
  const {
    params: { listingId },
    server: {
      plugins: {
        services: { standardizedListing },
      },
    },
  } = request;

  const result = await standardizedListing.getDetailsForStandardizedListing(
    listingId
  );

  return result;
};
