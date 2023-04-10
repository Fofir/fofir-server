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
