export type HubConfig = {
  name: string;
  address1: string;
  address2?: string;
  postcode?: string;
  city?: string;
  country?: string;
  contact?: string;
  phone?: string;
  email?: string;
};

function read(k: string) {
  return process.env[k] ?? process.env[`NEXT_PUBLIC_${k}`];
}

export function getHubConfig(): HubConfig {
  return {
    name: read('HUB_NAME') ?? 'NL-AMS Hub',
    address1: read('HUB_ADDRESS1') ?? 'Set HUB_ADDRESS1',
    address2: read('HUB_ADDRESS2') ?? '',
    postcode: read('HUB_POSTCODE') ?? '',
    city: read('HUB_CITY') ?? '',
    country: read('HUB_COUNTRY') ?? 'NL',
    contact: read('HUB_CONTACT') ?? '',
    phone: read('HUB_PHONE') ?? '',
    email: read('HUB_EMAIL') ?? '',
  };
}
