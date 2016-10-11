import { provideRouter, RouterConfig } from '@angular/router';

import { VDMRoutes } from './pages/+vdm/index';
// import { HomeRoutes } from './+home/index';

const routes: RouterConfig = [
  ...VDMRoutes
  // ...AboutRoutes
];

export const APP_ROUTER_PROVIDERS = [
  provideRouter(routes),
];
