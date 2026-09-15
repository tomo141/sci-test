// Guidance is managed in MyASP. This endpoint never dispatches SMTP messages.
export { runMyaspSyncJobs as runMailJobs } from "./myasp-job";
