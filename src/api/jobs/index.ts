import Hapi from "@hapi/hapi";
import { nadlanAll } from "./handlers";

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
  ]);
};

const jobsApiPlugin = {
  register,
  name: "jobsApi",
};

export default jobsApiPlugin;
