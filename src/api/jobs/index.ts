import Hapi from "@hapi/hapi";
import {
  nadlanAll,
  madlanSingleProvider,
  madlanSingleListing,
} from "./handlers";

const register = async function (server: Hapi.Server) {
  server.route([
    {
      method: "POST",
      path: "/jobs/nadlan/all",
      options: {
        auth: false,
        tags: ["api", "jobs"],
        handler: nadlanAll,
      },
    },
    {
      method: "POST",
      path: "/jobs/nadlan/{provider}",
      options: {
        auth: false,
        tags: ["api", "jobs"],
        handler: madlanSingleProvider,
      },
    },
    {
      method: "GET",
      path: "/jobs/nadlan/{listingId}",
      options: {
        auth: false,
        tags: ["api", "jobs"],
        handler: madlanSingleListing,
      },
    },
  ]);
};

const jobsApiPlugin = {
  register,
  name: "jobsApi",
};

export default jobsApiPlugin;
