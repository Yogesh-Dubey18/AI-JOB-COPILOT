import { describe, expect, it } from "vitest";
import { getStorageConfigurationFailures } from "../src/config/env.js";
import { assertStorageProviderReady } from "../src/services/storage.service.js";

const emptyProviders = {
  STORAGE_BUCKET_NAME: "",
  STORAGE_ACCESS_KEY_ID: "",
  STORAGE_SECRET_ACCESS_KEY: "",
  STORAGE_ENDPOINT: "",
  CLOUDINARY_URL: "",
  CLOUDINARY_CLOUD_NAME: "",
  CLOUDINARY_API_KEY: "",
  CLOUDINARY_API_SECRET: ""
};

describe("storage provider configuration validation", () => {
  it("rejects incomplete S3/R2 config and requires an R2 endpoint", () => {
    expect(getStorageConfigurationFailures({ ...emptyProviders, STORAGE_PROVIDER: "s3" })).toContain(
      "S3/R2 storage requires STORAGE_BUCKET_NAME, STORAGE_ACCESS_KEY_ID, and STORAGE_SECRET_ACCESS_KEY."
    );
    expect(getStorageConfigurationFailures({
      ...emptyProviders,
      STORAGE_PROVIDER: "r2",
      STORAGE_BUCKET_NAME: "bucket",
      STORAGE_ACCESS_KEY_ID: "access",
      STORAGE_SECRET_ACCESS_KEY: "secret"
    })).toContain("STORAGE_ENDPOINT is required for R2.");
  });

  it("accepts complete S3/R2 settings and rejects unknown providers", () => {
    const credentials = { ...emptyProviders, STORAGE_BUCKET_NAME: "bucket", STORAGE_ACCESS_KEY_ID: "access", STORAGE_SECRET_ACCESS_KEY: "secret" };
    expect(getStorageConfigurationFailures({ ...credentials, STORAGE_PROVIDER: "s3" })).toEqual([]);
    expect(getStorageConfigurationFailures({ ...credentials, STORAGE_PROVIDER: "r2", STORAGE_ENDPOINT: "https://account.r2.cloudflarestorage.com" })).toEqual([]);
    expect(getStorageConfigurationFailures({ ...emptyProviders, STORAGE_PROVIDER: "ftp" })).toContain("STORAGE_PROVIDER must be local, s3, r2, or cloudinary.");
  });

  it("does not silently ignore partial Cloudinary settings under the local default", () => {
    expect(getStorageConfigurationFailures({
      ...emptyProviders,
      STORAGE_PROVIDER: "local",
      CLOUDINARY_CLOUD_NAME: "example-cloud"
    })).toContain("Partial Cloudinary credentials are configured; complete them or remove them to avoid silently using local storage.");
    expect(getStorageConfigurationFailures({
      ...emptyProviders,
      STORAGE_PROVIDER: "local",
      CLOUDINARY_CLOUD_NAME: "example-cloud",
      CLOUDINARY_API_KEY: "example-key",
      CLOUDINARY_API_SECRET: "example-secret"
    })).toEqual([]);
  });

  it("fails closed when a remote provider is selected but unavailable", () => {
    expect(() => assertStorageProviderReady("s3", false)).toThrow(/configuration is incomplete/i);
    expect(() => assertStorageProviderReady("r2", false)).toThrow(/configuration is incomplete/i);
    expect(() => assertStorageProviderReady("cloudinary", false)).toThrow(/configuration is incomplete/i);
    expect(() => assertStorageProviderReady("local", true)).not.toThrow();
  });
});
