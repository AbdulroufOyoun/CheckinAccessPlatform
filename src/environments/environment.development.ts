export const environment = {
  production: false,
  /** Central CheckinAccess API (Herd). Use :8000 only if you run `php artisan serve`. */
  apiBaseUrl: 'http://checkinaccess.test/api',
  appName: 'CheckinAccess',
  tenantAdmin: {
    scheme: 'http',
    port: 4200,
  },
};
