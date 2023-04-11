import Hapi from "@hapi/hapi";
import { nadlanAll, madlanSingleProvider } from "./handlers";

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
  ]);
};

const jobsApiPlugin = {
  register,
  name: "jobsApi",
};

export default jobsApiPlugin;
