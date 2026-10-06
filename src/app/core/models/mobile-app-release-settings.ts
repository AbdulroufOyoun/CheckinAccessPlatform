export interface MobileAppReleaseChange {
  field: string;
  old: string | null;
  new: string | null;
}

export interface MobileAppReleaseHistoryEntry {
  id: number;
  created_at: string | null;
  notes: string | null;
  changes: MobileAppReleaseChange[];
  changed_by: { id: number; name: string; email: string } | null;
}

export interface MobileAppReleaseSettings {
  android_minimum_version: string;
  android_latest_version: string;
  android_store_url: string | null;
  ios_minimum_version: string;
  ios_latest_version: string;
  ios_store_url: string | null;
  updated_at?: string | null;
  history?: MobileAppReleaseHistoryEntry[];
}

export interface MobileAppReleaseUpdatePayload {
  android_minimum_version: string;
  android_latest_version: string;
  android_store_url: string | null;
  ios_minimum_version: string;
  ios_latest_version: string;
  ios_store_url: string | null;
  notes?: string | null;
}
